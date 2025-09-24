import React from 'react';

interface BookHeaderProps {
  book: {
    title: string;
    author: string;
    available: boolean;
    condition?: string;
    rentalDuration?: number;
  };
}

export default function BookHeader({ book }: BookHeaderProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'like-new': return 'bg-green-100 text-green-700';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {/* Availability Badge */}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            book.available 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {book.available ? 'Available' : 'Not Available'}
          </span>
        </div>
      </div>

      {/* Book Meta Information */}
      <div className="flex flex-wrap gap-3">
        {book.condition && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(book.condition)}`}>
            {book.condition.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Condition
          </span>
        )}
        
        {book.rentalDuration && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {book.rentalDuration} day{book.rentalDuration !== 1 ? 's' : ''} rental
          </span>
        )}
      </div>
    </div>
  );
}