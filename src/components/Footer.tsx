"use client";
import React from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';
  
  // Hide footer on homepage (has its own footer), login, and register pages
  if (isHomePage || isRegister || isLogin) return null;
  
  return (
    <footer style={{ 
      borderTop: '1px solid var(--border-light)', 
      backgroundColor: 'var(--bg-secondary)',
      marginTop: 'auto',
      padding: '24px 0'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 24px',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '32px', 
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <a 
            href="/policies/privacy" 
            style={{ 
              color: 'var(--text-secondary)', 
              textDecoration: 'none', 
              fontSize: '14px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Privacy Policy
          </a>
          <a 
            href="/policies/returns" 
            style={{ 
              color: 'var(--text-secondary)', 
              textDecoration: 'none', 
              fontSize: '14px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Return Policy
          </a>
          <a 
            href="/policies/service" 
            style={{ 
              color: 'var(--text-secondary)', 
              textDecoration: 'none', 
              fontSize: '14px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Terms of Service
          </a>
          <a 
            href="tel:+923275526100" 
            style={{ 
              color: 'var(--text-secondary)', 
              textDecoration: 'none', 
              fontSize: '14px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            📞 +92 327 5526100
          </a>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px', 
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            📍 Nust Business School, NUST, H-12, Islamabad
          </span>
        </div>
        <p style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: 'var(--text-muted)' 
        }}>
          © 2025 Readioo. All rights reserved. | Student book lending platform
        </p>
      </div>
    </footer>
  );
}