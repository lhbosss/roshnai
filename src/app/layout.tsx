import './globals.css';
import React from 'react';
import Header from '@/components/Header';
import MessagesFAB from '@/components/MessagesFAB';

export const metadata = { title: 'Roshanai Library', description: 'Peer to peer book lending' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
  <main className="w-full p-4">{children}</main>
  <MessagesFAB />
      </body>
    </html>
  );
}
