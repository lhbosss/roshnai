'use client';
import React from 'react';

export default function PrivacyPolicyPage() {
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
          🔒 Privacy Policy
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto' }}>
          Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
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

          {/* Introduction */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>1. Introduction</h2>
            <p>
              Welcome to Readioo, a book lending platform operated by students at NUST Business School. 
              We are committed to protecting your privacy and personal information. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p>
              By using our service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>2. Information We Collect</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2.1 Personal Information</h3>
            <p>We collect the following personal information when you register:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Full name and username</li>
              <li>NUST student email address (@student.nust.edu.pk)</li>
              <li>Department and batch information</li>
              <li>Contact phone number</li>
              <li>Account password (encrypted)</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2.2 Usage Information</h3>
            <p>We automatically collect information about how you use our platform:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Books you browse, borrow, and lend</li>
              <li>Transaction history and payment records</li>
              <li>Messages and communication history</li>
              <li>Login times and device information</li>
              <li>IP address and browser type</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2.3 Book Information</h3>
            <p>When you add books to our platform:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Book titles, authors, and descriptions</li>
              <li>Book condition and photos</li>
              <li>Lending preferences and pricing</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>3. How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Service Provision:</strong> To facilitate book lending and borrowing transactions</li>
              <li><strong>Communication:</strong> To send notifications about transactions, returns, and platform updates</li>
              <li><strong>Security:</strong> To verify your identity and prevent fraud</li>
              <li><strong>Improvement:</strong> To analyze usage patterns and improve our platform</li>
              <li><strong>Compliance:</strong> To comply with legal requirements and university policies</li>
              <li><strong>Support:</strong> To provide customer service and resolve disputes</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>4. Information Sharing and Disclosure</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.1 With Other Users</h3>
            <p>We share limited information to facilitate transactions:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Your name and contact information with transaction partners</li>
              <li>Book availability and condition information</li>
              <li>Transaction-related messages and updates</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.2 With University</h3>
            <p>As a student-run platform at NUST, we may share information:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>With NUST administration for verification purposes</li>
              <li>In case of policy violations or disputes</li>
              <li>For academic research (with proper anonymization)</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.3 Legal Requirements</h3>
            <p>We may disclose information when required by law or to:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Comply with legal processes</li>
              <li>Protect our rights and safety</li>
              <li>Investigate potential violations</li>
              <li>Protect against fraud or security threats</li>
            </ul>
          </section>

          {/* Data Security */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>5. Data Security</h2>
            <p>We implement appropriate security measures to protect your information:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Encryption:</strong> All passwords are encrypted using industry-standard methods</li>
              <li><strong>Secure Transmission:</strong> Data is transmitted using SSL/TLS encryption</li>
              <li><strong>Access Control:</strong> Limited access to personal data on a need-to-know basis</li>
              <li><strong>Regular Updates:</strong> Security measures are regularly reviewed and updated</li>
              <li><strong>Monitoring:</strong> Continuous monitoring for unauthorized access attempts</li>
            </ul>
            <p style={{ 
              background: 'var(--bg-accent)', 
              padding: '12px', 
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--warning)',
              marginTop: '16px'
            }}>
              <strong>Note:</strong> While we strive to protect your information, no method of transmission 
              over the internet is 100% secure. Please use strong passwords and keep your account credentials confidential.
            </p>
          </section>

          {/* Your Rights */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>6. Your Rights</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate personal information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            </ul>
            <p>To exercise these rights, contact us using the information provided below.</p>
          </section>

          {/* Data Retention */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>7. Data Retention</h2>
            <p>We retain your personal information for different periods depending on the purpose:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Account Information:</strong> Until you delete your account or graduate</li>
              <li><strong>Transaction Records:</strong> 3 years after completion for dispute resolution</li>
              <li><strong>Communication Records:</strong> 1 year after the last interaction</li>
              <li><strong>Technical Logs:</strong> 30 days for security and performance monitoring</li>
            </ul>
          </section>

          {/* Cookies and Tracking */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>8. Cookies and Tracking Technologies</h2>
            <p>We use the following technologies to enhance your experience:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
              <li><strong>Session Cookies:</strong> To keep you logged in during your session</li>
              <li><strong>Performance Cookies:</strong> To analyze platform usage and improve performance</li>
            </ul>
            <p>You can control cookies through your browser settings, but disabling essential cookies may affect platform functionality.</p>
          </section>

          {/* Third-Party Services */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>9. Third-Party Services</h2>
            <p>We may use third-party services that have their own privacy policies:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Payment Processors:</strong> For handling transaction payments</li>
              <li><strong>Cloud Storage:</strong> For secure data storage and backup</li>
              <li><strong>Analytics:</strong> For platform performance monitoring (anonymized data)</li>
            </ul>
            <p>We carefully vet third-party services and ensure they meet our privacy standards.</p>
          </section>

          {/* Updates to Policy */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>10. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices 
              or legal requirements. We will notify you of any material changes by:
            </p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Posting the updated policy on our platform</li>
              <li>Sending email notifications for significant changes</li>
              <li>Updating the "Last Updated" date at the top of this policy</li>
            </ul>
            <p>Your continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </section>

          {/* Contact Information */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
            
            <div style={{ 
              background: 'var(--bg-accent)', 
              padding: '20px', 
              borderRadius: 'var(--radius-md)',
              marginTop: '16px',
              border: '1px solid var(--border-light)'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Contact Information</h4>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Address:</strong> Nust Business School, NUST, H-12, Islamabad, Pakistan
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Phone:</strong> <a href="tel:+923275526100" style={{ color: 'var(--accent-primary)' }}>+92 327 5526100</a>
              </p>
              <p style={{ margin: '0' }}>
                <strong>Response Time:</strong> We aim to respond to all privacy inquiries within 7 business days.
              </p>
            </div>
          </section>

          {/* Agreement */}
          <section style={{ 
            background: 'var(--accent-light)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-primary)'
          }}>
            <h3 style={{ color: 'var(--accent-primary)', marginTop: 0, marginBottom: '12px' }}>
              Agreement and Consent
            </h3>
            <p style={{ margin: 0 }}>
              By using Readioo, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. 
              If you do not agree with this policy, please do not use our platform.
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
          <a href="/policies/returns" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            Return Policy
          </a>
          <a href="/policies/service" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            Service Policy
          </a>
        </div>
      </div>
    </div>
  );
}