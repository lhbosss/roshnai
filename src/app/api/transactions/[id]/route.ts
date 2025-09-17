import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Transaction } from '@/models/Transaction';

async function load(id: string) {
  return Transaction.findById(id).populate('book lender borrower complaint');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const tx = await load(params.id);
  if (!tx) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (auth.role !== 'admin' && tx.lender.toString() !== auth.id && tx.borrower.toString() !== auth.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ transaction: tx });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const tx = await load(params.id);
  if (!tx) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (auth.role !== 'admin' && tx.lender.toString() !== auth.id && tx.borrower.toString() !== auth.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const updates = await req.json();
  const allowed = ['status','paymentConfirmed','lenderConfirmed','borrowerConfirmed'];
  for (const k of Object.keys(updates)) {
    if (allowed.includes(k)) (tx as any)[k] = updates[k];
  }
  await tx.save();
  return NextResponse.json({ transaction: tx });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth || auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();
  await Transaction.findByIdAndDelete(params.id);
  return NextResponse.json({ message: 'Deleted' });
}
