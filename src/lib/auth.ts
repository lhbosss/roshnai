import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

interface TokenPayload { id: string; email: string; role: string; }

export function signToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] verifyToken failed');
    }
    return null;
  }
}

export function getAuth(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] no token cookie present');
    }
    return null;
  }
  return verifyToken(token);
}
