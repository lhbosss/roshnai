'use client';

import { IEscrowTransaction } from '@/models/EscrowTransaction';

interface StatusIndicatorProps {
  transaction: IEscrowTransaction;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function ConfirmationStatusIndicator({ 
  transaction, 
  size = 'md', 
  showLabels = true,
  variant = 'default'
}: StatusIndicatorProps) {
  const { lenderConfirmed, borrowerConfirmed, status } = transaction;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const getIndicatorColor = (confirmed: boolean, isPending: boolean) => {
    if (confirmed) return 'bg-green-500 text-white';
    if (isPending) return 'bg-yellow-400 text-gray-800';
    return 'bg-gray-300 text-gray-600';
  };

  const isTransactionActive = ['paid', 'confirmed'].includes(status);

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2">
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
          getIndicatorColor(lenderConfirmed, isTransactionActive)
        }`}>
          {lenderConfirmed ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="text-xs">L</span>
          )}
        </div>
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
          getIndicatorColor(borrowerConfirmed, isTransactionActive)
        }`}>
          {borrowerConfirmed ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="text-xs">B</span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Confirmation Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Lender Confirmed</span>
            <div className="flex items-center space-x-2">
              <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
                getIndicatorColor(lenderConfirmed, isTransactionActive)
              }`}>
                {lenderConfirmed ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isTransactionActive ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 012 0v4a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`text-xs font-medium ${
                lenderConfirmed ? 'text-green-600' : isTransactionActive ? 'text-yellow-600' : 'text-gray-400'
              }`}>
                {lenderConfirmed ? 'Yes' : isTransactionActive ? 'Pending' : 'Not Ready'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Borrower Confirmed</span>
            <div className="flex items-center space-x-2">
              <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
                getIndicatorColor(borrowerConfirmed, isTransactionActive)
              }`}>
                {borrowerConfirmed ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isTransactionActive ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 012 0v4a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`text-xs font-medium ${
                borrowerConfirmed ? 'text-green-600' : isTransactionActive ? 'text-yellow-600' : 'text-gray-400'
              }`}>
                {borrowerConfirmed ? 'Yes' : isTransactionActive ? 'Pending' : 'Not Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
          getIndicatorColor(lenderConfirmed, isTransactionActive)
        }`}>
          {lenderConfirmed ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : isTransactionActive ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="text-xs font-bold">L</span>
          )}
        </div>
        {showLabels && (
          <span className={`text-sm ${
            lenderConfirmed ? 'text-green-600' : isTransactionActive ? 'text-yellow-600' : 'text-gray-400'
          }`}>
            Lender
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
          getIndicatorColor(borrowerConfirmed, isTransactionActive)
        }`}>
          {borrowerConfirmed ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : isTransactionActive ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="text-xs font-bold">B</span>
          )}
        </div>
        {showLabels && (
          <span className={`text-sm ${
            borrowerConfirmed ? 'text-green-600' : isTransactionActive ? 'text-yellow-600' : 'text-gray-400'
          }`}>
            Borrower
          </span>
        )}
      </div>
    </div>
  );
}

interface TransactionStatusBadgeProps {
  transaction: IEscrowTransaction;
  size?: 'sm' | 'md' | 'lg';
}

export function TransactionStatusBadge({ transaction, size = 'md' }: TransactionStatusBadgeProps) {
  const getStatusDisplay = () => {
    const { status, lenderConfirmed, borrowerConfirmed } = transaction;
    
    if (status === 'completed') {
      return { text: 'Completed', color: 'bg-green-100 text-green-800' };
    }
    
    if (status === 'cancelled') {
      return { text: 'Cancelled', color: 'bg-red-100 text-red-800' };
    }
    
    if (status === 'refunded') {
      return { text: 'Refunded', color: 'bg-gray-100 text-gray-800' };
    }
    
    if (status === 'pending') {
      return { text: 'Payment Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    if (lenderConfirmed && borrowerConfirmed) {
      return { text: 'Both Confirmed', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (lenderConfirmed && !borrowerConfirmed) {
      return { text: 'Awaiting Borrower', color: 'bg-indigo-100 text-indigo-800' };
    }
    
    if (!lenderConfirmed && borrowerConfirmed) {
      return { text: 'Awaiting Lender', color: 'bg-purple-100 text-purple-800' };
    }
    
    return { text: 'Awaiting Confirmations', color: 'bg-orange-100 text-orange-800' };
  };

  const { text, color } = getStatusDisplay();
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${sizeClasses[size]}`}>
      {text}
    </span>
  );
}

interface ProgressRingProps {
  transaction: IEscrowTransaction;
  size?: number;
  strokeWidth?: number;
}

export function ConfirmationProgressRing({ 
  transaction, 
  size = 60, 
  strokeWidth = 4 
}: ProgressRingProps) {
  const { lenderConfirmed, borrowerConfirmed, status } = transaction;
  
  let progress = 0;
  if (status === 'completed') progress = 100;
  else if (lenderConfirmed && borrowerConfirmed) progress = 75;
  else if (lenderConfirmed || borrowerConfirmed) progress = 50;
  else if (status === 'paid' || status === 'confirmed') progress = 25;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const getColor = () => {
    if (status === 'completed') return '#10B981'; // green-500
    if (lenderConfirmed && borrowerConfirmed) return '#3B82F6'; // blue-500  
    if (lenderConfirmed || borrowerConfirmed) return '#F59E0B'; // amber-500
    if (status === 'paid' || status === 'confirmed') return '#6366F1'; // indigo-500
    return '#D1D5DB'; // gray-300
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-600">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}