import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Book } from '@/models/Book';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Disabled in production' }, { status: 403 });
  }
  const key = req.nextUrl.searchParams.get('key');
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    const adminEmail = 'admin@student.nust.edu.pk';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hash = await bcrypt.hash('AdminPass123!', 10);
  admin = await User.create({ name: 'Admin', username: 'admin', email: adminEmail, password: hash, role: 'admin' });
    }
    const bookCount = await Book.countDocuments();
    if (!bookCount) {
      await Book.create([
        { title: 'Clean Code', author: 'Robert C. Martin', lender: admin._id, description: 'A Handbook of Agile Software Craftsmanship', available: true },
        { title: 'Design Patterns', author: 'GoF', lender: admin._id, description: 'Elements of Reusable Object-Oriented Software', available: true }
      ]);
    }
    return NextResponse.json({ message: 'Seed complete', adminCreated: !!admin, booksSeeded: !bookCount });
  } catch (e:any) {
    return NextResponse.json({ message: e.message || 'Seed error' }, { status: 500 });
  }
}
