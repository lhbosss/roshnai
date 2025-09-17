import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Book } from '@/models/Book';

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const books = await Book.find({ lender: auth.id });
  return NextResponse.json({ books });
}
