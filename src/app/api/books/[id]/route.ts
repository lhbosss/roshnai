import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Book } from '@/models/Book';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const bookId = params.id;

    // Validate ObjectId format
    if (!bookId || !bookId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid book ID format' },
        { status: 400 }
      );
    }

    // Find book and populate lender information
    const book = await Book.findById(bookId)
      .populate('lender', 'name email')
      .lean();

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain object and ensure proper serialization
    const bookData = {
      ...book,
      _id: book._id.toString(),
      lender: {
        ...book.lender,
        _id: book.lender._id.toString()
      },
      createdAt: book.createdAt?.toISOString(),
      updatedAt: book.updatedAt?.toISOString()
    };

    return NextResponse.json(bookData);

  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  try {
    await connectDB();
    const removed = await Book.findOneAndDelete({ _id: id, lender: auth.id });
    if (!removed) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
