'use client';
import React, { useState } from 'react';
import BookSearch from '@/components/BookSearch';

type ExtBook = {
  key: string;
  title: string;
  authors: string[];
  year?: number;
  isbn?: string;
  coverUrl?: string;
};

export default function AddBookPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExtBook[]>([]);
  const [error, setError] = useState('');

  async function doSearch() {
    const query = q.trim();
    if (!query) { setResults([]); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/books/lookup?q=' + encodeURIComponent(query), { cache: 'no-store' as any });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data.message || 'Search failed');
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'calc(100vh - 120px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ width:'100%' }}>
        <h1 style={{ textAlign:'center', marginBottom:24 }}>Add a Book</h1>
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>
          {/* Option 1: Search for a book */}
          <section className="card" style={{ padding:16 }}>
            <h2 style={{ marginTop:0, textAlign:'center' }}>Search for a book</h2>
            <BookSearch />
          </section>

          {/* Option 2: Add manually with picture */}
          <section className="card" style={{ padding:16, textAlign:'center' }}>
            <h2 style={{ marginTop:0 }}>Add a book manually with picture</h2>
            <p style={{ color:'#666' }}>Upload details and a cover image manually.</p>
            <a href="/my-books/add/manual"><button>manually add</button></a>
          </section>
        </div>
      </div>
    </div>
  );
}
