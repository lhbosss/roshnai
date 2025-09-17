"use client";
import React, { useEffect, useState } from 'react';

interface Tx { 
  _id: string; 
  status: string; 
  rentalPrice: number; 
  platformCommission: number; 
  book?: any; 
  lender?: any; 
  borrower?: any;
  createdAt?: string;
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    const res = await fetch('/api/transactions');
    if (!res.ok) { 
      setError('Failed to load transactions'); 
      setLoading(false); 
      return; 
    }
    const data = await res.json();
    setTxs(data.transactions || []); 
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'var(--warning)';
      case 'active': return 'var(--success)';
      case 'completed': return 'var(--accent-primary)';
      case 'rejected': return 'var(--error)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '⏳';
      case 'active': return '📖';
      case 'completed': return '✅';
      case 'rejected': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '8px', 
          background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          backgroundClip: 'text' 
        }}>
          My Transactions
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Track your borrowing and lending activity
        </p>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading your transactions...</p>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ textAlign: 'center', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {txs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {txs.map(t => (
                <div key={t._id} className="card fade-in" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    {/* Book Cover */}
                    <div style={{ flexShrink: 0 }}>
                      <div className="book-cover" style={{ width: '80px', height: '120px' }}>
                        <img 
                          src={t.book?.coverUrl || '/Asset2.png'} 
                          alt={t.book?.title || 'Book'} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            borderRadius: 'var(--radius-md)' 
                          }} 
                        />
                      </div>
                    </div>

                    {/* Transaction Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ 
                            margin: '0 0 4px 0', 
                            fontSize: '1.25rem', 
                            fontWeight: '600',
                            color: 'var(--text-primary)' 
                          }}>
                            {t.book?.title || 'Unknown Book'}
                          </h3>
                          <p style={{ 
                            margin: '0 0 8px 0', 
                            color: 'var(--text-secondary)',
                            fontSize: '14px' 
                          }}>
                            by {t.book?.author || 'Unknown Author'}
                          </p>
                        </div>
                        
                        {/* Status Badge */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-accent)',
                          border: `1px solid ${getStatusColor(t.status)}20`
                        }}>
                          <span>{getStatusIcon(t.status)}</span>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '500',
                            color: getStatusColor(t.status),
                            textTransform: 'capitalize'
                          }}>
                            {t.status}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '16px',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <p style={{ 
                            fontSize: '12px', 
                            fontWeight: '500', 
                            color: 'var(--text-muted)', 
                            margin: '0 0 4px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Rental Price
                          </p>
                          <p style={{ 
                            fontSize: '18px', 
                            fontWeight: '600', 
                            color: 'var(--success)', 
                            margin: 0 
                          }}>
                            ${t.rentalPrice}
                          </p>
                        </div>
                        
                        <div>
                          <p style={{ 
                            fontSize: '12px', 
                            fontWeight: '500', 
                            color: 'var(--text-muted)', 
                            margin: '0 0 4px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Platform Fee
                          </p>
                          <p style={{ 
                            fontSize: '16px', 
                            fontWeight: '500', 
                            color: 'var(--text-secondary)', 
                            margin: 0 
                          }}>
                            ${t.platformCommission}
                          </p>
                        </div>
                      </div>

                      {/* Participants */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '24px', 
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}>
                        {t.lender && (
                          <div>
                            <span style={{ fontWeight: '500' }}>Lender: </span>
                            <span>{t.lender.name}</span>
                          </div>
                        )}
                        {t.borrower && (
                          <div>
                            <span style={{ fontWeight: '500' }}>Borrower: </span>
                            <span>{t.borrower.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                No transactions yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Start borrowing or lending books to see your transaction history
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { window.location.href='/borrow'; }}
                  style={{ padding: '12px 24px', fontSize: '16px' }}
                >
                  Browse Books
                </button>
                <button 
                  onClick={() => { window.location.href='/my-books/add'; }}
                  className="btn-secondary"
                  style={{ padding: '12px 24px', fontSize: '16px' }}
                >
                  Add a Book
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
