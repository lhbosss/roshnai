"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        // Clear any local state if needed
        setUser(null);
        // Redirect to login page
        window.location.href = '/';
      } else {
        console.error('Logout failed');
        setLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '32px' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ paddingTop: '32px' }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
            Access Denied
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Please sign in to view your profile
          </p>
          <button 
            onClick={() => { window.location.href = '/'; }}
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '8px', 
          background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          backgroundClip: 'text' 
        }}>
          Profile
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Manage your account settings and information
        </p>
      </div>

      {/* Profile Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* User Avatar and Basic Info */}
        <div className="card fade-in" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            fontSize: '3rem',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {user.name?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '1.75rem', 
            color: 'var(--text-primary)' 
          }}>
            {user.name}
          </h2>
          <p style={{ 
            margin: '0 0 16px 0', 
            color: 'var(--text-secondary)',
            fontSize: '1.125rem'
          }}>
            {user.email}
          </p>
          <div style={{ 
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent-primary)',
            fontSize: '14px',
            fontWeight: '500',
            textTransform: 'capitalize'
          }}>
            {user.role || 'Member'}
          </div>
        </div>

        {/* Account Details */}
        <div className="card fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '12px'
          }}>
            Account Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Full Name:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user.name}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Username:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user.username || 'Not set'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Email:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user.email}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Department:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user.department || 'Not specified'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Batch:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user.batch || 'Not specified'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Member Since:</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '12px'
          }}>
            Quick Actions
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <button 
              onClick={() => { window.location.href = '/my-books'; }}
              className="btn-secondary"
              style={{ 
                padding: '12px 16px', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}
            >
              📚 My Books
            </button>
            
            <button 
              onClick={() => { window.location.href = '/transactions'; }}
              className="btn-secondary"
              style={{ 
                padding: '12px 16px', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}
            >
              📋 Transactions
            </button>
            
            <button 
              onClick={() => { window.location.href = '/messages'; }}
              className="btn-secondary"
              style={{ 
                padding: '12px 16px', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}
            >
              💬 Messages
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <div className="card fade-in" style={{ padding: '24px', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: 'var(--error)',
            fontSize: '1.125rem'
          }}>
            Account Actions
          </h3>
          <p style={{ 
            margin: '0 0 20px 0', 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Sign out of your account. You'll need to sign in again to access your library.
          </p>
          
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn-danger"
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            {loggingOut ? (
              <>⏳ Signing Out...</>
            ) : (
              <>🚪 Sign Out</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
