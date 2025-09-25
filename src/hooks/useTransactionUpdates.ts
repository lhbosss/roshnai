'use client';

import { useState, useEffect, useCallback } from 'react';
import { IEscrowTransaction } from '@/models/EscrowTransaction';

interface UseTransactionUpdatesProps {
  transactionId: string;
  onUpdate?: (transaction: IEscrowTransaction) => void;
  pollInterval?: number;
}

export function useTransactionUpdates({ 
  transactionId, 
  onUpdate,
  pollInterval = 5000 // 5 seconds
}: UseTransactionUpdatesProps) {
  const [transaction, setTransaction] = useState<IEscrowTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const fetchTransaction = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await fetch(`/api/escrow/${transactionId}`, {
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.success) {
        const newTransaction = data.transaction;
        
        // Check if there are meaningful changes
        const hasChanges = !transaction || 
          transaction.status !== newTransaction.status ||
          transaction.lenderConfirmed !== newTransaction.lenderConfirmed ||
          transaction.borrowerConfirmed !== newTransaction.borrowerConfirmed ||
          transaction.updatedAt !== newTransaction.updatedAt;

        if (hasChanges) {
          setTransaction(newTransaction);
          setLastUpdated(new Date());
          onUpdate?.(newTransaction);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch transaction updates');
      console.error('Transaction update error:', err);
    } finally {
      setLoading(false);
    }
  }, [transactionId, transaction, onUpdate]);

  // Initial fetch
  useEffect(() => {
    fetchTransaction(true);
  }, [transactionId]);

  // Polling for updates
  useEffect(() => {
    if (!transactionId) return;

    const interval = setInterval(() => {
      // Only poll if transaction is still active
      if (transaction && ['pending', 'paid', 'confirmed'].includes(transaction.status)) {
        fetchTransaction(false);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [fetchTransaction, pollInterval, transaction]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchTransaction(true);
  }, [fetchTransaction]);

  // Subscribe to status changes for active polling
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    const handleFocus = () => {
      setIsActive(true);
      fetchTransaction(false); // Refresh on focus
    };

    const handleBlur = () => {
      setIsActive(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [fetchTransaction]);

  // Adjust polling based on activity
  const activePollInterval = isActive ? pollInterval : pollInterval * 3;

  return {
    transaction,
    loading,
    error,
    lastUpdated,
    refresh,
    isPolling: isActive && transaction && ['pending', 'paid', 'confirmed'].includes(transaction.status)
  };
}

// Real-time notification hook
export function useTransactionNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    transactionId: string;
    message: string;
    type: 'confirmation' | 'status_change' | 'payment';
    timestamp: Date;
    read: boolean;
  }>>([]);

  const addNotification = useCallback((notification: {
    transactionId: string;
    message: string;
    type: 'confirmation' | 'status_change' | 'payment';
  }) => {
    const newNotification = {
      id: `${Date.now()}-${Math.random()}`,
      ...notification,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep last 10

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };
}