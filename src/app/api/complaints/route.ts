import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Complaint } from '@/models/Complaint';
import { Transaction } from '@/models/Transaction';

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const filter = auth.role === 'admin' ? {} : { complainant: auth.id };
  const complaints = await Complaint.find(filter).populate('transaction complainant against');
  return NextResponse.json({ complaints });
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const { transactionId, againstUserId, reason } = await req.json();
    if (!transactionId || !againstUserId || !reason) return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    await connectDB();
    const tx = await Transaction.findById(transactionId);
    if (!tx) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    const involved = [tx.lender.toString(), tx.borrower.toString()];
    if (!involved.includes(auth.id)) return NextResponse.json({ message: 'Not part of transaction' }, { status: 403 });
    if (!involved.includes(againstUserId) || againstUserId === auth.id) return NextResponse.json({ message: 'Invalid against user' }, { status: 400 });
    const complaint = await Complaint.create({ transaction: tx._id, complainant: auth.id, against: againstUserId, reason });
    return NextResponse.json({ complaint }, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
