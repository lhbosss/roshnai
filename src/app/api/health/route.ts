import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ ok: true, db: 'connected' });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
