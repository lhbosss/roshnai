'use client';

import { useEffect, useState } from 'react';
import NotificationProvider from './NotificationProvider';

interface NotificationWrapperProps {
  children: React.ReactNode;
}

export default function NotificationWrapper({ children }: NotificationWrapperProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get user information from auth
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUserId(userData.id);
        }
      } catch (error) {
        console.log('User not authenticated');
      } finally {
        setMounted(true);
      }
    };

    checkAuth();
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  if (!userId) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider userId={userId}>
      {children}
    </NotificationProvider>
  );
}