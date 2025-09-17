import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import { Transaction } from '@/models/Transaction';

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const filter = auth.role === 'admin' ? {} : { $or: [{ sender: auth.id }, { receiver: auth.id }] };
  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate([
      { path: 'sender', select: 'name username email role' },
      { path: 'receiver', select: 'name username email role' },
      { path: 'transaction' },
    ]);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const { transactionId, content, type } = await req.json();
    if (!transactionId || !content) return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    await connectDB();
    const tx = await Transaction.findById(transactionId);
    if (!tx) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    const participants = [tx.lender.toString(), tx.borrower.toString()];
    if (!participants.includes(auth.id)) return NextResponse.json({ message: 'Not part of transaction' }, { status: 403 });
    const receiver = participants.find(p => p !== auth.id)!;
    const message = await Message.create({ transaction: tx._id, sender: auth.id, receiver, content, type: type || 'text' });
    return NextResponse.json({ message }, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
