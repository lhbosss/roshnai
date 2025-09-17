'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
  // Client-side validations
  const domain = '@student.nust.edu.pk';
  if (!email.endsWith(domain)) throw new Error(`Email must end with ${domain}`);
  if (!/^[a-z0-9_]{3,20}$/i.test(username)) throw new Error('Invalid username. Use 3-20 letters, numbers, or _.');
  if (password !== confirmPassword) throw new Error('Passwords do not match');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, username, email, password, department, batch })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      router.push('/');
    } catch (err:any) { setError(err.message); } finally { setLoading(false); }
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
        <h1 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '1.75rem' }}>Join Roshanai</h1>
        <p style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--text-secondary)' }}>
          Create your account to start sharing books
        </p>
        <form onSubmit={handleSubmit} className="form-group">
          <input 
            placeholder="Full name" 
            value={name} 
            onChange={e=>setName(e.target.value)} 
            required 
          />
          <input 
            placeholder="Username" 
            value={username} 
            onChange={e=>setUsername(e.target.value)} 
            required 
          />
          <select 
            value={department} 
            onChange={e=>setDepartment(e.target.value)} 
            required
            style={{ color: department ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            <option value="" disabled>Select Department</option>
            <option>SCEE</option>
            <option>SCME</option>
            <option>SEECS</option>
            <option>SMME</option>
            <option>USPCAS-E</option>
            <option>IESE</option>
            <option>NICE</option>
            <option>IGIS</option>
            <option>NBS</option>
            <option>SADA</option>
            <option>CIPS</option>
            <option>NIPCONS</option>
            <option>S3H</option>
            <option>NLS</option>
            <option>JSPPL</option>
            <option>ASAB</option>
            <option>SNS</option>
            <option>NSHS</option>
            <option>SINES</option>
          </select>
          <select 
            value={batch} 
            onChange={e=>setBatch(e.target.value)} 
            required
            style={{ color: batch ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            <option value="" disabled>Select Batch</option>
            <option>2k22</option>
            <option>2k23</option>
            <option>2k24</option>
            <option>2k25</option>
          </select>
          <input 
            placeholder="Email address" 
            type="email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            required 
          />
          <input 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
          />
          <input 
            placeholder="Confirm password" 
            type="password" 
            value={confirmPassword} 
            onChange={e=>setConfirmPassword(e.target.value)} 
            required 
          />
          <button 
            disabled={loading}
            style={{ marginTop: '8px', padding: '14px 24px', fontSize: '16px' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already have an account? <a href="/">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
