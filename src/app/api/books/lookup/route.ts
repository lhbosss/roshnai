import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

// Proxy search to Open Library for title/author/ISBN queries.
export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    // Choose endpoint: if q looks like ISBN (10 or 13 digits possibly with hyphens), use ISBN lookup; else use search.
    const isbnLike = /^(97[89][- ]?)?\d{1,5}([- ]?)\d{1,7}\2\d{1,7}\2[\dX]$/i.test(q.replace(/\s+/g,'')) || /^\d{10}(\d{3})?$/.test(q.replace(/[-\s]/g,''));

    let items: any[] = [];
    if (isbnLike) {
      const clean = q.replace(/[-\s]/g, '');
      const resp = await fetch(`https://openlibrary.org/isbn/${clean}.json`, { next: { revalidate: 0 } });
      if (resp.ok) {
        const book = await resp.json();
        const title = book.title || '';
        const year = book.first_publish_year || book.publish_date;
        let authors: string[] = [];
        if (Array.isArray(book.authors)) {
          const authorKeys = book.authors.map((a: any) => a.key).filter(Boolean);
          const fetched = await Promise.all(authorKeys.map(async (k: string) => {
            try {
              const ar = await fetch(`https://openlibrary.org${k}.json`);
              if (!ar.ok) return null;
              const aj = await ar.json();
              return aj.name as string;
            } catch { return null; }
          }));
          authors = fetched.filter(Boolean) as string[];
        }
        const covers = Array.isArray(book.covers) ? book.covers : [];
        const coverUrl = covers.length ? `https://covers.openlibrary.org/b/id/${covers[0]}-M.jpg` : undefined;
        items = [{ key: `ISBN:${clean}`, title, authors, year, isbn: clean, coverUrl }];
      }
    } else {
      const resp = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`, { next: { revalidate: 0 } });
      if (!resp.ok) throw new Error('Lookup failed');
      const data = await resp.json();
      items = (data.docs || []).map((d: any) => ({
        key: d.key,
        title: d.title,
        authors: d.author_name || [],
        year: d.first_publish_year,
        isbn: Array.isArray(d.isbn) ? d.isbn[0] : undefined,
        coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined,
      }));
    }

    return NextResponse.json({ results: items });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Lookup error' }, { status: 500 });
  }
}
