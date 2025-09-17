import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User, IUser } from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });
    const domain = process.env.EMAIL_DOMAIN || '@student.nust.edu.pk';
    if (!email.endsWith(domain)) return NextResponse.json({ message: `Email must end with ${domain}` }, { status: 400 });
    await connectDB();
  const user = await User.findOne({ email: email.toLowerCase().trim() }) as IUser | null;
    if (!user) return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
  const token = signToken({ id: (user._id as any).toString(), email: user.email, role: user.role });
    const res = NextResponse.json({ message: 'Logged in' });
    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60*60*24*7,
    });
    return res;
  }
   catch (e:any) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
