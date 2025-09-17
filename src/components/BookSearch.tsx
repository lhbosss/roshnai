'use client';
import React, { useCallback, useMemo, useState } from 'react';

type OLDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
};

type ResultItem = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  year?: number;
};

export default function BookSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    const q = query.trim();
    setHasSearched(true);
    setError(null);
    setResults([]);
    if (!q) return;
    setLoading(true);
    try {
  const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&language=eng&limit=30`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const docs: OLDoc[] = data?.docs || [];
      const mapped: ResultItem[] = docs.slice(0, 30).map(d => ({
        id: d.key,
        title: d.title,
        author: d.author_name?.[0] || 'Unknown',
        coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined,
        year: d.first_publish_year,
      }));
      setResults(mapped);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchBooks();
    }
  }, [fetchBooks]);

  const placeholder = useMemo(() => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', background:'#f3f4f6', color:'#6b7280', fontSize:12, userSelect:'none' }}>
      No Cover Available
    </div>
  ), []);

  async function addToMyBooks(item: ResultItem) {
    try {
      setAddingId(item.id);
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: item.title, author: item.author, description: 'Imported from Open Library', coverUrl: item.coverUrl })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data.message || 'Failed to add book');
      }
      // Redirect to My Books catalogue
      window.location.href = '/my-books';
    } catch (e: any) {
      alert(e.message || 'Failed to add book');
    } finally {
      setAddingId(null);
    }
  }

  return (
  <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: 16 }}>
      <div style={{ display:'flex', gap:12, alignItems:'stretch', flexWrap:'wrap' }}>
        <input
          type="text"
          placeholder="Search by book name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Search by book name"
          style={{ flex:'1 1 320px', minWidth:240 }}
        />
        <button onClick={fetchBooks}>Search</button>
      </div>

      {loading && (
        <div style={{ marginTop: 16, color: '#4b5563' }}>Loading…</div>
      )}

      {error && !loading && (
        <div style={{ marginTop: 16, color: '#dc2626' }}>{error}</div>
      )}

      {!loading && !error && hasSearched && results.length === 0 && (
        <div style={{ marginTop: 16, color: '#4b5563' }}>No results</div>
      )}

      {!loading && !error && results.length > 0 && (
    <div className="book-grid" style={{ marginTop:16 }}>
          {results.map((r) => (
      <div key={r.id} style={{ display:'flex', flexDirection:'column', width:'100%', minWidth:0 }}>
              <div style={{ width:'100%', aspectRatio:'3 / 4', background:'#ffffff', overflow:'hidden' }}>
                {r.coverUrl ? (
                  <img src={r.coverUrl} alt={r.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy" />
                ) : (
                  placeholder
                )}
              </div>
              <div style={{ width:'100%', paddingTop:6, textAlign:'center' }}>
                <div style={{ fontWeight:600, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0 }} title={r.title}>{r.title}</div>
                <div style={{ fontSize:12, color:'#555', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0 }} title={`${r.author}${r.year ? ' • ' + r.year : ''}`}>
                  {r.author}{r.year ? ` • ${r.year}` : ''}
                </div>
              </div>
              <button
                onClick={() => addToMyBooks(r)}
                disabled={addingId === r.id}
                style={{ marginTop:6, fontSize:12, padding:'6px 10px' }}
                title={`${r.title} — ${r.author}`}
              >
                {addingId === r.id ? 'Adding…' : 'Select'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
