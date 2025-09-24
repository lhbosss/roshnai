'use client';

import { useState, useEffect } from 'react';
import { IEscrowTransaction } from '@/models/EscrowTransaction';

interface EscrowStatusProps {
  transactionId: string;
  onStatusUpdate?: (transaction: IEscrowTransaction) => void;
}

export default function EscrowStatus({ transactionId, onStatusUpdate }: EscrowStatusProps) {
  const [transaction, setTransaction] = useState<IEscrowTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactionStatus();
    const interval = setInterval(fetchTransactionStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [transactionId]);

  const fetchTransactionStatus = async () => {
    try {
      const response = await fetch(`/api/escrow/${transactionId}`);
      const data = await response.json();
      
      if (data.success) {
        setTransaction(data.transaction);
        onStatusUpdate?.(data.transaction);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch transaction status');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!transaction) return;
    
    setConfirming(true);
    try {
      const response = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction._id,
          confirmationType: 'receipt'
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchTransactionStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to confirm receipt');
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!transaction) return;
    
    setConfirming(true);
    try {
      const response = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction._id,
          confirmationType: 'return'
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchTransactionStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to confirm return');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 20;
      case 'paid': return 40;
      case 'confirmed': return 70;
      case 'completed': return 100;
      case 'cancelled': return 0;
      case 'refunded': return 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-800">
          <h3 className="font-medium mb-2">Error</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchTransactionStatus}
            className="mt-3 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border">
        <p className="text-gray-600">Transaction not found</p>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage(transaction.status);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Transaction Status</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Transaction ID:</span>
          <span className="font-medium">{String(transaction._id)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">${transaction.totalAmount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Created:</span>
          <span className="font-medium">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </span>
        </div>
        {transaction.expiresAt && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Expires:</span>
            <span className="font-medium">
              {new Date(transaction.expiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Status-specific Content */}
      {transaction.status === 'paid' && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-blue-900 mb-2">Payment Confirmed</h4>
          <p className="text-blue-800 text-sm mb-3">
            Your payment has been received and held in escrow. Please arrange to receive the book from the lender.
          </p>
        </div>
      )}

      {transaction.status === 'confirmed' && !transaction.borrowerConfirmed && (
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-green-900 mb-2">Confirm Receipt</h4>
          <p className="text-green-800 text-sm mb-3">
            Have you received the book in good condition?
          </p>
          <button
            onClick={handleConfirmReceipt}
            disabled={confirming}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {confirming ? 'Confirming...' : 'Yes, I received the book'}
          </button>
        </div>
      )}

      {transaction.status === 'confirmed' && transaction.borrowerConfirmed && (
        <div className="bg-amber-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-amber-900 mb-2">Return Book</h4>
          <p className="text-amber-800 text-sm mb-3">
            When you're done reading, please return the book to complete the transaction.
          </p>
          <button
            onClick={handleConfirmReturn}
            disabled={confirming}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {confirming ? 'Confirming...' : 'Confirm Book Returned'}
          </button>
        </div>
      )}

      {transaction.status === 'completed' && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Transaction Completed</h4>
          <p className="text-green-800 text-sm">
            The book has been successfully borrowed and returned. Funds have been released to the lender.
          </p>
        </div>
      )}

      {(transaction.status === 'cancelled' || transaction.status === 'refunded') && (
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">
            {transaction.status === 'cancelled' ? 'Transaction Cancelled' : 'Transaction Refunded'}
          </h4>
          <p className="text-red-800 text-sm">
            {transaction.status === 'cancelled' 
              ? 'This transaction has been cancelled.'
              : 'This transaction has been refunded.'
            }
            {transaction.refundReason && ` Reason: ${transaction.refundReason}`}
          </p>
        </div>
      )}

      {/* Confirmations Status */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="font-medium text-gray-900 mb-3">Confirmations</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Status:</span>
            <span className={transaction.status === 'paid' || transaction.status === 'confirmed' || transaction.status === 'completed' ? 'text-green-600' : 'text-gray-400'}>
              {transaction.status === 'paid' || transaction.status === 'confirmed' || transaction.status === 'completed' ? '✓ Paid' : '○ Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Lender Confirmed:</span>
            <span className={transaction.lenderConfirmed ? 'text-green-600' : 'text-gray-400'}>
              {transaction.lenderConfirmed ? '✓ Yes' : '○ Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Borrower Confirmed:</span>
            <span className={transaction.borrowerConfirmed ? 'text-green-600' : 'text-gray-400'}>
              {transaction.borrowerConfirmed ? '✓ Yes' : '○ Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}