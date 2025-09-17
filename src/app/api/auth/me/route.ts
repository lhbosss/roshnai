import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  const payload = getAuth(req);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const user = await User.findById(payload.id).select('-password');
  return NextResponse.json({ user });
}
