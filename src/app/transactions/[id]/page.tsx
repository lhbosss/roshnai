'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EscrowStatus from '@/components/EscrowStatus';
import ConfirmationPanel from '@/components/transaction/ConfirmationPanel';
import TransactionStatus from '@/components/transaction/TransactionStatus';
import ConfirmationHistory from '@/components/transaction/ConfirmationHistory';
import { ConfirmationStatusIndicator, TransactionStatusBadge } from '@/components/transaction/StatusIndicators';
import { IEscrowTransaction } from '@/models/EscrowTransaction';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;
  
  const [transaction, setTransaction] = useState<IEscrowTransaction | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      router.push('/transactions');
      return;
    }
    
    fetchTransaction();
  }, [transactionId, router]);

  const fetchTransaction = async () => {
    try {
      // Fetch user info first
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUserId(userData.user.id);
      }

      const response = await fetch(`/api/escrow/${transactionId}`);
      const data = await response.json();
      
      if (data.success) {
        setTransaction(data.transaction);
      } else {
        setError(data.error || 'Transaction not found');
      }
    } catch (err) {
      setError('Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (updatedTransaction: IEscrowTransaction) => {
    setTransaction(updatedTransaction);
  };

  const handleContactSupport = () => {
    // Navigate to support page or open contact modal
    window.open('/support', '_blank');
  };

  const handleGoBack = () => {
    router.push('/transactions');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-6"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Transaction Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={handleGoBack}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Back to Transactions
              </button>
              <button
                onClick={handleContactSupport}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Transaction Not Found</h1>
            <button
              onClick={handleGoBack}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Back to Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Transactions
          </button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
              <p className="text-gray-600">Manage your book rental transaction</p>
            </div>
            <div className="flex items-center space-x-4">
              <TransactionStatusBadge transaction={transaction} size="md" />
              <ConfirmationStatusIndicator 
                transaction={transaction} 
                size="md" 
                showLabels={false}
                variant="compact"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Status Overview */}
            <TransactionStatus
              transactionId={transactionId}
              currentUserId={currentUserId}
              onStatusUpdate={handleStatusUpdate}
              showActions={false}
            />

            {/* Confirmation Panel */}
            <ConfirmationPanel
              transaction={transaction}
              currentUserId={currentUserId}
              onConfirmationUpdate={handleStatusUpdate}
            />

            {/* Confirmation History */}
            <ConfirmationHistory
              transaction={transaction}
              currentUserId={currentUserId}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Transaction Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Transaction Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {String(transaction._id).slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold">${transaction.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rental Fee:</span>
                  <span>${transaction.rentalFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span>${transaction.securityDeposit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="capitalize">{transaction.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Book Information */}
            {transaction.book && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Book Details</h3>
                <div className="space-y-3">
                  {(transaction.book as any).title && (
                    <div>
                      <p className="font-medium">{(transaction.book as any).title}</p>
                      {(transaction.book as any).author && (
                        <p className="text-sm text-gray-600">by {(transaction.book as any).author}</p>
                      )}
                    </div>
                  )}
                  {(transaction.book as any).condition && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Condition:</span>
                      <span className="capitalize">{(transaction.book as any).condition}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
              <div className="space-y-3">
                <button
                  onClick={handleContactSupport}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm"
                >
                  Contact Support
                </button>
                <div className="text-xs text-gray-500 text-center">
                  <p>Available 24/7 to help with your transaction</p>
                </div>
              </div>
            </div>

            {/* Transaction Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Transaction Created</p>
                    <p className="text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {transaction.confirmedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Payment Confirmed</p>
                      <p className="text-gray-500">
                        {new Date(transaction.confirmedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {transaction.completedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Transaction Completed</p>
                      <p className="text-gray-500">
                        {new Date(transaction.completedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {transaction.status === 'pending' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Expires At</p>
                      <p className="text-gray-500">
                        {new Date(transaction.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}