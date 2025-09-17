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
      style={{ 
        position: 'fixed', 
        right: '24px', 
        bottom: '24px', 
        width: '60px', 
        height: '60px', 
        borderRadius: '50%', 
        background: 'var(--accent-primary)', 
        boxShadow: 'var(--shadow-lg)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000,
        transition: 'all 0.2s ease',
        textDecoration: 'none'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
    >
      <span style={{ fontSize: '24px' }}>💬</span>
      <span style={{ 
        position: 'absolute', 
        top: '-2px', 
        right: '-2px', 
        background: 'var(--error)', 
        color: 'white', 
        borderRadius: '50%', 
        fontSize: '10px', 
        lineHeight: '16px', 
        width: '16px', 
        height: '16px', 
        textAlign: 'center',
        border: '2px solid white',
        boxShadow: 'var(--shadow-sm)'
      }}>
        •
      </span>
    </a>
  );
}
