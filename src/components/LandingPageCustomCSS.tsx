'use client';
import React from 'react';
import Image from 'next/image';

export default function LandingPageCustomCSS() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)' }}>
      {/* Navigation Header */}
      <nav style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '16px 24px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Image 
              src="/roshanaie+u.png" 
              alt="Roshanai Library Logo" 
              width={40} 
              height={40} 
              className="logo"
            />
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent', 
              backgroundClip: 'text' 
            }}>
              Roshanai
            </span>
          </div>

          {/* Auth Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => { window.location.href = '/login'; }}
              className="btn-secondary"
              style={{ 
                padding: '8px 20px', 
                fontSize: '14px',
                border: '1px solid var(--border-medium)',
                background: 'transparent'
              }}
            >
              Sign In
            </button>
            <button 
              onClick={() => { window.location.href = '/register'; }}
              style={{ 
                padding: '8px 20px', 
                fontSize: '14px',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '80px 24px' 
      }}>
        {/* Background Elements */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', 
            top: '80px', 
            left: '40px', 
            width: '128px', 
            height: '128px', 
            background: 'var(--accent-primary)', 
            borderRadius: '50%', 
            filter: 'blur(60px)' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            top: '160px', 
            right: '80px', 
            width: '160px', 
            height: '160px', 
            background: '#8b5cf6', 
            borderRadius: '50%', 
            filter: 'blur(60px)' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            bottom: '80px', 
            left: '33%', 
            width: '144px', 
            height: '144px', 
            background: '#6366f1', 
            borderRadius: '50%', 
            filter: 'blur(60px)' 
          }}></div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          {/* Main Headline */}
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '24px', 
            lineHeight: 1.1 
          }}>
            Read More.{' '}
            <span style={{ 
              background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent', 
              backgroundClip: 'text' 
            }}>
              Spend Less.
            </span>
          </h1>

          {/* Subtext */}
          <p style={{ 
            fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', 
            color: 'var(--text-secondary)', 
            marginBottom: '32px', 
            maxWidth: '800px', 
            margin: '0 auto 32px auto', 
            lineHeight: 1.6 
          }}>
            Discover thousands of books at your fingertips without breaking the bank. 
            Join our community-driven library where knowledge flows freely.
          </p>

          {/* CTA Buttons */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginBottom: '64px'
          }}>
            <button 
              onClick={() => { window.location.href = '/register'; }}
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', 
                color: 'white', 
                padding: '16px 32px', 
                borderRadius: '50px', 
                fontSize: '18px', 
                fontWeight: '600', 
                border: 'none', 
                cursor: 'pointer',
                minWidth: '200px',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}>
              Start Borrowing Today
            </button>
            <button 
              onClick={() => { window.location.href = '/login'; }}
              style={{ 
                border: '2px solid var(--border-medium)', 
                color: 'var(--text-primary)', 
                padding: '14px 32px', 
                borderRadius: '50px', 
                fontSize: '18px', 
                fontWeight: '600', 
                background: 'var(--bg-secondary)', 
                cursor: 'pointer',
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--bg-accent)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}>
              Sign In
            </button>
          </div>

          {/* Hero Illustration */}
          <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: '24px', 
              boxShadow: 'var(--shadow-lg)', 
              padding: '48px 32px', 
              border: '1px solid var(--border-light)' 
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', 
                gap: '16px', 
                marginBottom: '32px',
                justifyItems: 'center'
              }}>
                {/* Book Spines */}
                {[
                  { color: '#ef4444', height: '120px' },
                  { color: 'var(--accent-primary)', height: '150px' },
                  { color: '#10b981', height: '130px' },
                  { color: '#8b5cf6', height: '160px' },
                  { color: '#f59e0b', height: '120px' },
                  { color: '#6366f1', height: '140px' },
                  { color: '#ec4899', height: '155px' },
                  { color: '#14b8a6', height: '135px' }
                ].map((book, index) => (
                  <div key={index} style={{ 
                    background: book.color, 
                    height: book.height, 
                    width: '60px',
                    borderRadius: 'var(--radius-md)', 
                    boxShadow: 'var(--shadow-sm)', 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    padding: '8px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: 'rgba(255, 255, 255, 0.3)', 
                      borderRadius: '4px' 
                    }}></div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'var(--bg-accent)', 
                  borderRadius: '50px', 
                  padding: '12px 24px' 
                }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    background: 'var(--success)', 
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>1,000+ books available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ 
              fontSize: 'clamp(2rem, 6vw, 3rem)', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '16px' 
            }}>
              Why Choose Our Library?
            </h2>
            <p style={{ 
              fontSize: '1.25rem', 
              color: 'var(--text-secondary)', 
              maxWidth: '600px', 
              margin: '0 auto' 
            }}>
              Experience the future of reading with our innovative book lending platform
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '32px' 
          }}>
            {/* Feature 1: Save Money */}
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
              padding: '32px', 
              textAlign: 'center', 
              border: '1px solid #bbf7d0',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, var(--success), #059669)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px auto', 
                boxShadow: 'var(--shadow-md)' 
              }}>
                <span style={{ fontSize: '2rem' }}>💰</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Save Money
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Access thousands of books for a fraction of the cost. Why buy when you can borrow? 
                Save up to 90% on your reading expenses.
              </p>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                color: 'var(--success)', 
                fontWeight: '600',
                fontSize: '14px'
              }}>
                <span>Learn more</span>
                <span style={{ marginLeft: '8px' }}>→</span>
              </div>
            </div>

            {/* Feature 2: Endless Stories */}
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
              padding: '32px', 
              textAlign: 'center', 
              border: '1px solid #93c5fd',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, var(--accent-primary), #1d4ed8)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px auto', 
                boxShadow: 'var(--shadow-md)' 
              }}>
                <span style={{ fontSize: '2rem' }}>📚</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Endless Stories
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Explore genres from mystery to romance, fiction to non-fiction. 
                Our growing collection ensures you'll never run out of great reads.
              </p>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                color: 'var(--accent-primary)', 
                fontWeight: '600',
                fontSize: '14px'
              }}>
                <span>Browse books</span>
                <span style={{ marginLeft: '8px' }}>→</span>
              </div>
            </div>

            {/* Feature 3: Join Community */}
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%)', 
              padding: '32px', 
              textAlign: 'center', 
              border: '1px solid #d8b4fe',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px auto', 
                boxShadow: 'var(--shadow-md)' 
              }}>
                <span style={{ fontSize: '2rem' }}>👥</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Reading Community
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Connect with fellow book lovers, share recommendations, and discover hidden gems. 
                Reading is better when shared.
              </p>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                color: '#8b5cf6', 
                fontWeight: '600',
                fontSize: '14px'
              }}>
                <span>Join community</span>
                <span style={{ marginLeft: '8px' }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '80px 24px', 
        background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 6vw, 3rem)', 
            fontWeight: '700', 
            color: 'white', 
            marginBottom: '24px' 
          }}>
            Ready to Start Reading?
          </h2>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginBottom: '32px', 
            maxWidth: '600px', 
            margin: '0 auto 32px auto' 
          }}>
            Join thousands of students who are already saving money and discovering amazing books through our platform.
          </p>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            justifyContent: 'center', 
            alignItems: 'center'
          }}>
            <button 
              onClick={() => { window.location.href = '/register'; }}
              style={{ 
                background: 'white', 
                color: 'var(--accent-primary)', 
                padding: '16px 32px', 
                borderRadius: '50px', 
                fontSize: '18px', 
                fontWeight: '600', 
                border: 'none', 
                cursor: 'pointer',
                minWidth: '200px',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
            >
              Get Started Free
            </button>
            <button 
              onClick={() => { window.location.href = '/login'; }}
              style={{ 
                border: '2px solid white', 
                color: 'white', 
                padding: '14px 32px', 
                borderRadius: '50px', 
                fontSize: '18px', 
                fontWeight: '600', 
                background: 'transparent', 
                cursor: 'pointer',
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'white';
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}