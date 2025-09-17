'use client';
import React, { useEffect, useState } from 'react';

interface Book { _id: string; title: string; author: string; description?: string; lender?: { name: string } }

export default function BorrowPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Book[]>([]);

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/books/search');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  }

  async function doSearch() {
    setLoading(true); setError('');
    try {
      const q = query.trim();
      const url = q ? '/api/books/search?q=' + encodeURIComponent(q) : '/api/books/search';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
        <a href="/my-books"><button>Close Borrow</button></a>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
        <input
          placeholder="Search by title or author"
          value={query}
          onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'){ doSearch(); } }}
          style={{ flex:'1 1 420px', minWidth:260, maxWidth:520 }}
        />
        <button onClick={doSearch}>Search</button>
      </div>

      {loading && <p style={{ marginTop:16 }}>Loading…</p>}
      {error && !loading && <p style={{ marginTop:16, color:'#b91c1c' }}>{error}</p>}

      <section style={{ marginTop:16 }}>
        {results.length ? (
          <div className="book-grid">
            {results.map(r => (
              <div key={r._id}>
                <div style={{ width:'100%', aspectRatio:'3 / 4', overflow:'hidden', borderRadius:6, background:'#fff' }}>
                  <img src={(r as any).coverUrl || '/Asset2.png'} alt={r.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                </div>
                <div style={{ marginTop:8, textAlign:'center' }}>
                  <strong>{r.title}</strong>
                  <div style={{ fontSize:12, color:'#555' }}>{r.author}</div>
                  <div style={{ fontSize:11, color:'#777' }}>Lender: {r.lender?.name || 'Unknown'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && <p style={{ textAlign:'center' }}>No books found.</p>
        )}
      </section>
    </div>
  );
}
