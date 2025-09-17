"use client";
import React, { useEffect, useState } from 'react';

interface Complaint { _id:string; reason:string; status:string; transaction?:any; against?:any; }

export default function ComplaintsPage(){
  const [complaints,setComplaints]=useState<Complaint[]>([]);
  const [transactionId,setTransactionId]=useState('');
  const [againstUserId,setAgainstUserId]=useState('');
  const [reason,setReason]=useState('');
  const [loading,setLoading]=useState(true);

  async function load(){
    const res= await fetch('/api/complaints');
    if(res.ok){ const data= await res.json(); setComplaints(data.complaints||[]); }
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    const res= await fetch('/api/complaints',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ transactionId, againstUserId, reason })});
    if(res.ok){ setTransactionId(''); setAgainstUserId(''); setReason(''); load(); }
  }

  return <div>
    <h1>Complaints</h1>
    <form onSubmit={submit} style={{display:'flex', gap:8, flexWrap:'wrap'}}>
      <input placeholder='Transaction ID' value={transactionId} onChange={e=>setTransactionId(e.target.value)} required />
      <input placeholder='Against User ID' value={againstUserId} onChange={e=>setAgainstUserId(e.target.value)} required />
      <input placeholder='Reason' value={reason} onChange={e=>setReason(e.target.value)} required />
      <button>File</button>
    </form>
    {loading && <p>Loading...</p>}
    <div style={{marginTop:16, display:'flex', flexDirection:'column', gap:8}}>
      {complaints.map(c=> <div key={c._id} style={{border:'1px solid #ddd', padding:8}}>
        <strong>{c.status}</strong>: {c.reason}
      </div>)}
      {!loading && !complaints.length && <p>No complaints.</p>}
    </div>
  </div>;
}
