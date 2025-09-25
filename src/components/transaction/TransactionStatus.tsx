'use client';

import { useState, useEffect } from 'react';
import { IEscrowTransaction } from '@/models/EscrowTransaction';

interface TransactionStatusProps {
  transactionId: string;
  currentUserId: string;
  onStatusUpdate?: (transaction: IEscrowTransaction) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function TransactionStatus({ 
  transactionId, 
  currentUserId,
  onStatusUpdate,
  showActions = true,
  compact = false
}: TransactionStatusProps) {
  const [transaction, setTransaction] = useState<IEscrowTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchTransactionStatus();
    const interval = setInterval(fetchTransactionStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [transactionId]);

  const fetchTransactionStatus = async () => {
    try {
      const response = await fetch(`/api/escrow/${transactionId}`, {
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.success) {
        setTransaction(data.transaction);
        setLastUpdated(new Date());
        onStatusUpdate?.(data.transaction);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch transaction status');
    } finally {
      setLoading(false);
    }
  };

  const getProgressSteps = () => [
    {
      id: 'payment',
      label: 'Payment',
      description: 'Payment received and held in escrow',
      completed: transaction?.status !== 'pending',
      active: transaction?.status === 'pending'
    },
    {
      id: 'lender_confirm',
      label: 'Lender Confirmation', 
      description: 'Lender confirms book has been given',
      completed: transaction?.lenderConfirmed || false,
      active: !transaction?.lenderConfirmed && (transaction?.status === 'paid' || transaction?.status === 'confirmed')
    },
    {
      id: 'borrower_confirm',
      label: 'Borrower Confirmation',
      description: 'Borrower confirms book receipt',
      completed: transaction?.borrowerConfirmed || false,
      active: !transaction?.borrowerConfirmed && (transaction?.status === 'paid' || transaction?.status === 'confirmed')
    },
    {
      id: 'completed',
      label: 'Completed',
      description: 'Transaction completed successfully',
      completed: transaction?.status === 'completed',
      active: transaction?.lenderConfirmed && transaction?.borrowerConfirmed && transaction?.status !== 'completed'
    }
  ];

  const getOverallProgress = () => {
    const steps = getProgressSteps();
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'paid': return 'text-blue-600 bg-blue-100';
      case 'confirmed': return 'text-indigo-600 bg-indigo-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCurrentStatusMessage = () => {
    if (!transaction) return '';

    const { status, lenderConfirmed, borrowerConfirmed } = transaction;

    if (status === 'completed') return 'Transaction completed successfully!';
    if (status === 'cancelled') return 'Transaction has been cancelled';
    if (status === 'refunded') return 'Transaction has been refunded';
    if (status === 'pending') return 'Waiting for payment confirmation';

    if (lenderConfirmed && borrowerConfirmed) return 'Both parties confirmed - finalizing transaction';
    if (lenderConfirmed && !borrowerConfirmed) return 'Book lent - waiting for borrower confirmation';
    if (!lenderConfirmed && borrowerConfirmed) return 'Borrower ready - waiting for lender confirmation';
    if (status === 'paid') return 'Payment confirmed - waiting for both parties to confirm exchange';

    return 'Transaction in progress';
  };

  const getTimeRemaining = () => {
    if (!transaction?.expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(transaction.expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} remaining`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center text-red-800">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="font-medium">Error Loading Status</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
        <button
          onClick={fetchTransactionStatus}
          className="mt-3 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!transaction) return null;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
          Transaction Status
        </h3>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status.toUpperCase()}
          </span>
          {getTimeRemaining() && transaction.status !== 'completed' && (
            <span className="text-xs text-gray-500">
              {getTimeRemaining()}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{getOverallProgress()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${getOverallProgress()}%` }}
          ></div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-4">
        <p className={`text-gray-700 ${compact ? 'text-sm' : 'text-base'}`}>
          {getCurrentStatusMessage()}
        </p>
      </div>

      {/* Progress Steps */}
      {!compact && (
        <div className="space-y-3">
          {getProgressSteps().map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                step.completed 
                  ? 'bg-green-500 text-white' 
                  : step.active
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-500'
              }`}>
                {step.completed ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${step.completed ? 'text-green-800' : step.active ? 'text-blue-800' : 'text-gray-500'}`}>
                  {step.label}
                </div>
                <div className="text-sm text-gray-500">
                  {step.description}
                </div>
              </div>
              {step.active && (
                <div className="ml-2">
                  <svg className="w-4 h-4 text-blue-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Summary */}
      {!compact && (transaction.status === 'paid' || transaction.status === 'confirmed') && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Lender Confirmed:</span>
              <span className={transaction.lenderConfirmed ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {transaction.lenderConfirmed ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Borrower Confirmed:</span>
              <span className={transaction.borrowerConfirmed ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {transaction.borrowerConfirmed ? '✓' : '○'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-400 text-right">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}