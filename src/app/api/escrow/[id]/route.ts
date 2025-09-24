import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { TransactionConfirmation } from '@/models/TransactionConfirmation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const transactionId = params.id;

    // Validate ObjectId format
    if (!transactionId || !transactionId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

    // Find transaction and populate related data
    const transaction = await EscrowTransaction.findById(transactionId)
      .populate('book', 'title author coverUrl')
      .populate('borrower', 'name email')
      .populate('lender', 'name email')
      .lean();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this transaction
    const isParticipant = transaction.borrower._id.toString() === auth.id || 
                         transaction.lender._id.toString() === auth.id;
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get confirmation details
    const confirmations = await TransactionConfirmation.find({
      escrowTransaction: transactionId
    }).lean();

    // Determine user's role in the transaction
    const userRole = transaction.borrower._id.toString() === auth.id ? 'borrower' : 'lender';

    // Check if transaction has expired
    const isExpired = new Date() > new Date(transaction.expiresAt);

    // Calculate transaction progress
    const progress = calculateTransactionProgress(transaction, confirmations);

    // Prepare response data
    const transactionData = {
      ...transaction,
      _id: transaction._id.toString(),
      book: {
        ...transaction.book,
        _id: transaction.book._id.toString()
      },
      borrower: {
        ...transaction.borrower,
        _id: transaction.borrower._id.toString()
      },
      lender: {
        ...transaction.lender,
        _id: transaction.lender._id.toString()
      },
      confirmations: confirmations.map(conf => ({
        ...conf,
        _id: conf._id.toString(),
        escrowTransaction: conf.escrowTransaction.toString(),
        user: conf.user.toString()
      })),
      userRole,
      isExpired,
      progress,
      createdAt: transaction.createdAt?.toISOString(),
      updatedAt: transaction.updatedAt?.toISOString(),
      expiresAt: transaction.expiresAt?.toISOString(),
      confirmedAt: transaction.confirmedAt?.toISOString(),
      completedAt: transaction.completedAt?.toISOString(),
      refundedAt: transaction.refundedAt?.toISOString()
    };

    return NextResponse.json(transactionData);

  } catch (error) {
    console.error('Error fetching escrow transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateTransactionProgress(transaction: any, confirmations: any[]) {
  const steps = [
    { key: 'payment', label: 'Payment Secured', completed: transaction.status !== 'pending' },
    { key: 'lender_confirm', label: 'Lender Confirms Handover', completed: transaction.lenderConfirmed },
    { key: 'borrower_confirm', label: 'Borrower Confirms Receipt', completed: transaction.borrowerConfirmed },
    { key: 'completed', label: 'Transaction Completed', completed: transaction.status === 'completed' }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  return {
    steps,
    completedSteps,
    totalSteps,
    percentage,
    currentStep: steps.find(step => !step.completed)?.key || 'completed'
  };
}