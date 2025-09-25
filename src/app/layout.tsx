import './globals.css';
import React from 'react';
import Header from '@/components/Header';
import MessagesFAB from '@/components/MessagesFAB';
import NotificationWrapper from '@/components/NotificationWrapper';

export const metadata = { 
  title: 'Roshanai Library', 
  description: 'Peer to peer book lending',
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon.ico' }
    ],
    apple: { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    other: [
      { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
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
