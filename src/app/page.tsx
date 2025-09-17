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
    <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="card" style={{ width:360, border:'none' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <Image src="/roshanaie+u.png" alt="Roshanai Library Logo" width={140} height={140} priority />
        </div>
        <h1 style={{ textAlign:'center', margin:'0 0 12px' }}>Login</h1>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button disabled={loading}>{loading? 'Logging in...' : 'Login'}</button>
          {error && <p style={{ color:'red', margin:0 }}>{error}</p>}
        </form>
        <p style={{ marginTop:12, textAlign:'center' }}>No account? <a href="/register">Register</a></p>
      </div>
    </div>
  );
}
