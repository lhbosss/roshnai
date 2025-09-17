'use client';
import React from 'react';

export default function ManualAddPlaceholder() {
  return (
    <div style={{ minHeight:'calc(100vh - 120px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div className="card" style={{ width:'100%', maxWidth:640, padding:16, textAlign:'center' }}>
        <h1 style={{ marginTop:0 }}>Manual Add (Coming Next)</h1>
        <p>We will add the manual add form with picture upload as per your instructions.</p>
        <a href="/my-books/add"><button>Back</button></a>
      </div>
    </div>
  );
}
