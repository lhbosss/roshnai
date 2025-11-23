import './globals.css';
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NotificationWrapper>
          <Header />
          <main style={{ width: '100%', flex: 1 }}>{children}</main>
          <Footer />
          <MessagesFAB />
        </NotificationWrapper>
      </body>
    </html>
  );
}
