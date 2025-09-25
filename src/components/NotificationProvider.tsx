'use client';

import { useState, useEffect } from 'react';
import { useTransactionUpdates, useTransactionNotifications } from '@/hooks/useTransactionUpdates';
import TransactionNotifications from './TransactionNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
  userId: string;
}

export default function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [mounted, setMounted] = useState(false);
  const { 
    notifications, 
    markAsRead, 
    clearAll,
    unreadCount
  } = useTransactionNotifications(userId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <TransactionNotifications
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onClearAll={clearAll}
      />
      {unreadCount > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        </div>
      )}
    </>
  );
}