import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Book } from '@/models/Book';

export async function GET() {
  await connectDB();
  const books = await Book.find().populate('lender', 'name');
  return NextResponse.json({ books });
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const { 
      title, 
      author, 
      description, 
      coverUrl, 
      rentalFee, 
      securityDeposit, 
      condition, 
      rentalDuration,
      category,
      isbn,
      publishedYear,
      language 
    } = await req.json();
    
    if (!title || !author) return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    
    await connectDB();
    
    // Provide default values for required fields if not provided
    const bookData = {
      title,
      author,
      description,
      coverUrl,
      lender: auth.id,
      rentalFee: rentalFee || 100, // Default PKR 100
      securityDeposit: securityDeposit || 200, // Default PKR 200
      condition: condition || 'good', // Default condition
      rentalDuration: rentalDuration || 14, // Default 14 days
      category,
      isbn,
      publishedYear,
      language: language || 'English'
    };
    
    const book = await Book.create(bookData);
    return NextResponse.json({ book }, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
