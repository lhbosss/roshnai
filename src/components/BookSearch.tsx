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
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [addFormData, setAddFormData] = useState({
    rentalFee: '100',
    securityDeposit: '200',
    condition: 'good' as 'new' | 'like-new' | 'good' | 'fair' | 'poor',
    rentalDuration: '14'
  });

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
        body: JSON.stringify({ 
          title: item.title, 
          author: item.author, 
          description: 'Imported from Open Library', 
          coverUrl: item.coverUrl,
          rentalFee: Number(addFormData.rentalFee),
          securityDeposit: Number(addFormData.securityDeposit),
          condition: addFormData.condition,
          rentalDuration: Number(addFormData.rentalDuration)
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data.message || 'Failed to add book');
      }
      // Close the form and redirect to My Books catalogue
      setShowAddForm(null);
      window.location.href = '/my-books';
    } catch (e: any) {
      alert(e.message || 'Failed to add book');
    } finally {
      setAddingId(null);
    }
  }

  function handleAddClick(item: ResultItem) {
    setShowAddForm(item.id);
  }

  function handleAddFormSubmit(item: ResultItem) {
    addToMyBooks(item);
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
              
              {showAddForm === r.id ? (
                <div style={{ 
                  position: 'fixed', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  backgroundColor: 'rgba(0,0,0,0.5)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  zIndex: 1000, 
                  padding: '16px' 
                }}>
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    padding: '24px', 
                    maxWidth: '400px', 
                    width: '100%',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px', textAlign: 'center' }}>
                      Set Rental Details
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', textAlign: 'center' }}>
                      <strong>{r.title}</strong> by {r.author}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                            Rental Fee (PKR)
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="5000"
                            value={addFormData.rentalFee}
                            onChange={(e) => setAddFormData(prev => ({ ...prev, rentalFee: e.target.value }))}
                            style={{ width: '100%', fontSize: '14px', padding: '8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                            Security Deposit (PKR)
                          </label>
                          <input
                            type="number"
                            min="50"
                            max="10000"
                            value={addFormData.securityDeposit}
                            onChange={(e) => setAddFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                            style={{ width: '100%', fontSize: '14px', padding: '8px' }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                            Condition
                          </label>
                          <select
                            value={addFormData.condition}
                            onChange={(e) => setAddFormData(prev => ({ ...prev, condition: e.target.value as any }))}
                            style={{ width: '100%', fontSize: '14px', padding: '8px' }}
                          >
                            <option value="new">New</option>
                            <option value="like-new">Like New</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                            Max Days
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={addFormData.rentalDuration}
                            onChange={(e) => setAddFormData(prev => ({ ...prev, rentalDuration: e.target.value }))}
                            style={{ width: '100%', fontSize: '14px', padding: '8px' }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button
                        onClick={() => setShowAddForm(null)}
                        style={{ 
                          flex: 1, 
                          padding: '10px', 
                          fontSize: '14px', 
                          backgroundColor: '#f3f4f6', 
                          color: '#374151',
                          border: '1px solid #d1d5db'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddFormSubmit(r)}
                        disabled={addingId === r.id}
                        style={{ 
                          flex: 1, 
                          padding: '10px', 
                          fontSize: '14px'
                        }}
                      >
                        {addingId === r.id ? 'Adding...' : 'Add Book'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAddClick(r)}
                  style={{ marginTop:6, fontSize:12, padding:'6px 10px' }}
                  title={`${r.title} — ${r.author}`}
                >
                  Add to Library
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
