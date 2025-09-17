import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const message = await Message.findById(params.id).populate('sender receiver transaction');
  if (!message) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (auth.role !== 'admin' && message.sender.toString() !== auth.id && message.receiver.toString() !== auth.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ message });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const message = await Message.findById(params.id);
  if (!message) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (auth.role !== 'admin' && message.sender.toString() !== auth.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  if (body.content) message.content = body.content;
  await message.save();
  return NextResponse.json({ message });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();
  await Message.findByIdAndDelete(params.id);
  return NextResponse.json({ message: 'Deleted' });
}
