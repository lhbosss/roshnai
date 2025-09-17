'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        let msg = 'Login failed';
        try { const data = await res.json(); msg = data.message || msg; } catch {}
        throw new Error(msg);
      }
  // Hard redirect to ensure middleware sees the new cookie immediately
  window.location.href = '/my-books';
    } catch (err:any) {
      if (err?.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Network error: server unreachable. Is the Next.js dev server running?');
      } else {
        setError(err.message || 'Error');
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card fade-in">
        <div className="logo-container">
          <Image 
            src="/roshanaie+u.png" 
            alt="Roshanai Library Logo" 
            width={120} 
            height={120} 
            priority 
            className="logo"
          />
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '1.75rem' }}>Welcome Back</h1>
        <p style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--text-secondary)' }}>
          Sign in to access your book library
        </p>
        <form onSubmit={handleSubmit} className="form-group">
          <div>
            <input 
              placeholder="Email address" 
              type="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
            />
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              margin: '6px 0 0 0',
              fontStyle: 'italic'
            }}>
              Use Dept. issued email only e.g., ending with @student.nust.edu.pk
            </p>
          </div>
          <input 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
          />
          <button 
            disabled={loading}
            style={{ marginTop: '8px', padding: '14px 24px', fontSize: '16px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Don't have an account? <a href="/register">Create one here</a>
        </p>
      </div>
    </div>
  );
}
