import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Book } from '@/models/Book';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  try {
    await connectDB();
    const removed = await Book.findOneAndDelete({ _id: id, lender: auth.id });
    if (!removed) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
