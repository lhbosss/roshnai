"use client";
import React from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isLogin = pathname === '/';
  const isRegister = pathname === '/register';
  if (isRegister || isLogin) return null;
  // Other pages: no brand/logo/button and no navigation links
  return (
    <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="max-w-4xl mx-auto p-3" />
    </header>
  );
}
