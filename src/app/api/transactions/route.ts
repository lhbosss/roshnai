import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Book } from '@/models/Book';

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const filter = auth.role === 'admin' ? {} : { $or: [{ lender: auth.id }, { borrower: auth.id }] };
  const txs = await Transaction.find(filter).populate('book lender borrower complaint');
  return NextResponse.json({ transactions: txs });
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const { bookId, rentalPrice } = await req.json();
    if (!bookId || rentalPrice == null) return NextResponse.json({ message: 'bookId and rentalPrice required' }, { status: 400 });
    await connectDB();
    const book = await Book.findById(bookId);
    if (!book) return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    if (!book.available) return NextResponse.json({ message: 'Book not available' }, { status: 400 });
    if (book.lender.toString() === auth.id) return NextResponse.json({ message: 'Cannot borrow your own book' }, { status: 400 });
    const existing = await Transaction.findOne({ book: bookId, borrower: auth.id, status: { $in: ['pending','negotiating','payment_pending','escrow'] } });
    if (existing) return NextResponse.json({ message: 'Active request already exists' }, { status: 400 });
    const commissionRate = 0.10;
    const platformCommission = Math.round(rentalPrice * commissionRate * 100) / 100;
    const tx = await Transaction.create({ book: book._id, lender: book.lender, borrower: auth.id, rentalPrice, platformCommission });
    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
