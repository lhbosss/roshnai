import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Book } from '@/models/Book';

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  await connectDB();
  const hasQ = q.trim().length > 0;
  // Show all books uploaded by others (exclude your own)
  const baseFilter: any = { lender: { $ne: auth.id } };
  const filter = hasQ ? { ...baseFilter, $or: [{ title: new RegExp(q, 'i') }, { author: new RegExp(q, 'i') }] } : baseFilter;
  const results = await Book.find(filter)
    .limit(100)
    .populate('lender', 'name');
  return NextResponse.json({ results });
}
