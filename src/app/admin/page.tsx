"use client";
import React, { useEffect, useState } from 'react';

interface Dashboard { userCount:number; transactionCount:number; openComplaints:number; }
interface Complaint { _id:string; reason:string; status:string; }
interface User { _id:string; name:string; email:string; role:string; }

export default function AdminPage(){
  const [dash,setDash]=useState<Dashboard|null>(null);
  const [users,setUsers]=useState<User[]>([]);
  const [complaints,setComplaints]=useState<Complaint[]>([]);
  const [error,setError]=useState('');

  async function load(){
    setError('');
    const d = await fetch('/api/admin/dashboard');
    if(d.ok) setDash(await d.json()); else setError('Dashboard load failed');
    const u = await fetch('/api/admin/users'); if(u.ok){ const data= await u.json(); setUsers(data.users||[]); }
    const c = await fetch('/api/complaints'); if(c.ok){ const data= await c.json(); setComplaints(data.complaints||[]); }
  }
  useEffect(()=>{load();},[]);

  async function resolve(id:string, action:'resolve'|'reject'){
    const res = await fetch(`/api/admin/complaints/${id}/${action}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ resolution: action }) });
    if(res.ok) load();
  }
  async function delUser(id:string){
    const res = await fetch(`/api/admin/users/${id}`, { method:'DELETE' });
    if(res.ok) load();
  }

  return <div>
    <h1>Admin</h1>
    {error && <p style={{color:'red'}}>{error}</p>}
    {dash && <div style={{display:'flex', gap:16, marginTop:8}}>
      <div>Users: {dash.userCount}</div>
      <div>Transactions: {dash.transactionCount}</div>
      <div>Open Complaints: {dash.openComplaints}</div>
    </div>}
    <h2 style={{marginTop:32}}>Users</h2>
    {users.map(u=> <div key={u._id} style={{border:'1px solid #ddd', padding:8}}>
      {u.name} ({u.email}) [{u.role}] <button onClick={()=>delUser(u._id)}>Delete</button>
    </div>)}
    <h2 style={{marginTop:32}}>Complaints</h2>
    {complaints.map(c=> <div key={c._id} style={{border:'1px solid #ddd', padding:8}}>
      {c.reason} - {c.status}
      {c.status==='open' && <span style={{marginLeft:8}}>
        <button onClick={()=>resolve(c._id,'resolve')}>Resolve</button>
        <button onClick={()=>resolve(c._id,'reject')}>Reject</button>
      </span>}
    </div>)}
  </div>;
}
