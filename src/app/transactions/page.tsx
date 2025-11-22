"use client";
import React, { useEffect, useState } from 'react';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import PaymentHistory from '@/components/PaymentHistory';

interface Tx { 
  _id: string; 
  status: string; 
  escrowStatus?: string;
  rentalPrice: number; 
  platformCommission: number; 
  securityDeposit?: number;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
  book?: any; 
  lender?: any; 
  borrower?: any;
  createdAt?: string;
  lastUpdated?: string;
  refundAmount?: number;
  dispute?: {
    status: string;
    reason: string;
    createdAt: string;
  };
}

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'payments'>('transactions');
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    setError('');
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('Failed to load transactions');
      const data = await res.json();
      setTxs(data.transactions || []); 
    } catch (e: any) {
      setError(e.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  const handleTransactionAction = async (txId: string, action: string) => {
    setActionLoading(txId + action);
    try {
      const res = await fetch(`/api/transactions/${txId}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error('Action failed');
      await load(); // Refresh transactions
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusInfo = (status: string, escrowStatus?: string) => {
    const statusMap = {
      pending: { 
        color: '#f59e0b', 
        bg: '#fef3c7', 
        icon: '⏳', 
        label: 'Pending Approval',
        description: 'Waiting for lender approval'
      },
      active: { 
        color: '#10b981', 
        bg: '#d1fae5', 
        icon: '📖', 
        label: 'Active Rental',
        description: 'Book is currently borrowed'
      },
      completed: { 
        color: '#3b82f6', 
        bg: '#dbeafe', 
        icon: '✅', 
        label: 'Completed',
        description: 'Transaction completed successfully'
      },
      rejected: { 
        color: '#ef4444', 
        bg: '#fecaca', 
        icon: '❌', 
        label: 'Rejected',
        description: 'Request was declined'
      },
      disputed: { 
        color: '#f97316', 
        bg: '#fed7aa', 
        icon: '⚠️', 
        label: 'Disputed',
        description: 'Transaction under dispute'
      },
      overdue: { 
        color: '#dc2626', 
        bg: '#fecaca', 
        icon: '🔴', 
        label: 'Overdue',
        description: 'Return is past due date'
      }
    };

    return statusMap[status.toLowerCase() as keyof typeof statusMap] || {
      color: '#6b7280',
      bg: '#f3f4f6',
      icon: '📋',
      label: status,
      description: 'Unknown status'
    };
  };

  const getEscrowStatus = (escrowStatus?: string) => {
    if (!escrowStatus) return null;
    
    const escrowMap = {
      'funds-held': { icon: '🔒', label: 'Funds Held', color: '#f59e0b' },
      'payment-pending': { icon: '💳', label: 'Payment Processing', color: '#3b82f6' },
      'refund-processing': { icon: '🔄', label: 'Refund Processing', color: '#8b5cf6' },
      'funds-released': { icon: '💰', label: 'Funds Released', color: '#10b981' }
    };

    return escrowMap[escrowStatus as keyof typeof escrowMap];
  };

  const getAvailableActions = (tx: Tx) => {
    const actions = [];
    
    if (tx.status === 'active') {
      actions.push(
        { id: 'extend', label: 'Extend Rental', icon: '📅', color: '#3b82f6' },
        { id: 'return', label: 'Mark Returned', icon: '📤', color: '#10b981' }
      );
    }
    
    if (tx.status === 'pending') {
      actions.push(
        { id: 'cancel', label: 'Cancel Request', icon: '❌', color: '#ef4444' }
      );
    }
    
    if (['active', 'completed'].includes(tx.status) && !tx.dispute) {
      actions.push(
        { id: 'dispute', label: 'Report Issue', icon: '⚠️', color: '#f97316' }
      );
    }
    
    if (tx.status === 'completed' && !tx.dispute) {
      actions.push(
        { id: 'review', label: 'Leave Review', icon: '⭐', color: '#8b5cf6' }
      );
    }

    return actions;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumb />
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Financial Dashboard</h1>
        <p className="text-gray-600">Track your transactions and payment history</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'transactions', label: 'Transactions', icon: '📋' },
            { id: 'payments', label: 'Payment History', icon: '💳' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Transactions', value: txs.length, icon: '📊', color: '#3b82f6' },
              { label: 'Active Rentals', value: txs.filter(t => t.status === 'active').length, icon: '📖', color: '#10b981' },
              { label: 'Pending Approval', value: txs.filter(t => t.status === 'pending').length, icon: '⏳', color: '#f59e0b' },
              { label: 'Disputes', value: txs.filter(t => t.dispute).length, icon: '⚠️', color: '#ef4444' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="text-3xl" style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Transactions Content */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading transactions...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div>
              {txs.length > 0 ? (
                <div className="space-y-6">
                  {txs.map(tx => {
                    const statusInfo = getStatusInfo(tx.status, tx.escrowStatus);
                    const escrowInfo = getEscrowStatus(tx.escrowStatus);
                    const actions = getAvailableActions(tx);
                    const daysRemaining = getDaysRemaining(tx.endDate);
                    const isExpanded = selectedTx === tx._id;

                    return (
                      <div key={tx._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        {/* Main Transaction Card */}
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Book Cover */}
                            <div className="flex-shrink-0">
                              <img 
                                src={tx.book?.coverUrl || '/images/default-book-cover.svg'} 
                                alt={tx.book?.title || 'Book'} 
                                className="w-20 h-28 object-cover rounded-lg shadow-sm"
                              />
                            </div>

                            {/* Transaction Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                    {tx.book?.title || 'Unknown Book'}
                                  </h3>
                                  <p className="text-gray-600 text-sm mb-2">
                                    by {tx.book?.author || 'Unknown Author'}
                                  </p>
                                </div>

                                {/* Status Badges */}
                                <div className="flex flex-col items-end gap-2">
                                  <div 
                                    className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                                    style={{ 
                                      backgroundColor: statusInfo.bg,
                                      color: statusInfo.color
                                    }}
                                  >
                                    <span>{statusInfo.icon}</span>
                                    <span>{statusInfo.label}</span>
                                  </div>
                                  {escrowInfo && (
                                    <div 
                                      className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100"
                                      style={{ color: escrowInfo.color }}
                                    >
                                      <span>{escrowInfo.icon}</span>
                                      <span>{escrowInfo.label}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Key Details Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rental Price</p>
                                  <p className="text-lg font-semibold text-green-600">${tx.rentalPrice}</p>
                                </div>
                                {tx.securityDeposit && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Security Deposit</p>
                                    <p className="text-lg font-medium text-gray-900">${tx.securityDeposit}</p>
                                  </div>
                                )}
                                {tx.startDate && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Start Date</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(tx.startDate)}</p>
                                  </div>
                                )}
                                {tx.endDate && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
                                    <p className={`text-sm font-medium ${daysRemaining && daysRemaining < 0 ? 'text-red-600' : daysRemaining && daysRemaining <= 3 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                      {formatDate(tx.endDate)}
                                      {daysRemaining !== null && (
                                        <span className="text-xs ml-1">
                                          ({daysRemaining > 0 ? `${daysRemaining} days left` : daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`})
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Participants */}
                              <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-4">
                                {tx.lender && (
                                  <div>
                                    <span className="font-medium">Lender: </span>
                                    <span>{tx.lender.name}</span>
                                  </div>
                                )}
                                {tx.borrower && (
                                  <div>
                                    <span className="font-medium">Borrower: </span>
                                    <span>{tx.borrower.name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                  {actions.map(action => (
                                    <button
                                      key={action.id}
                                      onClick={() => handleTransactionAction(tx._id, action.id)}
                                      disabled={actionLoading === tx._id + action.id}
                                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 border"
                                      style={{ 
                                        color: action.color,
                                        borderColor: action.color + '30'
                                      }}
                                    >
                                      <span>{action.icon}</span>
                                      <span>{actionLoading === tx._id + action.id ? 'Processing...' : action.label}</span>
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={() => setSelectedTx(isExpanded ? null : tx._id)}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  {isExpanded ? 'Show Less' : 'View Details'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t bg-gray-50 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Transaction Timeline */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Transaction Timeline</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="font-medium">{formatDate(tx.createdAt)}</span>
                                  </div>
                                  {tx.startDate && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Started:</span>
                                      <span className="font-medium">{formatDate(tx.startDate)}</span>
                                    </div>
                                  )}
                                  {tx.returnDate && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Returned:</span>
                                      <span className="font-medium">{formatDate(tx.returnDate)}</span>
                                    </div>
                                  )}
                                  {tx.lastUpdated && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Last Updated:</span>
                                      <span className="font-medium">{formatDate(tx.lastUpdated)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Financial Details */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Financial Summary</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Rental Fee:</span>
                                    <span className="font-medium">${tx.rentalPrice}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Platform Commission:</span>
                                    <span className="font-medium">${tx.platformCommission}</span>
                                  </div>
                                  {tx.securityDeposit && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Security Deposit:</span>
                                      <span className="font-medium">${tx.securityDeposit}</span>
                                    </div>
                                  )}
                                  {tx.refundAmount && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Refund Amount:</span>
                                      <span className="font-medium text-green-600">${tx.refundAmount}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-2 border-t font-semibold">
                                    <span>Total:</span>
                                    <span>${(tx.rentalPrice + tx.platformCommission + (tx.securityDeposit || 0))}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Dispute Information */}
                            {tx.dispute && (
                              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <h4 className="font-semibold text-orange-900 mb-2">Dispute Information</h4>
                                <div className="text-sm text-orange-800">
                                  <p><strong>Status:</strong> {tx.dispute.status}</p>
                                  <p><strong>Reason:</strong> {tx.dispute.reason}</p>
                                  <p><strong>Filed:</strong> {formatDate(tx.dispute.createdAt)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500 mb-6">Start borrowing or lending books to see your transaction history</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button 
                      onClick={() => { window.location.href='/borrow'; }}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Books
                    </button>
                    <button 
                      onClick={() => { window.location.href='/my-books/add'; }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Add a Book
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'payments' && (
        <div className="mt-8">
          <PaymentHistory limit={100} showFilters={true} />
        </div>
      )}
    </div>
  );
}
