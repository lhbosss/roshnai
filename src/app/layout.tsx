import './globals.css';
import React from 'react';
import Header from '@/components/Header';
import MessagesFAB from '@/components/MessagesFAB';

export const metadata = { title: 'Roshanai Library', description: 'Peer to peer book lending' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh' }}>
        <Header />
        <main style={{ width: '100%' }}>{children}</main>
        <MessagesFAB />
      </body>
    </html>
  );
}
