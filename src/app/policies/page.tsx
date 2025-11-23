'use client';
import React from 'react';

export default function PoliciesPage() {
  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '16px', 
          background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          backgroundClip: 'text' 
        }}>
          Policies & Legal Information
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto' }}>
          Your trust is important to us. Please review our policies to understand how we protect your data, 
          handle returns, and provide our book lending services.
        </p>
      </div>

      {/* Contact Information Card */}
      <div className="card" style={{ 
        maxWidth: '600px', 
        margin: '0 auto 48px auto', 
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-accent) 100%)',
        border: '1px solid var(--accent-light)'
      }}>
        <h2 style={{ 
          color: 'var(--accent-primary)', 
          marginTop: 0, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          📍 Contact Information
        </h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Office Address</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Nust Business School<br />
              National University of Sciences and Technology (NUST)<br />
              H-12, Islamabad, Pakistan
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Contact Number</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              📞 <a href="tel:+923275526100" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                +92 327 5526100
              </a>
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Business Hours</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Monday - Friday: 9:00 AM - 5:00 PM<br />
              Saturday: 10:00 AM - 2:00 PM<br />
              Sunday: Closed
            </p>
          </div>
        </div>
      </div>

      {/* Policy Links Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '48px'
      }}>
        {/* Privacy Policy */}
        <a href="/policies/privacy" className="card" style={{ 
          textDecoration: 'none', 
          color: 'inherit',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ color: 'var(--accent-primary)', marginTop: 0, marginBottom: '12px' }}>
            Privacy Policy
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 0, lineHeight: 1.6 }}>
            Learn how we collect, use, and protect your personal information. 
            Your privacy is our priority.
          </p>
          <div style={{ 
            marginTop: '16px', 
            color: 'var(--accent-primary)', 
            fontSize: '14px', 
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            Read Privacy Policy <span>→</span>
          </div>
        </a>

        {/* Return & Refund Policy */}
        <a href="/policies/returns" className="card" style={{ 
          textDecoration: 'none', 
          color: 'inherit',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>↩️</div>
          <h3 style={{ color: 'var(--accent-primary)', marginTop: 0, marginBottom: '12px' }}>
            Return & Refund Policy
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 0, lineHeight: 1.6 }}>
            Understand our book return procedures, damage policies, and refund process 
            for a hassle-free experience.
          </p>
          <div style={{ 
            marginTop: '16px', 
            color: 'var(--accent-primary)', 
            fontSize: '14px', 
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            Read Return Policy <span>→</span>
          </div>
        </a>

        {/* Service Policy */}
        <a href="/policies/service" className="card" style={{ 
          textDecoration: 'none', 
          color: 'inherit',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📋</div>
          <h3 style={{ color: 'var(--accent-primary)', marginTop: 0, marginBottom: '12px' }}>
            Service Policy
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 0, lineHeight: 1.6 }}>
            Review the terms and conditions of our book lending service, 
            including usage guidelines and responsibilities.
          </p>
          <div style={{ 
            marginTop: '16px', 
            color: 'var(--accent-primary)', 
            fontSize: '14px', 
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            Read Service Policy <span>→</span>
          </div>
        </a>
      </div>

      {/* Additional Information */}
      <div className="card" style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'var(--bg-accent)'
      }}>
        <h3 style={{ color: 'var(--text-primary)', marginTop: 0 }}>
          📧 Need Help?
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
          If you have questions about our policies or need clarification on any aspect of our service, 
          please don't hesitate to contact us. Our team at NUST Business School is here to help.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a 
            href="tel:+923275526100" 
            className="btn-secondary"
            style={{ 
              padding: '12px 20px', 
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📞 Call Us
          </a>
          <a 
            href="/complaints" 
            style={{ 
              padding: '12px 20px', 
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            💬 File a Complaint
          </a>
        </div>
      </div>

      {/* Last Updated */}
      <div style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>
        Last updated: November 23, 2025
      </div>
    </div>
  );
}