import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
  const { name, username, email, password, department, batch } = await req.json();
  if (!name || !username || !email || !password || !department || !batch) return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
  const domain = process.env.EMAIL_DOMAIN || '@student.nust.edu.pk';
  if (!email.endsWith(domain)) return NextResponse.json({ message: `Email must end with ${domain}` }, { status: 400 });
  const allowedDepartments = ['SCEE','SCME','SEECS','SMME','USPCAS-E','IESE','NICE','IGIS','NBS','SADA','CIPS','NIPCONS','S3H','NLS','JSPPL','ASAB','SNS','NSHS','SINES'];
  const allowedBatches = ['2k22','2k23','2k24','2k25'];
  if (!allowedDepartments.includes(department)) return NextResponse.json({ message: 'Invalid department' }, { status: 400 });
  if (!allowedBatches.includes(batch)) return NextResponse.json({ message: 'Invalid batch' }, { status: 400 });
    await connectDB();
  const normEmail = email.toLowerCase().trim();
  const normUsername = String(username).toLowerCase().trim();
  if (!/^[a-z0-9_]{3,20}$/i.test(normUsername)) return NextResponse.json({ message: 'Invalid username. Use 3-20 letters, numbers, or _.' }, { status: 400 });
  const exists = await User.findOne({ $or: [{ email: normEmail }, { username: normUsername }] });
    if (exists) {
      const msg = exists.email === normEmail ? 'Email already registered' : 'Username already taken';
      return NextResponse.json({ message: msg }, { status: 400 });
    }
  const hash = await bcrypt.hash(password, 10);
  await User.create({ name, username: normUsername, email: normEmail, password: hash, department, batch });
    return NextResponse.json({ message: 'Registered. Please login.' }, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
