'use client';
import React from 'react';

export default function ReturnRefundPolicyPage() {
  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '16px', 
          background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          backgroundClip: 'text' 
        }}>
          ↩️ Return & Refund Policy
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto' }}>
          Clear guidelines for book returns, damage handling, and refund procedures to ensure a fair experience for all users.
        </p>
      </div>

      {/* Navigation */}
      <div style={{ marginBottom: '32px' }}>
        <a 
          href="/policies" 
          style={{ 
            color: 'var(--accent-primary)', 
            textDecoration: 'none', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            width: 'fit-content'
          }}
        >
          ← Back to Policies
        </a>
      </div>

      {/* Content */}
      <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ lineHeight: 1.6, color: 'var(--text-primary)' }}>
          
          {/* Effective Date */}
          <div style={{ 
            background: 'var(--accent-light)', 
            padding: '16px', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '32px',
            border: '1px solid var(--accent-primary)',
            borderLeft: '4px solid var(--accent-primary)'
          }}>
            <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-primary)' }}>
              <strong>Effective Date:</strong> November 23, 2025<br />
              <strong>Last Updated:</strong> November 23, 2025
            </p>
          </div>

          {/* Overview */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>1. Overview</h2>
            <p>
              This Return & Refund Policy outlines the procedures and conditions for returning borrowed books 
              and requesting refunds on our book lending platform. This policy ensures fair treatment for both 
              lenders and borrowers while maintaining the quality of books in our community.
            </p>
            <p style={{ 
              background: 'var(--bg-accent)', 
              padding: '12px', 
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--success)',
              marginTop: '16px'
            }}>
              <strong>Important:</strong> All transactions are conducted between NUST students and are subject 
              to university guidelines and this policy.
            </p>
          </section>

          {/* Book Return Policy */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>2. Book Return Policy</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2.1 Return Timeline</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li><strong>Standard Return:</strong> Books must be returned within the agreed rental period</li>
              <li><strong>Early Return:</strong> Books can be returned early, but rental fees are non-refundable unless damaged</li>
              <li><strong>Late Return:</strong> Late fees of PKR 50 per day apply after the due date</li>
              <li><strong>Maximum Rental:</strong> No book can be kept longer than 30 days</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2.2 Return Condition Requirements</h3>
            <p>Books must be returned in the same condition as received:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>No new damage, markings, or annotations</li>
              <li>All original components included (dust jacket, bookmarks, etc.)</li>
              <li>Clean and free from stains, odors, or moisture damage</li>
              <li>Structurally intact with no torn pages or broken binding</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2.3 Return Process</h3>
            <ol style={{ marginLeft: '20px' }}>
              <li><strong>Inspection:</strong> Lender inspects the book upon return</li>
              <li><strong>Confirmation:</strong> Both parties confirm the return in the app</li>
              <li><strong>Dispute Window:</strong> 24-hour window to report any issues</li>
              <li><strong>Transaction Complete:</strong> Escrow funds are released after confirmation</li>
            </ol>
          </section>

          {/* Damage Policy */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>3. Damage Policy</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>3.1 Damage Categories</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#10b981', marginBottom: '8px' }}>💚 Minor Damage (0-25% penalty)</h4>
              <ul style={{ marginLeft: '20px', marginBottom: '12px' }}>
                <li>Small scuffs on cover</li>
                <li>Minor corner wear</li>
                <li>Light pencil marks that can be erased</li>
                <li>Slightly bent pages</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>🧡 Moderate Damage (25-50% penalty)</h4>
              <ul style={{ marginLeft: '20px', marginBottom: '12px' }}>
                <li>Pen or permanent marker annotations</li>
                <li>Small tears in pages</li>
                <li>Water damage affecting readability</li>
                <li>Cover damage affecting structural integrity</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>❤️ Severe Damage (50-100% penalty)</h4>
              <ul style={{ marginLeft: '20px', marginBottom: '12px' }}>
                <li>Missing pages</li>
                <li>Broken or detached binding</li>
                <li>Extensive water damage</li>
                <li>Significant staining or odor</li>
                <li>Book rendered unreadable or unlendable</li>
              </ul>
            </div>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>3.2 Damage Assessment Process</h3>
            <ol style={{ marginLeft: '20px' }}>
              <li><strong>Initial Report:</strong> Lender reports damage within 24 hours of return</li>
              <li><strong>Photo Evidence:</strong> Clear photos of damage must be provided</li>
              <li><strong>Borrower Response:</strong> Borrower has 48 hours to respond</li>
              <li><strong>Mediation:</strong> If disputed, admin team reviews and decides</li>
              <li><strong>Penalty Applied:</strong> Damage penalty is deducted from borrower's account</li>
            </ol>
          </section>

          {/* Refund Policy */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>4. Refund Policy</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.1 Eligible Refund Scenarios</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li><strong>Book Not Available:</strong> Full refund if lender cancels after payment</li>
              <li><strong>Misrepresented Condition:</strong> Full refund if book condition was falsely advertised</li>
              <li><strong>Platform Error:</strong> Full refund for technical errors causing overcharges</li>
              <li><strong>Lender Violation:</strong> Partial/full refund if lender violates terms</li>
              <li><strong>Quality Issues:</strong> Partial refund for books significantly different from description</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.2 Non-Refundable Scenarios</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Change of mind after rental begins</li>
              <li>Early return of undamaged books</li>
              <li>Late fees and penalties</li>
              <li>Borrower-caused damage to books</li>
              <li>Violation of platform terms by borrower</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.3 Refund Process</h3>
            <ol style={{ marginLeft: '20px' }}>
              <li><strong>Request Submission:</strong> Submit refund request through platform or contact us</li>
              <li><strong>Initial Review:</strong> Admin team reviews request within 2 business days</li>
              <li><strong>Investigation:</strong> Detailed investigation if required (3-7 business days)</li>
              <li><strong>Decision:</strong> Written decision provided with reasoning</li>
              <li><strong>Processing:</strong> Approved refunds processed within 5-7 business days</li>
            </ol>
          </section>

          {/* Dispute Resolution */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>5. Dispute Resolution</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>5.1 Dispute Process</h3>
            <ol style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li><strong>Direct Resolution:</strong> Encourage users to resolve issues directly first</li>
              <li><strong>Platform Mediation:</strong> Admin team mediates unresolved disputes</li>
              <li><strong>Evidence Review:</strong> All relevant photos, messages, and transaction history reviewed</li>
              <li><strong>Decision:</strong> Binding decision made within 5-7 business days</li>
              <li><strong>Appeals:</strong> Appeal process available for disputes over PKR 1,000</li>
            </ol>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>5.2 Evidence Requirements</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li>Clear, dated photos of book condition</li>
              <li>Screenshots of relevant communications</li>
              <li>Transaction details and timeline</li>
              <li>Any relevant receipts or documentation</li>
            </ul>
          </section>

          {/* Special Circumstances */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>6. Special Circumstances</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>6.1 Emergency Situations</h3>
            <p>In case of emergencies (medical, family, academic), special arrangements may be made:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Extended return periods with documentation</li>
              <li>Waived late fees for verified emergencies</li>
              <li>Flexible payment arrangements</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>6.2 University Holidays</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Extended return deadlines during semester breaks</li>
              <li>Paused late fee accumulation during university closures</li>
              <li>Modified contact procedures during holidays</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>6.3 Lost or Stolen Books</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li>Police report required for stolen book claims</li>
              <li>Full replacement cost charged for lost books</li>
              <li>Insurance coverage options available</li>
              <li>Investigation period of 7 days before charges apply</li>
            </ul>
          </section>

          {/* Payment and Processing */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>7. Payment and Processing</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>7.1 Refund Methods</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li><strong>Platform Credit:</strong> Instant credit to your Readioo account</li>
              <li><strong>Bank Transfer:</strong> Direct transfer to registered bank account (2-5 business days)</li>
              <li><strong>Mobile Money:</strong> JazzCash/EasyPaisa refunds (1-3 business days)</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>7.2 Processing Fees</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Platform credit: No processing fee</li>
              <li>Bank transfers: PKR 25 processing fee</li>
              <li>Mobile money: PKR 15 processing fee</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>7.3 Penalty Collection</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li>Automatic deduction from account balance</li>
              <li>Payment plan options for amounts over PKR 2,000</li>
              <li>Account suspension for unpaid penalties over 30 days</li>
            </ul>
          </section>

          {/* Contact and Support */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>8. Contact and Support</h2>
            <p>For returns, refunds, or dispute resolution, contact us:</p>
            
            <div style={{ 
              background: 'var(--bg-accent)', 
              padding: '20px', 
              borderRadius: 'var(--radius-md)',
              marginTop: '16px',
              border: '1px solid var(--border-light)'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Support Information</h4>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Address:</strong> Nust Business School, NUST, H-12, Islamabad, Pakistan
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Phone:</strong> <a href="tel:+923275526100" style={{ color: 'var(--accent-primary)' }}>+92 327 5526100</a>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Support Hours:</strong> Monday-Friday, 9 AM - 5 PM
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Response Time:</strong> Return/refund requests responded to within 24 hours
              </p>
              <p style={{ margin: '0' }}>
                <strong>Emergency Contact:</strong> For urgent issues outside business hours
              </p>
            </div>
          </section>

          {/* Policy Updates */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>9. Policy Updates</h2>
            <p>
              This policy may be updated to reflect changes in our procedures or legal requirements. 
              Users will be notified of significant changes via:
            </p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Email notifications to all active users</li>
              <li>In-app notifications for 30 days after changes</li>
              <li>Updated policy posting on our website</li>
            </ul>
            <p>Continued use of the platform constitutes acceptance of updated policies.</p>
          </section>

          {/* Agreement */}
          <section style={{ 
            background: 'var(--accent-light)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-primary)'
          }}>
            <h3 style={{ color: 'var(--accent-primary)', marginTop: 0, marginBottom: '12px' }}>
              Policy Agreement
            </h3>
            <p style={{ margin: 0 }}>
              By using Readioo's lending services, you acknowledge that you have read, understood, and agree 
              to abide by this Return & Refund Policy. This policy forms part of our Terms of Service and 
              is legally binding for all platform users.
            </p>
          </section>
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{ textAlign: 'center', marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <a href="/policies" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            All Policies
          </a>
          <a href="/policies/privacy" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            Privacy Policy
          </a>
          <a href="/policies/service" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            Service Policy
          </a>
        </div>
      </div>
    </div>
  );
}