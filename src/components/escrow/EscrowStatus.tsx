import React, { useState, useEffect } from 'react';

interface EscrowStatusProps {
  transactionId: string;
  refreshInterval?: number; // in milliseconds
  onStatusChange?: (status: string) => void;
}

interface TransactionData {
  _id: string;
  status: string;
  totalAmount: number;
  rentalFee: number;
  securityDeposit: number;
  userRole: 'borrower' | 'lender';
  isExpired: boolean;
  progress: {
    steps: Array<{
      key: string;
      label: string;
      completed: boolean;
    }>;
    completedSteps: number;
    totalSteps: number;
    percentage: number;
    currentStep: string;
  };
  book: {
    _id: string;
    title: string;
    author: string;
  };
  borrower: {
    _id: string;
    name: string;
  };
  lender: {
    _id: string;
    name: string;
  };
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
  lenderConfirmed: boolean;
  borrowerConfirmed: boolean;
}

export default function EscrowStatus({ 
  transactionId, 
  refreshInterval = 30000, 
  onStatusChange 
}: EscrowStatusProps) {
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchTransactionData = async () => {
    try {
      const response = await fetch(`/api/escrow/${transactionId}`);
      if (response.ok) {
        const data = await response.json();
        setTransaction(data);
        if (onStatusChange && data.status) {
          onStatusChange(data.status);
        }
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch transaction data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionData();

    // Set up auto-refresh interval
    const interval = setInterval(fetchTransactionData, refreshInterval);
    return () => clearInterval(interval);
  }, [transactionId, refreshInterval]);

  const handleConfirmAction = async (action: string) => {
    if (!transaction) return;

    setConfirmingAction(action);
    try {
      const response = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction._id,
          action,
          notes: '' // Could add note input later
        }),
      });

      if (response.ok) {
        // Refresh transaction data after confirmation
        await fetchTransactionData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Confirmation failed');
      }
    } catch (err) {
      setError('Failed to submit confirmation');
    } finally {
      setConfirmingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="text-red-800">
          <h3 className="font-semibold mb-2">Error Loading Transaction</h3>
          <p>{error}</p>
          <button 
            onClick={fetchTransactionData}
            className="mt-3 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="card">
        <p className="text-gray-500">Transaction not found.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'paid': return '💰';
      case 'confirmed': return '✅';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      case 'refunded': return '↩️';
      default: return '📋';
    }
  };

  const canConfirm = (action: string) => {
    if (transaction.status !== 'paid') return false;
    if (transaction.userRole === 'lender' && action === 'lent') return !transaction.lenderConfirmed;
    if (transaction.userRole === 'borrower' && action === 'borrowed') return !transaction.borrowerConfirmed;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStatusIcon(transaction.status)}</span>
            <div>
              <h3 className="text-lg font-semibold">Transaction Status</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(transaction.status)}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Transaction ID: {transaction._id.slice(-8)}</div>
            <div>Created: {formatDate(transaction.createdAt)}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{transaction.progress.percentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${transaction.progress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3">
          {transaction.progress.steps.map((step, index) => (
            <div key={step.key} className={`flex items-center space-x-3 ${
              step.completed ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step.completed 
                  ? 'bg-green-600 text-white' 
                  : transaction.progress.currentStep === step.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step.completed ? '✓' : index + 1}
              </div>
              <span className={`text-sm ${
                step.completed ? 'font-medium' : ''
              }`}>{step.label}</span>
              {transaction.progress.currentStep === step.key && !step.completed && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Current</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Book Information */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Book Details</h3>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
            📚
          </div>
          <div>
            <h4 className="font-medium">{transaction.book.title}</h4>
            <p className="text-gray-600">by {transaction.book.author}</p>
            <p className="text-sm text-gray-500">
              {transaction.userRole === 'borrower' ? 'Borrowed from' : 'Lending to'}: {' '}
              {transaction.userRole === 'borrower' ? transaction.lender.name : transaction.borrower.name}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Rental Fee:</span>
            <span className="font-medium">{formatCurrency(transaction.rentalFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Security Deposit:</span>
            <span className="font-medium">{formatCurrency(transaction.securityDeposit)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total Paid:</span>
            <span>{formatCurrency(transaction.totalAmount)}</span>
          </div>
        </div>
        
        {transaction.status === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <div className="font-medium mb-1">Payment Completed</div>
              <div>
                • Rental fee ({formatCurrency(transaction.rentalFee)}) released to lender<br/>
                • Security deposit ({formatCurrency(transaction.securityDeposit)}) refunded to borrower
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {transaction.status === 'paid' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Confirm Transaction</h3>
          <p className="text-gray-600 mb-4">
            {transaction.userRole === 'lender' 
              ? 'Confirm that you have handed over the book to the borrower.'
              : 'Confirm that you have received the book from the lender.'
            }
          </p>
          
          {transaction.userRole === 'lender' && canConfirm('lent') && (
            <button
              onClick={() => handleConfirmAction('lent')}
              disabled={confirmingAction === 'lent'}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {confirmingAction === 'lent' ? 'Confirming...' : 'Confirm Book Handed Over'}
            </button>
          )}
          
          {transaction.userRole === 'borrower' && canConfirm('borrowed') && (
            <button
              onClick={() => handleConfirmAction('borrowed')}
              disabled={confirmingAction === 'borrowed'}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {confirmingAction === 'borrowed' ? 'Confirming...' : 'Confirm Book Received'}
            </button>
          )}

          {/* Confirmation Status */}
          <div className="mt-4 space-y-2 text-sm">
            <div className={`flex items-center space-x-2 ${
              transaction.lenderConfirmed ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span>{transaction.lenderConfirmed ? '✅' : '⏳'}</span>
              <span>Lender confirmed handover</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              transaction.borrowerConfirmed ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span>{transaction.borrowerConfirmed ? '✅' : '⏳'}</span>
              <span>Borrower confirmed receipt</span>
            </div>
          </div>
        </div>
      )}

      {/* Expiration Warning */}
      {transaction.isExpired && transaction.status === 'paid' && (
        <div className="card bg-red-50 border-red-200">
          <div className="text-red-800">
            <h3 className="font-semibold mb-2">⚠️ Transaction Expired</h3>
            <p className="text-sm">
              This transaction expired on {formatDate(transaction.expiresAt)}. 
              Please contact support for assistance.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
}