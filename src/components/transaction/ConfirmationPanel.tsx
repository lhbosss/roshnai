'use client';

import { useState } from 'react';
import { IEscrowTransaction } from '@/models/EscrowTransaction';

interface ConfirmationPanelProps {
  transaction: IEscrowTransaction;
  currentUserId: string;
  onConfirmationUpdate?: (transaction: IEscrowTransaction) => void;
  className?: string;
}

export default function ConfirmationPanel({ 
  transaction, 
  currentUserId, 
  onConfirmationUpdate,
  className = ''
}: ConfirmationPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine user role
  const isLender = String(transaction.lender) === currentUserId || 
                   (transaction.lender as any)?._id === currentUserId;
  const isBorrower = String(transaction.borrower) === currentUserId || 
                     (transaction.borrower as any)?._id === currentUserId;

  // Check confirmation states
  const lenderConfirmed = transaction.lenderConfirmed;
  const borrowerConfirmed = transaction.borrowerConfirmed;
  const canConfirm = transaction.status === 'paid' || transaction.status === 'confirmed';

  const handleLenderConfirmation = async () => {
    if (!isLender || lenderConfirmed || !canConfirm) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction._id,
          confirmationType: 'lent',
          role: 'lender'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onConfirmationUpdate?.(data.transaction);
      } else {
        setError(data.error || 'Failed to confirm lending');
      }
    } catch (err) {
      setError('Failed to process confirmation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBorrowerConfirmation = async () => {
    if (!isBorrower || borrowerConfirmed || !canConfirm) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction._id,
          confirmationType: 'borrowed',
          role: 'borrower'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onConfirmationUpdate?.(data.transaction);
      } else {
        setError(data.error || 'Failed to confirm borrowing');
      }
    } catch (err) {
      setError('Failed to process confirmation');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusMessage = () => {
    if (transaction.status === 'completed') {
      return 'Transaction completed successfully!';
    }

    if (lenderConfirmed && borrowerConfirmed) {
      return 'Both parties have confirmed - transaction in progress';
    }

    if (lenderConfirmed && !borrowerConfirmed) {
      return 'Book has been lent - waiting for borrower confirmation';
    }

    if (!lenderConfirmed && borrowerConfirmed) {
      return 'Borrower ready to receive - waiting for lender to confirm lending';
    }

    return 'Waiting for confirmations from both parties';
  };

  const getNextSteps = () => {
    if (transaction.status === 'completed') {
      return null;
    }

    if (lenderConfirmed && borrowerConfirmed) {
      return 'Book exchange is confirmed. Enjoy your reading!';
    }

    const steps = [];
    
    if (!lenderConfirmed) {
      steps.push(isLender ? 
        'You need to confirm that you have lent the book' :
        'Waiting for lender to confirm lending'
      );
    }

    if (!borrowerConfirmed) {
      steps.push(isBorrower ? 
        'You need to confirm that you have received the book' :
        'Waiting for borrower to confirm receipt'
      );
    }

    return steps;
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-6 ${className}`}>
      {/* Status Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmation Status</h3>
        <div className="flex items-center space-x-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${
            lenderConfirmed && borrowerConfirmed 
              ? 'bg-green-500' 
              : lenderConfirmed || borrowerConfirmed
                ? 'bg-yellow-500'
                : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">{getStatusMessage()}</span>
        </div>
      </div>

      {/* Confirmation Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Lender Confirmation */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Lender Confirmation</h4>
            <div className="flex items-center space-x-2">
              {lenderConfirmed ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Confirmed
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Pending
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Confirm that you have given the book to the borrower
          </p>

          {isLender && !lenderConfirmed && canConfirm && (
            <button
              onClick={handleLenderConfirmation}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              {isProcessing ? 'Processing...' : 'Mark as Lent'}
            </button>
          )}

          {isLender && lenderConfirmed && (
            <div className="text-sm text-green-600 font-medium">
              ✓ You confirmed lending on {transaction.confirmedAt ? new Date(transaction.confirmedAt).toLocaleString() : 'now'}
            </div>
          )}

          {!isLender && (
            <div className="text-sm text-gray-500">
              {lenderConfirmed ? '✓ Lender has confirmed' : 'Waiting for lender...'}
            </div>
          )}
        </div>

        {/* Borrower Confirmation */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Borrower Confirmation</h4>
            <div className="flex items-center space-x-2">
              {borrowerConfirmed ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Confirmed
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Pending
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Confirm that you have received the book in good condition
          </p>

          {isBorrower && !borrowerConfirmed && canConfirm && (
            <button
              onClick={handleBorrowerConfirmation}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              {isProcessing ? 'Processing...' : 'Confirm Borrowed'}
            </button>
          )}

          {isBorrower && borrowerConfirmed && (
            <div className="text-sm text-green-600 font-medium">
              ✓ You confirmed borrowing on {transaction.confirmedAt ? new Date(transaction.confirmedAt).toLocaleString() : 'now'}
            </div>
          )}

          {!isBorrower && (
            <div className="text-sm text-gray-500">
              {borrowerConfirmed ? '✓ Borrower has confirmed' : 'Waiting for borrower...'}
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      {getNextSteps() && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
          {Array.isArray(getNextSteps()) ? (
            <ul className="text-sm text-blue-800 space-y-1">
              {(getNextSteps() as string[]).map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-blue-800">{getNextSteps()}</p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Important Notice */}
      {!canConfirm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800">
              {transaction.status === 'pending' && 'Payment must be completed before confirmations can be made.'}
              {transaction.status === 'completed' && 'This transaction has already been completed.'}
              {transaction.status === 'cancelled' && 'This transaction has been cancelled.'}
              {transaction.status === 'refunded' && 'This transaction has been refunded.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}