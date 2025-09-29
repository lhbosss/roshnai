'use client';
import React, { useEffect, useState } from 'react';

interface PaymentRecord {
  _id: string;
  transactionId: string;
  type: 'deposit' | 'payment' | 'refund' | 'hold' | 'release' | 'commission';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  paymentMethod?: string;
  processedAt?: string;
  createdAt: string;
  metadata?: {
    paymentIntentId?: string;
    refundReason?: string;
    failureReason?: string;
  };
}

interface PaymentHistoryProps {
  transactionId?: string;
  userId?: string;
  limit?: number;
  showFilters?: boolean;
}

export default function PaymentHistory({ 
  transactionId, 
  userId, 
  limit = 50,
  showFilters = true 
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateRange: ''
  });

  const loadPaymentHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (transactionId) params.set('transactionId', transactionId);
      if (userId) params.set('userId', userId);
      if (limit) params.set('limit', limit.toString());
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.dateRange) params.set('dateRange', filters.dateRange);

      const response = await fetch(`/api/payments/history?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load payment history');
      }

      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
  }, [transactionId, userId, filters]);

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💳';
      case 'payment': return '💰';
      case 'refund': return '🔄';
      case 'hold': return '🔒';
      case 'release': return '✅';
      case 'commission': return '📊';
      default: return '💸';
    }
  };

  const getPaymentColor = (type: string, status: string) => {
    if (status === 'failed') return '#ef4444';
    if (status === 'pending') return '#f59e0b';
    
    switch (type) {
      case 'deposit':
      case 'payment': return '#10b981';
      case 'refund': return '#8b5cf6';
      case 'hold': return '#f59e0b';
      case 'release': return '#10b981';
      case 'commission': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
      completed: { bg: '#d1fae5', text: '#065f46', label: 'Completed' },
      failed: { bg: '#fecaca', text: '#991b1b', label: 'Failed' },
      cancelled: { bg: '#f3f4f6', text: '#374151', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span 
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: config.bg, 
          color: config.text 
        }}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const calculateTotals = () => {
    const totals = payments.reduce((acc, payment) => {
      if (payment.status === 'completed') {
        switch (payment.type) {
          case 'deposit':
          case 'payment':
            acc.received += payment.amount;
            break;
          case 'refund':
            acc.refunded += payment.amount;
            break;
          case 'commission':
            acc.fees += payment.amount;
            break;
        }
      }
      return acc;
    }, { received: 0, refunded: 0, fees: 0 });

    return totals;
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading payment history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            <p className="text-sm text-gray-600">
              {payments.length} payment{payments.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {/* Summary Cards */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Received</p>
              <p className="text-lg font-semibold text-green-600">${totals.received.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Refunded</p>
              <p className="text-lg font-semibold text-purple-600">${totals.refunded.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Fees</p>
              <p className="text-lg font-semibold text-blue-600">${totals.fees.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && payments.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="payment">Payments</option>
                <option value="refund">Refunds</option>
                <option value="hold">Holds</option>
                <option value="release">Releases</option>
                <option value="commission">Fees</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Payment List */}
      <div className="divide-y divide-gray-200">
        {payments.length > 0 ? (
          payments.map((payment) => {
            const dateInfo = formatDate(payment.createdAt);
            const processedInfo = payment.processedAt ? formatDate(payment.processedAt) : null;
            
            return (
              <div key={payment._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-full text-white font-medium"
                      style={{ backgroundColor: getPaymentColor(payment.type, payment.status) }}
                    >
                      {getPaymentIcon(payment.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                          {payment.type.replace('-', ' ')}
                        </h4>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{payment.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {dateInfo.date} at {dateInfo.time}</span>
                        {processedInfo && (
                          <span>Processed: {processedInfo.date} at {processedInfo.time}</span>
                        )}
                        {payment.paymentMethod && (
                          <span className="capitalize">via {payment.paymentMethod}</span>
                        )}
                      </div>
                      {payment.metadata?.failureReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Failure reason: {payment.metadata.failureReason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p 
                      className="text-lg font-semibold"
                      style={{ 
                        color: payment.type === 'refund' ? '#8b5cf6' : getPaymentColor(payment.type, payment.status)
                      }}
                    >
                      {payment.type === 'refund' ? '+' : payment.type === 'commission' ? '-' : '+'}
                      ${payment.amount.toFixed(2)}
                    </p>
                    {payment.metadata?.paymentIntentId && (
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {payment.metadata.paymentIntentId.slice(-6)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-4xl mb-3">💳</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No payment history</h4>
            <p className="text-gray-600">Payment records will appear here once transactions are made.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {payments.length === limit && (
        <div className="px-6 py-4 border-t text-center">
          <button 
            onClick={() => loadPaymentHistory()}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Load More History
          </button>
        </div>
      )}
    </div>
  );
}