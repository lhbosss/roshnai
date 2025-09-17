'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Removed Next/Image to allow fully responsive cover sizing

interface Book { _id: string; title: string; author: string; description?: string; }
interface SearchBook extends Book { lender?: { name:string }; }

export default function MyBooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchBook[]>([]);
  const [priceMap, setPriceMap] = useState<Record<string, string>>({});

  async function loadBooks() {
    // retry a couple times to avoid a brief race right after login
    let attempts = 0;
    while (attempts < 3) {
      const res = await fetch('/api/books/me', { credentials:'include', cache: 'no-store' as any });
      if (res.status === 200) {
        const data = await res.json();
        setBooks(data.books || []);
        return;
      }
      if (res.status !== 401) {
        break;
      }
      attempts++;
      await new Promise(r => setTimeout(r, 200));
    }
    router.push('/');
  }

  useEffect(()=> { loadBooks(); }, []);

  async function addBook(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/books', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, author, description }) });
    const data = await res.json();
    if (!res.ok) { setError(data.message||'Failed'); return; }
    setTitle(''); setAuthor(''); setDescription('');
    loadBooks();
  }

  async function removeBook(id: string) {
    if (!confirm('Remove this book from your catalogue?')) return;
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setBooks(prev => prev.filter(b => b._id !== id));
    } else {
      const data = await res.json().catch(() => ({} as any));
      alert(data.message || 'Failed to remove');
    }
  }

  async function doSearch() {
    const q = query.trim();
    const url = q ? '/api/books/search?q=' + encodeURIComponent(q) : '/api/books/search';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setResults(data.results || []);
    }
  }

  async function requestBorrow(bookId: string) {
    const rentalPrice = Number(priceMap[bookId]);
    if (!rentalPrice || rentalPrice <= 0) { alert('Enter a rental price'); return; }
    const res = await fetch('/api/transactions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ bookId, rentalPrice }) });
    const data = await res.json();
    if (!res.ok) { alert(data.message||'Failed'); return; }
    alert('Request submitted');
  }

  return (
  <div style={{ maxWidth: '100%', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Top action bar with centered buttons */}
      <div style={{ width:'100%', display:'flex', justifyContent:'center', gap:12, marginTop:16 }}>
        <button onClick={()=>{ /* Navigate to the new add page */ window.location.href='/my-books/add'; }}>
          Add a Book
        </button>
        <button onClick={()=>{ window.location.href='/borrow'; }}>
          Borrow a Book
        </button>
      </div>

      {/* Page title centered */}
      <h1 style={{ textAlign:'center', marginTop:12 }}>My Books Catalogue</h1>

      {/* Add Book panel */}
  {/* Inline add panel removed in favor of dedicated /my-books/add page */}

      {/* Borrow panel (search) */}
      {searchOpen && (
        <section style={{ marginTop:16, width:'100%', display:'flex', justifyContent:'center' }}>
          <div className="card" style={{ width:'100%', maxWidth:600 }}>
            <h2 style={{ marginTop:0 }}>Borrow a Book</h2>
            <p style={{ margin:'4px 0', color:'#666' }}>Search by title or author, or browse all available books below.</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <input
                placeholder="Search by title or author"
                value={query}
                onChange={e=>setQuery(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'){ doSearch(); } }}
                style={{ flex:'1 1 320px', minWidth:240 }}
              />
              <button onClick={doSearch}>Search</button>
            </div>
            <div style={{ marginTop:16 }}>
              {results.map(r=> (
                <div key={r._id} className="card" style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', gap:12 }}>
                    <img src={(r as any).coverUrl || '/Asset2.png'} alt={r.title} width={64} height={96} style={{ objectFit:'cover', borderRadius:4, display:'block' }} />
                    <div style={{ flex:1 }}>
                      <strong>{r.title}</strong> by {r.author}<br/>
                      <small>Lender: {r.lender?.name || 'Unknown'}</small>
                      <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                        <input
                          type="number"
                          min={1}
                          placeholder="Price"
                          value={priceMap[r._id] || ''}
                          onChange={e=> setPriceMap(m=> ({ ...m, [r._id]: e.target.value }))}
                          style={{width:120}}
                        />
                        <button onClick={()=>requestBorrow(r._id)}>Request</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!results.length && <p>No results.</p>}
            </div>
          </div>
        </section>
      )}

      {/* Catalogue grid */}
  <section style={{ marginTop:16, width:'100%' }}>
        {books.length ? (
          <div className="book-grid">
            {books.map(b=> (
              <div key={b._id}>
                <div style={{ width:'100%', aspectRatio:'3 / 4', overflow:'hidden', borderRadius:6, background:'#fff' }}>
                  <img
                    src={(b as any).coverUrl || '/Asset2.png'}
                    alt={b.title}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ marginTop:8, textAlign:'center' }}>
                  <strong>{b.title}</strong>
                  <div style={{ fontSize:12, color:'#555' }}>{b.author}</div>
                </div>
                <div style={{ marginTop:8, display:'flex', justifyContent:'center' }}>
                  <button onClick={() => removeBook(b._id)} style={{ fontSize:12, padding:'6px 10px' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign:'center' }}>No books yet.</p>
        )}
      </section>

  {/* Messages FAB is mounted globally in layout */}
    </div>
  );
}
