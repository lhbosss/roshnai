"use client";
import React, { useEffect, useState } from 'react';

interface Tx { _id:string; status:string; rentalPrice:number; platformCommission:number; book?: any; lender?:any; borrower?:any; }

export default function TransactionsPage(){
  const [txs,setTxs]=useState<Tx[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  async function load(){
    setError('');
    const res= await fetch('/api/transactions');
    if(!res.ok){ setError('Failed to load'); setLoading(false); return; }
    const data= await res.json();
    setTxs(data.transactions||[]); setLoading(false);
  }
  useEffect(()=>{load();},[]);

  return <div>
    <h1>Transactions</h1>
    {loading && <p>Loading...</p>}
    {error && <p style={{color:'red'}}>{error}</p>}
    <div style={{display:'flex', flexDirection:'column', gap:12}}>
      {txs.map(t=> <div key={t._id} style={{border:'1px solid #ddd', padding:12}}>
        <strong>{t.book?.title || 'Book'}</strong><br/>
        Status: {t.status} | Price: {t.rentalPrice} | Fee: {t.platformCommission}
      </div>)}
      {!loading && !txs.length && <p>No transactions.</p>}
    </div>
  </div>;
}
