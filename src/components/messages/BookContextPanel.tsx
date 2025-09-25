'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  status: string;
  book: {
    _id: string;
    title: string;
    author: string;
    lender: {
      _id: string;
      name: string;
    };
  };
  lender: string | { _id: string; name: string };
  borrower: string | { _id: string; name: string };
}

interface BookContextPanelProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function BookContextPanel({ transaction, onClose }: BookContextPanelProps) {
  const [showDetails, setShowDetails] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payment Completed';
      case 'confirmed': return 'Pickup Confirmed';
      case 'active': return 'Book Borrowed';
      case 'completed': return 'Transaction Complete';
      default: return status;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Book Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Book Information */}
        <div className="p-4 space-y-4">
          {/* Book Cover and Title */}
          <div className="text-center">
            <div className="w-20 h-28 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{transaction.book.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{transaction.book.author}</p>
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
              {getStatusText(transaction.status)}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lender</label>
              <p className="text-sm text-gray-900 mt-1">
                {typeof transaction.lender === 'string' ? 'You' : transaction.lender.name}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</label>
              <p className="text-sm text-gray-900 mt-1">
                {typeof transaction.borrower === 'string' ? 'You' : transaction.borrower.name}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</label>
              <p className="text-xs font-mono text-gray-600 mt-1 break-all">{transaction.id}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t space-y-2">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h5>
            
            {transaction.status === 'paid' && (
              <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700">
                📍 Share Pickup Location
              </button>
            )}
            
            {transaction.status === 'confirmed' && (
              <button className="w-full text-left px-3 py-2 text-sm bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-700">
                📷 Report Book Condition
              </button>
            )}
            
            {transaction.status === 'active' && (
              <button className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg text-green-700">
                📅 Schedule Return
              </button>
            )}

            <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700">
              ❓ Ask Question
            </button>
          </div>

          {/* Recent Activity */}
          <div className="pt-4 border-t">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="text-gray-600">Payment confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                <span className="text-gray-600">Transaction initiated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}