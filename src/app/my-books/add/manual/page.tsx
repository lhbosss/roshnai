'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManualAddPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    rentalFee: '100',
    securityDeposit: '200',
    condition: 'good' as 'new' | 'like-new' | 'good' | 'fair' | 'poor',
    rentalDuration: '14',
    category: '',
    isbn: '',
    publishedYear: '',
    language: 'English'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        rentalFee: Number(formData.rentalFee),
        securityDeposit: Number(formData.securityDeposit),
        rentalDuration: Number(formData.rentalDuration),
        publishedYear: formData.publishedYear ? Number(formData.publishedYear) : undefined
      };

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add book');
      }

      // Success - redirect to my books
      router.push('/my-books');
    } catch (e: any) {
      setError(e.message || 'Failed to add book');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <a 
            href="/my-books/add" 
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
            ← Back to Add Book Options
          </a>
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--accent-primary)' }}>
          📚 Add Book Manually
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--text-secondary)' }}>
          Fill in the details of your book to add it to your library
        </p>

        <form onSubmit={handleSubmit} className="form-group">
          {/* Basic Information */}
          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>📖 Basic Information</h3>
            
            <input
              name="title"
              placeholder="Book Title *"
              value={formData.title}
              onChange={handleChange}
              required
            />
            
            <input
              name="author"
              placeholder="Author *"
              value={formData.author}
              onChange={handleChange}
              required
            />
            
            <textarea
              name="description"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Rental Information */}
          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>💰 Rental Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Rental Fee (PKR) *
                </label>
                <input
                  name="rentalFee"
                  type="number"
                  min="10"
                  max="5000"
                  placeholder="100"
                  value={formData.rentalFee}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Security Deposit (PKR) *
                </label>
                <input
                  name="securityDeposit"
                  type="number"
                  min="50"
                  max="10000"
                  placeholder="200"
                  value={formData.securityDeposit}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Book Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  style={{ color: 'var(--text-primary)' }}
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Max Rental Days *
                </label>
                <input
                  name="rentalDuration"
                  type="number"
                  min="1"
                  max="365"
                  placeholder="14"
                  value={formData.rentalDuration}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>📋 Additional Details (Optional)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <input
                name="category"
                placeholder="Category (e.g., Fiction, Science)"
                value={formData.category}
                onChange={handleChange}
              />
              
              <input
                name="language"
                placeholder="Language"
                value={formData.language}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <input
                name="isbn"
                placeholder="ISBN (optional)"
                value={formData.isbn}
                onChange={handleChange}
              />
              
              <input
                name="publishedYear"
                type="number"
                min="1000"
                max={new Date().getFullYear() + 1}
                placeholder="Published Year"
                value={formData.publishedYear}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ 
              marginTop: '8px', 
              padding: '14px 24px', 
              fontSize: '16px',
              width: '100%'
            }}
          >
            {loading ? 'Adding Book...' : '📚 Add Book to My Library'}
          </button>

          {error && (
            <div className="error-message" style={{ marginTop: '16px' }}>
              {error}
            </div>
          )}
        </form>

        {/* Guidelines */}
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: 'var(--bg-accent)', 
          borderRadius: 'var(--radius-md)',
          borderLeft: '4px solid var(--accent-primary)'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--accent-primary)' }}>
            💡 Rental Guidelines
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <li>Set reasonable rental fees based on book value and condition</li>
            <li>Security deposit should cover potential damage costs</li>
            <li>Be honest about book condition to avoid disputes</li>
            <li>Maximum rental duration helps ensure timely returns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
