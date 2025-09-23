import React, { useState } from 'react';

interface BookSummaryProps {
  book: {
    description?: string;
    summary?: string;
  };
}

export default function BookSummary({ book }: BookSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use summary if available, otherwise use description
  const content = book.summary || book.description;
  
  if (!content) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">About This Book</h3>
        <p className="text-gray-500 italic">No description available for this book.</p>
      </div>
    );
  }

  // Determine if content needs to be truncated
  const isLongContent = content.length > 300;
  const displayContent = isExpanded || !isLongContent 
    ? content 
    : content.substring(0, 300) + '...';

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">
        {book.summary ? 'Summary' : 'About This Book'}
      </h3>
      
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {displayContent}
        </p>
      </div>

      {isLongContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}

      {/* Show both summary and description if both exist */}
      {book.summary && book.description && book.summary !== book.description && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium mb-3">Additional Details</h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {book.description}
          </p>
        </div>
      )}
    </div>
  );
}