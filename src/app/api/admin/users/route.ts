import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth || auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();
  const users = await User.find().select('-password');
  return NextResponse.json({ users });
}
