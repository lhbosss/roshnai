import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Complaint } from '@/models/Complaint';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth || auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const complaint = await Complaint.findByIdAndUpdate(params.id, { status: 'rejected', resolution: body.resolution }, { new: true });
  if (!complaint) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ complaint });
}
