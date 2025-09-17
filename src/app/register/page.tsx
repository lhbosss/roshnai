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
    <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div className="card" style={{ width:360, border:'none' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
      <Image src="/roshanaie+u.png" alt="Roshanai Library Logo" width={140} height={140} priority />
        </div>
        <h1 style={{ textAlign:'center', margin:'0 0 12px' }}>Ma chuda lo apni</h1>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
          <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
          <select value={department} onChange={e=>setDepartment(e.target.value)} required>
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
          <select value={batch} onChange={e=>setBatch(e.target.value)} required>
            <option value="" disabled>Select Batch</option>
            <option>2k22</option>
            <option>2k23</option>
            <option>2k24</option>
            <option>2k25</option>
          </select>
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <input placeholder="Confirm password" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
          <button disabled={loading}>{loading? 'Registering...' : 'Register'}</button>
          {error && <p style={{ color:'red', margin:0 }}>{error}</p>}
        </form>
        <p style={{ marginTop:12, textAlign:'center' }}>Have an account? <a href="/">Login</a></p>
      </div>
    </div>
  );
}
