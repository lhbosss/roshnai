import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Complaint } from '@/models/Complaint';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const complaint = await Complaint.findById(params.id).populate('transaction complainant against');
  if (!complaint) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (auth.role !== 'admin' && complaint.complainant.toString() !== auth.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ complaint });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const complaint = await Complaint.findById(params.id);
  if (!complaint) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (auth.role !== 'admin' && complaint.complainant.toString() !== auth.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  if (body.reason) complaint.reason = body.reason;
  await complaint.save();
  return NextResponse.json({ complaint });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const complaint = await Complaint.findById(params.id);
  if (!complaint) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (auth.role !== 'admin' && complaint.complainant.toString() !== auth.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await complaint.deleteOne();
  return NextResponse.json({ message: 'Deleted' });
}
