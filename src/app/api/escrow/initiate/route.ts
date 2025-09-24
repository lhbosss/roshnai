import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Book } from '@/models/Book';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { Message } from '@/models/Message';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { bookId, paymentMethod, totalAmount, rentalFee, securityDeposit, termsAccepted } = body;

    // Validate required fields
    if (!bookId || !paymentMethod || !totalAmount || !termsAccepted) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!bookId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid book ID format' },
        { status: 400 }
      );
    }

    // Find and validate book
    const book = await Book.findById(bookId).populate('lender', 'name email');
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (!book.available) {
      return NextResponse.json(
        { error: 'Book is not available for borrowing' },
        { status: 400 }
      );
    }

    // Prevent self-borrowing
    if (book.lender._id.toString() === auth.id) {
      return NextResponse.json(
        { error: 'Cannot borrow your own book' },
        { status: 400 }
      );
    }

    // Check if there's already a pending transaction for this book
    const existingTransaction = await EscrowTransaction.findOne({
      book: bookId,
      status: { $in: ['pending', 'paid', 'confirmed'] }
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'There is already a pending transaction for this book' },
        { status: 400 }
      );
    }

    // Calculate expected amounts (validate against book data if available)
    const expectedRentalFee = book.rentalFee || rentalFee || 0;
    const expectedSecurityDeposit = book.securityDeposit || securityDeposit || 0;
    const expectedTotal = expectedRentalFee + expectedSecurityDeposit;

    if (Math.abs(totalAmount - expectedTotal) > 0.01) { // Allow small floating point differences
      return NextResponse.json(
        { error: 'Payment amount does not match expected total' },
        { status: 400 }
      );
    }

    // Create escrow transaction
    const escrowTransaction = new EscrowTransaction({
      book: bookId,
      borrower: auth.id,
      lender: book.lender._id,
      totalAmount: expectedTotal,
      rentalFee: expectedRentalFee,
      securityDeposit: expectedSecurityDeposit,
      status: 'pending',
      paymentMethod,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await escrowTransaction.save();

    // Mark book as unavailable during transaction
    book.available = false;
    await book.save();

    // TODO: Here you would integrate with actual payment gateway (Stripe, PayPal, etc.)
    // For now, we'll simulate payment processing
    const paymentSuccess = await simulatePaymentProcessing(paymentMethod, expectedTotal);

    if (paymentSuccess.success) {
      // Update transaction with payment ID and status
      escrowTransaction.status = 'paid';
      escrowTransaction.paymentId = paymentSuccess.paymentId;
      await escrowTransaction.save();

      // Create initial message thread
      const initialMessage = new Message({
        sender: auth.id,
        recipient: book.lender._id,
        content: `Hi! I've initiated a rental request for "${book.title}". The payment has been secured in escrow. Please confirm when you're ready to hand over the book.`,
        bookId: bookId,
        transactionId: escrowTransaction._id
      });
      await initialMessage.save();

      return NextResponse.json({
        success: true,
        transactionId: escrowTransaction._id,
        paymentId: paymentSuccess.paymentId,
        status: 'paid',
        message: 'Payment successful! Escrow transaction created.',
        messageThreadId: initialMessage._id
      });
    } else {
      // Payment failed - restore book availability
      book.available = true;
      await book.save();
      
      // Update transaction status
      escrowTransaction.status = 'cancelled';
      escrowTransaction.refundReason = 'Payment processing failed';
      await escrowTransaction.save();

      return NextResponse.json(
        { error: 'Payment processing failed', details: paymentSuccess.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Escrow initiation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simulate payment processing (replace with real payment gateway integration)
async function simulatePaymentProcessing(paymentMethod: string, amount: number) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 95% success rate
  const isSuccessful = Math.random() > 0.05;
  
  if (isSuccessful) {
    return {
      success: true,
      paymentId: `${paymentMethod}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount
    };
  } else {
    return {
      success: false,
      error: 'Payment gateway declined the transaction'
    };
  }
}