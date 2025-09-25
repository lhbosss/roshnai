import { useState, useEffect, useCallback } from 'react';

interface TransactionMessageNotification {
  id: string;
  transactionId: string;
  bookTitle: string;
  senderName: string;
  messagePreview: string;
  priority: 'low' | 'normal' | 'high';
  type: 'message' | 'file_shared' | 'template_used' | 'status_related';
  timestamp: Date;
  read: boolean;
}

export function useTransactionMessageNotifications(userId: string) {
  const [notifications, setNotifications] = useState<TransactionMessageNotification[]>([]);

  // Poll for new message notifications
  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications/messages?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.notifications);
          }
        }
      } catch (error) {
        console.error('Failed to fetch message notifications:', error);
      }
    };

    // Initial fetch
    pollNotifications();

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(pollNotifications, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await fetch('/api/notifications/messages/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, [userId]);

  const addNotification = useCallback((notification: TransactionMessageNotification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only latest 50
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearAll,
    addNotification
  };
}

// Hook for managing typing indicators
export function useTypingIndicator(transactionId: string, currentUserId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Notify others when user starts/stops typing
  useEffect(() => {
    if (!isTyping) return;

    const notifyTyping = async () => {
      try {
        await fetch('/api/messages/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId,
            userId: currentUserId,
            isTyping: true
          })
        });
      } catch (error) {
        console.error('Failed to notify typing:', error);
      }
    };

    notifyTyping();

    // Stop typing notification after 3 seconds
    const timeout = setTimeout(async () => {
      try {
        await fetch('/api/messages/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId,
            userId: currentUserId,
            isTyping: false
          })
        });
      } catch (error) {
        console.error('Failed to stop typing notification:', error);
      }
      setIsTyping(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isTyping, transactionId, currentUserId]);

  // Poll for other users' typing status
  useEffect(() => {
    const pollTypingStatus = async () => {
      try {
        const response = await fetch(`/api/messages/typing?transactionId=${transactionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Filter out current user from typing list
            const otherTypingUsers = data.typingUsers.filter((userId: string) => userId !== currentUserId);
            setTypingUsers(otherTypingUsers);
          }
        }
      } catch (error) {
        console.error('Failed to fetch typing status:', error);
      }
    };

    const interval = setInterval(pollTypingStatus, 2000);
    return () => clearInterval(interval);
  }, [transactionId, currentUserId]);

  const startTyping = useCallback(() => {
    setIsTyping(true);
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
  }, []);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping
  };
}

// Hook for real-time message status updates
export function useMessageStatus(transactionId: string) {
  const [messageStatuses, setMessageStatuses] = useState<Record<string, {
    delivered: boolean;
    read: boolean;
    readAt?: Date;
  }>>({});

  useEffect(() => {
    const pollMessageStatuses = async () => {
      try {
        const response = await fetch(`/api/messages/status?transactionId=${transactionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessageStatuses(data.statuses);
          }
        }
      } catch (error) {
        console.error('Failed to fetch message statuses:', error);
      }
    };

    // Initial fetch
    pollMessageStatuses();

    // Poll every 10 seconds for status updates
    const interval = setInterval(pollMessageStatuses, 10000);

    return () => clearInterval(interval);
  }, [transactionId]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await fetch('/api/messages/status/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });

      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          read: true,
          readAt: new Date()
        }
      }));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  return {
    messageStatuses,
    markMessageAsRead
  };
}