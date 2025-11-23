'use client';
import React from 'react';

export default function ServicePolicyPage() {
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
          📋 Service Policy & Terms of Use
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto' }}>
          Terms and conditions governing the use of our book lending platform, user responsibilities, and service guidelines.
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
              <strong>Last Updated:</strong> November 23, 2025<br />
              <strong>Version:</strong> 1.0
            </p>
          </div>

          {/* Acceptance of Terms */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p>
              Welcome to Readioo, a peer-to-peer book lending platform operated by students at NUST Business School. 
              By accessing or using our platform, you agree to be bound by these Terms of Service and all applicable 
              laws and regulations. If you do not agree with any of these terms, you are prohibited from using our service.
            </p>
            <p style={{ 
              background: 'var(--bg-accent)', 
              padding: '12px', 
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--warning)',
              marginTop: '16px'
            }}>
              <strong>Important:</strong> This platform is exclusively for NUST students. You must have a valid 
              @student.nust.edu.pk email address to register and use our services.
            </p>
          </section>

          {/* Service Description */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>2. Service Description</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2.1 Platform Overview</h3>
            <p>Readioo facilitates book sharing among NUST students by providing:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>A marketplace for listing and discovering available books</li>
              <li>Secure transaction processing and escrow services</li>
              <li>Communication tools for coordinating exchanges</li>
              <li>Dispute resolution and mediation services</li>
              <li>User rating and review systems</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>2.2 Our Role</h3>
            <p>Readioo acts as an intermediary platform and does not:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Own or possess any books listed on the platform</li>
              <li>Guarantee the condition, availability, or accuracy of book descriptions</li>
              <li>Take responsibility for the physical exchange of books</li>
              <li>Provide insurance for lost or damaged books (unless explicitly stated)</li>
            </ul>
          </section>

          {/* User Eligibility */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>3. User Eligibility and Registration</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>3.1 Eligibility Requirements</h3>
            <p>To use Readioo, you must:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Be a currently enrolled student at NUST</li>
              <li>Have a valid NUST student email address</li>
              <li>Be at least 18 years old or have parental consent</li>
              <li>Provide accurate and truthful information</li>
              <li>Agree to all terms and policies</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>3.2 Account Responsibilities</h3>
            <p>You are responsible for:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Immediately notifying us of any unauthorized use</li>
              <li>Keeping your contact information current and accurate</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>3.3 Account Termination</h3>
            <p>We may suspend or terminate accounts for:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Violation of these terms or our policies</li>
              <li>Fraudulent or deceptive practices</li>
              <li>Graduation or leaving NUST (with grace period)</li>
              <li>Repeated complaints or poor user ratings</li>
              <li>Illegal activities or harassment</li>
            </ul>
          </section>

          {/* Platform Rules */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>4. Platform Usage Rules</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.1 Permitted Uses</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Listing personal books for lending</li>
              <li>Browsing and borrowing available books</li>
              <li>Communicating with other users for legitimate purposes</li>
              <li>Providing honest reviews and feedback</li>
              <li>Reporting violations and inappropriate behavior</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.2 Prohibited Activities</h3>
            <p>You may not:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>List books you don't own or have permission to lend</li>
              <li>Misrepresent book conditions or availability</li>
              <li>Use the platform for commercial resale purposes</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Attempt to circumvent payment systems</li>
              <li>Post inappropriate, offensive, or illegal content</li>
              <li>Violate intellectual property rights</li>
              <li>Use automated tools or bots</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>4.3 Content Guidelines</h3>
            <p>All content must be:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Accurate and truthful</li>
              <li>Respectful and professional</li>
              <li>Free from hate speech or discrimination</li>
              <li>Compliant with university guidelines</li>
              <li>Appropriate for an academic environment</li>
            </ul>
          </section>

          {/* Lending and Borrowing Rules */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>5. Lending and Borrowing Guidelines</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>5.1 Lender Responsibilities</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Accurately describe book condition with clear photos</li>
              <li>Set reasonable rental prices and terms</li>
              <li>Respond to borrowing requests promptly</li>
              <li>Ensure books are available when listed</li>
              <li>Inspect returned books thoroughly</li>
              <li>Report damage or issues within 24 hours</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>5.2 Borrower Responsibilities</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Handle borrowed books with care</li>
              <li>Return books on time and in good condition</li>
              <li>Pay all fees and penalties promptly</li>
              <li>Communicate any issues immediately</li>
              <li>Follow pickup and return arrangements</li>
              <li>Report lost or stolen books within 24 hours</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>5.3 Transaction Limits</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li>Maximum 5 books borrowed at one time</li>
              <li>Maximum rental period of 30 days</li>
              <li>Minimum rental price of PKR 50</li>
              <li>Maximum rental price of PKR 2,000</li>
              <li>New users limited to 2 concurrent transactions</li>
            </ul>
          </section>

          {/* Payment and Fees */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>6. Payment Terms and Fees</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>6.1 Platform Fees</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li><strong>Service Fee:</strong> 5% of transaction value (minimum PKR 10)</li>
              <li><strong>Payment Processing:</strong> 2% for card payments, PKR 15 for mobile money</li>
              <li><strong>Late Fee:</strong> PKR 50 per day after due date</li>
              <li><strong>Dispute Resolution:</strong> PKR 100 if dispute ruled against you</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>6.2 Payment Methods</h3>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>JazzCash and EasyPaisa mobile wallets</li>
              <li>Bank debit cards</li>
              <li>Direct bank transfers</li>
              <li>Platform credit from previous transactions</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>6.3 Escrow System</h3>
            <p>All payments are held in escrow until:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Book is successfully delivered to borrower</li>
              <li>Rental period begins</li>
              <li>Both parties confirm the transaction</li>
              <li>24-hour dispute window expires</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>7. Intellectual Property Rights</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>7.1 Platform Content</h3>
            <p>Readioo owns all rights to:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Platform software and technology</li>
              <li>User interface and design</li>
              <li>Logos, trademarks, and branding</li>
              <li>Original content and documentation</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>7.2 User Content</h3>
            <p>By posting content, you grant us a limited license to:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Display your listings and reviews on the platform</li>
              <li>Use your content for platform improvement</li>
              <li>Include your content in marketing materials (with consent)</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>7.3 Book Rights</h3>
            <p>Users must respect copyright laws:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Only lend books you legally own</li>
              <li>Do not make unauthorized copies</li>
              <li>Respect digital rights management (DRM)</li>
              <li>Report copyright violations immediately</li>
            </ul>
          </section>

          {/* Privacy and Data */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>8. Privacy and Data Protection</h2>
            <p>
              Our data practices are governed by our Privacy Policy. Key points include:
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Personal information shared only for transaction purposes</li>
              <li>Data encryption and security measures in place</li>
              <li>No sale of user data to third parties</li>
              <li>Right to access, correct, and delete your data</li>
              <li>Compliance with applicable privacy laws</li>
            </ul>
            <p>
              For complete details, please review our <a href="/policies/privacy" style={{ color: 'var(--accent-primary)' }}>Privacy Policy</a>.
            </p>
          </section>

          {/* Liability and Disclaimers */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>9. Liability and Disclaimers</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>9.1 Service Disclaimer</h3>
            <p>The platform is provided "as is" without warranties of any kind. We disclaim all warranties including:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Merchantability and fitness for a particular purpose</li>
              <li>Uninterrupted or error-free service</li>
              <li>Security of data transmission</li>
              <li>Accuracy of user-generated content</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>9.2 Limitation of Liability</h3>
            <p>Our liability is limited to:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Direct damages up to the transaction value</li>
              <li>Platform fees paid in the last 12 months</li>
              <li>No liability for indirect or consequential damages</li>
              <li>Exclusion of lost profits or data</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>9.3 User Indemnification</h3>
            <p>You agree to indemnify and hold us harmless from claims arising from:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Your use of the platform</li>
              <li>Violation of these terms</li>
              <li>Infringement of third-party rights</li>
              <li>Your interaction with other users</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>10. Dispute Resolution</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>10.1 Internal Resolution</h3>
            <ol style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li><strong>Direct Communication:</strong> Users first attempt direct resolution</li>
              <li><strong>Platform Mediation:</strong> Admin team mediates unresolved disputes</li>
              <li><strong>Formal Review:</strong> Escalated disputes reviewed by senior staff</li>
              <li><strong>Final Decision:</strong> Binding decision within 7 business days</li>
            </ol>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>10.2 External Resolution</h3>
            <p>For disputes that cannot be resolved internally:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>University student services may be involved</li>
              <li>Local mediation services available</li>
              <li>Legal action as last resort (Islamabad jurisdiction)</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>10.3 Class Action Waiver</h3>
            <p>
              Users agree to resolve disputes individually and waive the right to participate in class actions or collective proceedings.
            </p>
          </section>

          {/* Governing Law */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>11. Governing Law and Jurisdiction</h2>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Governing Law:</strong> Laws of Pakistan and NUST regulations</li>
              <li><strong>Jurisdiction:</strong> Courts of Islamabad, Pakistan</li>
              <li><strong>University Authority:</strong> NUST administrative procedures may apply</li>
              <li><strong>Student Code:</strong> Subject to NUST Student Code of Conduct</li>
            </ul>
          </section>

          {/* Modifications and Updates */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>12. Service Modifications and Updates</h2>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>12.1 Platform Changes</h3>
            <p>We reserve the right to:</p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>Modify or discontinue features with notice</li>
              <li>Update terms of service as needed</li>
              <li>Change fee structures with 30 days notice</li>
              <li>Implement new policies for platform improvement</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>12.2 Notification Methods</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li>Email notifications to registered users</li>
              <li>In-app notifications and banners</li>
              <li>Website posting of updated terms</li>
              <li>SMS for urgent changes affecting transactions</li>
            </ul>
          </section>

          {/* Contact Information */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>13. Contact Information</h2>
            <p>For questions about these terms or our services:</p>
            
            <div style={{ 
              background: 'var(--bg-accent)', 
              padding: '20px', 
              borderRadius: 'var(--radius-md)',
              marginTop: '16px',
              border: '1px solid var(--border-light)'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Readioo Support Team</h4>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Address:</strong> Nust Business School, NUST, H-12, Islamabad, Pakistan
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Phone:</strong> <a href="tel:+923275526100" style={{ color: 'var(--accent-primary)' }}>+92 327 5526100</a>
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Office Hours:</strong> Monday-Friday, 9 AM - 5 PM (Pakistan Time)
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Response Time:</strong> Support inquiries answered within 24 hours
              </p>
              <p style={{ margin: '0' }}>
                <strong>Emergency Line:</strong> Available for urgent transaction issues
              </p>
            </div>
          </section>

          {/* Final Agreement */}
          <section style={{ 
            background: 'var(--accent-light)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-primary)'
          }}>
            <h3 style={{ color: 'var(--accent-primary)', marginTop: 0, marginBottom: '12px' }}>
              Terms Agreement and Acceptance
            </h3>
            <p style={{ margin: '0 0 12px 0' }}>
              By creating an account and using Readioo, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service, our Privacy Policy, and Return & Refund Policy.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Effective Date:</strong> These terms become effective immediately upon acceptance and 
              remain in effect until terminated by either party in accordance with these provisions.
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
          <a href="/policies/returns" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            Return Policy
          </a>
        </div>
      </div>
    </div>
  );
}