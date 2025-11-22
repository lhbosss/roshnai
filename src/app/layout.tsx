import './globals.css';
import React from 'react';
import Header from '@/components/Header';
import MessagesFAB from '@/components/MessagesFAB';
import NotificationWrapper from '@/components/NotificationWrapper';

export const metadata = { 
  title: 'Readioo', 
  description: 'Peer to peer book lending', 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>
      <body style={{ minHeight: '100vh' }}>
        <NotificationWrapper>
          <Header />
          <main style={{ width: '100%' }}>{children}</main>
          <MessagesFAB />
        </NotificationWrapper>
      </body>
    </html>
  );
}
