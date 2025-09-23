"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import BookHeader from '@/components/books/BookHeader';
import BookSummary from '@/components/books/BookSummary';
import BookPricing from '@/components/books/BookPricing';
import BorrowButton from '@/components/books/BorrowButton';

interface BookDetailData {
  _id: string;
  title: string;
  author: string;
  description?: string;
  summary?: string;
  coverUrl?: string;
  images?: string[];
  available: boolean;
  rentalFee: number;
  securityDeposit: number;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  category?: string;
  isbn?: string;
  publishedYear?: number;
  language?: string;
  rentalDuration: number;
  location?: string;
  lender: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<BookDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`/api/books/${bookId}`);
        if (!response.ok) {
          throw new Error('Book not found');
        }
        const data = await response.json();
        setBook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch book');
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading book details...</div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Book Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This book does not exist or has been removed.'}</p>
          <a href="/borrow" className="btn-secondary">
            ← Back to Browse Books
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <a href="/borrow" className="text-blue-600 hover:underline">Browse Books</a>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{book.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Book Image */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-md">
              {book.coverUrl ? (
                <img 
                  src={book.coverUrl} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📚</div>
                    <div className="text-sm">No Image Available</div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Images */}
            {book.images && book.images.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Additional Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {book.images.slice(0, 6).map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={image} 
                        alt={`${book.title} - Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="lg:col-span-2">
          <BookHeader book={book} />
          
          <div className="space-y-6">
            <BookSummary book={book} />
            
            {/* Book Information */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Book Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {book.category && (
                  <div>
                    <span className="font-medium">Category:</span>
                    <span className="ml-2 text-gray-600">{book.category}</span>
                  </div>
                )}
                {book.isbn && (
                  <div>
                    <span className="font-medium">ISBN:</span>
                    <span className="ml-2 text-gray-600">{book.isbn}</span>
                  </div>
                )}
                {book.publishedYear && (
                  <div>
                    <span className="font-medium">Published:</span>
                    <span className="ml-2 text-gray-600">{book.publishedYear}</span>
                  </div>
                )}
                {book.language && (
                  <div>
                    <span className="font-medium">Language:</span>
                    <span className="ml-2 text-gray-600">{book.language}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Condition:</span>
                  <span className="ml-2 text-gray-600 capitalize">{book.condition}</span>
                </div>
                {book.location && (
                  <div>
                    <span className="font-medium">Location:</span>
                    <span className="ml-2 text-gray-600">{book.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lender Information */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Book Owner</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {book.lender.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{book.lender.name || 'Anonymous User'}</div>
                  <div className="text-sm text-gray-600">{book.lender.email}</div>
                </div>
              </div>
            </div>

            <BookPricing book={book} />
            
            <BorrowButton book={book} />
          </div>
        </div>
      </div>
    </div>
  );
}