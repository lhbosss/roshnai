'use client';

import { useState, useEffect } from 'react';
import { IEscrowTransaction } from '@/models/EscrowTransaction';

interface ConfirmationEvent {
  id: string;
  type: 'payment' | 'lender_confirm' | 'borrower_confirm' | 'completed' | 'cancelled' | 'refunded' | 'expired';
  title: string;
  description: string;
  timestamp: Date;
  actor?: string; // User who performed the action
  status: 'completed' | 'pending' | 'failed';
  metadata?: any;
}

interface ConfirmationHistoryProps {
  transaction: IEscrowTransaction;
  currentUserId: string;
  className?: string;
}

export default function ConfirmationHistory({ 
  transaction, 
  currentUserId,
  className = ''
}: ConfirmationHistoryProps) {
  const [events, setEvents] = useState<ConfirmationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateTimelineEvents();
  }, [transaction]);

  const generateTimelineEvents = () => {
    const timeline: ConfirmationEvent[] = [];

    // Transaction Created
    timeline.push({
      id: 'created',
      type: 'payment',
      title: 'Transaction Created',
      description: 'Escrow transaction initiated',
      timestamp: new Date(transaction.createdAt),
      status: 'completed'
    });

    // Payment Confirmed
    if (transaction.status !== 'pending') {
      timeline.push({
        id: 'payment',
        type: 'payment',
        title: 'Payment Confirmed',
        description: `Payment of $${transaction.totalAmount} received and held in escrow`,
        timestamp: transaction.confirmedAt ? new Date(transaction.confirmedAt) : new Date(transaction.createdAt),
        status: 'completed'
      });
    }

    // Lender Confirmation
    if (transaction.lenderConfirmed) {
      timeline.push({
        id: 'lender_confirm',
        type: 'lender_confirm',
        title: 'Book Lent',
        description: 'Lender confirmed that the book has been given to borrower',
        timestamp: transaction.confirmedAt ? new Date(transaction.confirmedAt) : new Date(),
        actor: 'lender',
        status: 'completed'
      });
    } else if (transaction.status === 'paid' || transaction.status === 'confirmed') {
      timeline.push({
        id: 'lender_confirm_pending',
        type: 'lender_confirm',
        title: 'Waiting for Lender',
        description: 'Lender needs to confirm book has been given to borrower',
        timestamp: new Date(),
        status: 'pending'
      });
    }

    // Borrower Confirmation  
    if (transaction.borrowerConfirmed) {
      timeline.push({
        id: 'borrower_confirm',
        type: 'borrower_confirm',
        title: 'Book Received',
        description: 'Borrower confirmed receipt of book in good condition',
        timestamp: transaction.confirmedAt ? new Date(transaction.confirmedAt) : new Date(),
        actor: 'borrower',
        status: 'completed'
      });
    } else if (transaction.status === 'paid' || transaction.status === 'confirmed') {
      timeline.push({
        id: 'borrower_confirm_pending',
        type: 'borrower_confirm',
        title: 'Waiting for Borrower',
        description: 'Borrower needs to confirm receipt of book',
        timestamp: new Date(),
        status: 'pending'
      });
    }

    // Transaction Completion
    if (transaction.status === 'completed') {
      timeline.push({
        id: 'completed',
        type: 'completed',
        title: 'Transaction Completed',
        description: 'Both parties confirmed - rental fee released to lender',
        timestamp: transaction.completedAt ? new Date(transaction.completedAt) : new Date(),
        status: 'completed'
      });
    }

    // Cancellation
    if (transaction.status === 'cancelled') {
      timeline.push({
        id: 'cancelled',
        type: 'cancelled',
        title: 'Transaction Cancelled',
        description: transaction.refundReason || 'Transaction was cancelled',
        timestamp: transaction.refundedAt ? new Date(transaction.refundedAt) : new Date(),
        status: 'failed'
      });
    }

    // Refund
    if (transaction.status === 'refunded') {
      timeline.push({
        id: 'refunded',
        type: 'refunded',
        title: 'Refund Processed',
        description: transaction.refundReason || 'Transaction was refunded',
        timestamp: transaction.refundedAt ? new Date(transaction.refundedAt) : new Date(),
        status: 'completed'
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    setEvents(timeline);
    setLoading(false);
  };

  const getEventIcon = (type: string, status: string) => {
    const iconClass = `w-4 h-4 ${status === 'completed' ? 'text-white' : status === 'pending' ? 'text-blue-600' : 'text-red-600'}`;
    
    switch (type) {
      case 'payment':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
          </svg>
        );
      case 'lender_confirm':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5zM8 15v-3h4v3H8z" clipRule="evenodd" />
          </svg>
        );
      case 'borrower_confirm':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'completed':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'cancelled':
      case 'refunded':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-blue-100 border-2 border-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  const isCurrentUserAction = (actor?: string) => {
    if (!actor) return false;
    const isLender = String(transaction.lender) === currentUserId || (transaction.lender as any)?._id === currentUserId;
    const isBorrower = String(transaction.borrower) === currentUserId || (transaction.borrower as any)?._id === currentUserId;
    
    return (actor === 'lender' && isLender) || (actor === 'borrower' && isBorrower);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Transaction Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex items-start space-x-4">
              {/* Timeline Node */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${getEventColor(event.status)}`}>
                {getEventIcon(event.type, event.status)}
              </div>
              
              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    event.status === 'completed' ? 'text-green-800' : 
                    event.status === 'pending' ? 'text-blue-800' : 
                    'text-red-800'
                  }`}>
                    {event.title}
                    {isCurrentUserAction(event.actor) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        You
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {event.description}
                </p>
                
                {/* Additional Details */}
                {event.metadata && (
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <div key={key}>
                        {key}: {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-semibold text-green-600">
              {events.filter(e => e.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-blue-600">
              {events.filter(e => e.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-gray-600">
              {Math.ceil((new Date().getTime() - new Date(transaction.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-gray-500">Days Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}