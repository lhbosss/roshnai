import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth || auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();
  await User.findByIdAndDelete(params.id);
  return NextResponse.json({ message: 'Deleted' });
}
