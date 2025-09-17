import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_PREFIXES = ['/my-books','/borrow','/profile','/transactions','/messages','/complaints','/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();
  const token = req.cookies.get('token')?.value;
  if (!token) {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }
  // Verify JWT using Edge-compatible jose
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    const key = new TextEncoder().encode(secret);
    await jwtVerify(token, key); // throws if invalid/expired
  } catch {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/my-books','/borrow','/profile','/transactions','/messages','/complaints','/admin'] };
