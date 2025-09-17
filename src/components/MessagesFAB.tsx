'use client';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function MessagesFAB() {
  const [authed, setAuthed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' as any });
        if (!active) return;
        setAuthed(res.ok);
      } catch {
        if (!active) return;
        setAuthed(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Hide on public auth pages
  if (!authed) return null;
  if (pathname === '/' || pathname?.startsWith('/register')) return null;

  return (
    <a
      href="/messages"
      title="Messages"
      style={{ position:'fixed', right:24, bottom:24, width:56, height:56, borderRadius:28, background:'#fff', border:'1px solid #e5e7eb', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
    >
      <span style={{ fontSize:22 }}>💬</span>
      <span style={{ position:'absolute', top:-4, right:-4, background:'#ef4444', color:'#fff', borderRadius:9999, fontSize:11, lineHeight:'16px', width:18, height:18, textAlign:'center' }}>•</span>
    </a>
  );
}
