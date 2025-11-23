'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Removed Next/Image to allow fully responsive cover sizing

interface Book { 
  _id: string; 
  title: string; 
  author: string; 
  description?: string; 
  rentalFee?: number;
  securityDeposit?: number;
  condition?: string;
  rentalDuration?: number;
}
interface SearchBook extends Book { lender?: { name:string }; }

export default function MyBooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [rentalFee, setRentalFee] = useState('100');
  const [securityDeposit, setSecurityDeposit] = useState('200');
  const [condition, setCondition] = useState<'new' | 'like-new' | 'good' | 'fair' | 'poor'>('good');
  const [rentalDuration, setRentalDuration] = useState('14');
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
    const res = await fetch('/api/books', { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ 
        title, 
        author, 
        description,
        coverUrl: '/images/default-book-cover.svg',
        rentalFee: parseFloat(rentalFee) || 100,
        securityDeposit: parseFloat(securityDeposit) || 200,
        condition,
        rentalDuration: parseInt(rentalDuration) || 14
      }) 
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message||'Failed'); return; }
    setTitle(''); 
    setAuthor(''); 
    setDescription('');
    setRentalFee('100');
    setSecurityDeposit('200');
    setCondition('good');
    setRentalDuration('14');
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
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          My Library
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Manage your personal book collection
        </p>
        
        {/* Action Buttons */}
        <div className="action-bar">
          <button 
            onClick={() => { window.location.href='/my-books/add'; }}
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            📚 Add a Book
          </button>
          <button 
            onClick={() => { window.location.href='/borrow'; }}
            className="btn-secondary"
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            🔍 Borrow Books
          </button>
        </div>
      </div>

      {/* Borrow panel (search) */}
      {searchOpen && (
        <section style={{ marginBottom: '40px' }}>
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginTop: 0, color: 'var(--accent-primary)' }}>Browse Available Books</h2>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>
              Search by title or author, or browse all available books below.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <input
                placeholder="Search by title or author..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'){ doSearch(); } }}
                style={{ flex: '1 1 300px', minWidth: '240px' }}
              />
              <button onClick={doSearch} style={{ whiteSpace: 'nowrap' }}>Search</button>
            </div>
            <div className="book-results">
              {results.map(r=> (
                <div key={r._id} className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div className="book-cover" style={{ width: '80px', flexShrink: 0 }}>
                      <img 
                        src={(r as any).coverUrl || '/images/default-book-cover.svg'} 
                        alt={r.title} 
                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="book-title" style={{ margin: '0 0 4px 0' }}>{r.title}</h3>
                      <p className="book-author" style={{ margin: '0 0 8px 0' }}>by {r.author}</p>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                        Lender: {r.lender?.name || 'Unknown'}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="number"
                          min={1}
                          placeholder="Rental price"
                          value={priceMap[r._id] || ''}
                          onChange={e=> setPriceMap(m=> ({ ...m, [r._id]: e.target.value }))}
                          style={{ width: '140px', flexShrink: 0 }}
                        />
                        <button 
                          onClick={() => requestBorrow(r._id)}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          Request to Borrow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!results.length && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No books found. Try a different search term.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Books Collection */}
      <section>
        {books.length ? (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>Your Collection ({books.length} books)</h2>
            </div>
            <div className="book-grid">
              {books.map(b=> (
                <div key={b._id} className="book-card fade-in">
                  <a href={`/books/${b._id}`} className="block">
                    <div className="book-cover">
                      <img
                        src={(b as any).coverUrl || '/images/default-book-cover.svg'}
                        alt={b.title}
                        loading="lazy"
                      />
                    </div>
                    <div className="book-info">
                      <div className="book-title">{b.title}</div>
                      <div className="book-author">{b.author}</div>
                    </div>
                  </a>
                  <div className="book-info">
                    <button 
                      onClick={() => removeBook(b._id)} 
                      className="btn-danger"
                      style={{ 
                        fontSize: '12px', 
                        padding: '6px 12px', 
                        marginTop: '8px',
                        width: '100%'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No books in your library yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Start building your collection by adding your first book
            </p>
            <button 
              onClick={() => { window.location.href='/my-books/add'; }}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              Add Your First Book
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
