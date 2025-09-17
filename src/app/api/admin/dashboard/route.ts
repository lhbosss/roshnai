import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { Complaint } from '@/models/Complaint';

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth || auth.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  await connectDB();
  const [userCount, transactionCount, openComplaints] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Complaint.countDocuments({ status: 'open' })
  ]);
  return NextResponse.json({ userCount, transactionCount, openComplaints });
}
