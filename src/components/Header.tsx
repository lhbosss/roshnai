"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { ResponsiveImage } from '@/components/ui/image';

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';
  
  // Hide header on homepage (has its own nav), login, and register pages
  if (isHomePage || isRegister || isLogin) return null;
  
  // Other pages: show the authenticated header
  return (
    <header style={{ 
      borderBottom: '1px solid var(--border-light)', 
      backgroundColor: 'var(--bg-secondary)', 
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ResponsiveImage
            src="/roshanaie+u.png"
            alt="Roshanai Library Logo"
            aspectRatio="1/1"
            className="w-8 h-8"
            priority={true}
          />
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: 'var(--accent-primary)',
            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Roshanai Library
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a 
            href="/my-books" 
            style={{ 
              color: pathname === '/my-books' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/my-books' ? '500' : '400',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
          >
            My Books
          </a>
          <a 
            href="/borrow" 
            style={{ 
              color: pathname === '/borrow' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/borrow' ? '500' : '400',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
          >
            Browse Books
          </a>
          <a 
            href="/transactions" 
            style={{ 
              color: pathname === '/transactions' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/transactions' ? '500' : '400',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
          >
            Transactions
          </a>
          <a 
            href="/profile" 
            style={{ 
              color: pathname === '/profile' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/profile' ? '500' : '400',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
          >
            Profile
          </a>
        </nav>
      </div>
    </header>
  );
}
