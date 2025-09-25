import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { TransactionConfirmation } from '@/models/TransactionConfirmation';
import { Book } from '@/models/Book';
import { Message } from '@/models/Message';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { transactionId, confirmationType, role, action, photo, notes } = body;

    // Support both old format (action) and new format (confirmationType)
    const actionToProcess = action || confirmationType;

    // Validate required fields
    if (!transactionId || !actionToProcess) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate action/confirmationType
    const validActions = ['lent', 'borrowed', 'returned', 'received'];
    if (!validActions.includes(actionToProcess)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Find transaction
    const transaction = await EscrowTransaction.findById(transactionId)
      .populate('book', 'title author')
      .populate('borrower', 'name email')
      .populate('lender', 'name email');

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if user is participant
    const isLender = transaction.lender._id.toString() === auth.id;
    const isBorrower = transaction.borrower._id.toString() === auth.id;
    
    if (!isLender && !isBorrower) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate action based on user role
    const userRole = isLender ? 'lender' : 'borrower';
    if ((actionToProcess === 'lent' || actionToProcess === 'received') && !isLender) {
      return NextResponse.json(
        { error: 'Only lender can perform this action' },
        { status: 403 }
      );
    }
    if ((actionToProcess === 'borrowed' || actionToProcess === 'returned') && !isBorrower) {
      return NextResponse.json(
        { error: 'Only borrower can perform this action' },
        { status: 403 }
      );
    }

    // Check if transaction is in valid state
    if (!['paid', 'confirmed'].includes(transaction.status)) {
      return NextResponse.json(
        { error: 'Transaction is not in a valid state for confirmation' },
        { status: 400 }
      );
    }

    // Check if confirmation already exists
    const existingConfirmation = await TransactionConfirmation.findOne({
      escrowTransaction: transactionId,
      userRole,
      action: actionToProcess
    });

    if (existingConfirmation) {
      return NextResponse.json(
        { error: 'You have already confirmed this action' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for audit trail
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create confirmation record
    const confirmation = new TransactionConfirmation({
      escrowTransaction: transactionId,
      user: auth.id,
      userRole,
      action: actionToProcess,
      photo,
      notes,
      ipAddress: clientIP,
      deviceInfo: userAgent
    });

    await confirmation.save();

    // Update transaction based on action
    let shouldCheckForCompletion = false;
    let messageContent = '';

    switch (actionToProcess) {
      case 'lent':
        transaction.lenderConfirmed = true;
        messageContent = `${(transaction.lender as any).name} confirmed that the book "${(transaction.book as any).title}" has been handed over.`;
        shouldCheckForCompletion = true;
        break;
      case 'borrowed':
        transaction.borrowerConfirmed = true;
        messageContent = `${(transaction.borrower as any).name} confirmed receiving the book "${(transaction.book as any).title}".`;
        shouldCheckForCompletion = true;
        break;
      case 'returned':
        // Reset confirmations for return process
        transaction.borrowerConfirmed = false;
        transaction.lenderConfirmed = false;
        messageContent = `${(transaction.borrower as any).name} confirmed returning the book "${(transaction.book as any).title}".`;
        break;
      case 'received':
        // Book has been returned successfully
        messageContent = `${(transaction.lender as any).name} confirmed receiving the returned book "${(transaction.book as any).title}".`;
        shouldCheckForCompletion = true;
        break;
    }

    // Check if both parties have confirmed (for initial lending)
    if (shouldCheckForCompletion && 
        transaction.borrowerConfirmed && 
        transaction.lenderConfirmed && 
        !transaction.confirmedAt) {
      
      transaction.status = 'confirmed';
      transaction.confirmedAt = new Date();

      // Trigger payment release (this would normally call payment gateway)
      await releasePaymentToLender(transaction);
    }

    await transaction.save();

    // Send notification message to the other party
    const recipientId = isLender ? transaction.borrower._id : transaction.lender._id;
    const notificationMessage = new Message({
      transaction: transactionId,
      book: transaction.book._id,
      sender: auth.id,
      receiver: recipientId,
      content: messageContent + (notes ? `\n\nNote: ${notes}` : ''),
      type: 'system',
      priority: 'high',
      relatedTo: {
        type: 'confirmation',
        id: (confirmation as any)._id.toString()
      }
    });
    await notificationMessage.save();

    return NextResponse.json({
      success: true,
      confirmation: {
        _id: (confirmation as any)._id.toString(),
        action: actionToProcess,
        confirmedAt: confirmation.confirmedAt,
        notes
      },
      transaction: {
        _id: (transaction as any)._id.toString(),
        status: transaction.status,
        lenderConfirmed: transaction.lenderConfirmed,
        borrowerConfirmed: transaction.borrowerConfirmed,
        confirmedAt: transaction.confirmedAt?.toISOString(),
        completedAt: transaction.completedAt?.toISOString(),
        totalAmount: transaction.totalAmount,
        rentalFee: transaction.rentalFee,
        securityDeposit: transaction.securityDeposit,
        createdAt: transaction.createdAt?.toISOString(),
        updatedAt: transaction.updatedAt?.toISOString(),
        expiresAt: transaction.expiresAt?.toISOString()
      },
      message: 'Confirmation recorded successfully'
    });

  } catch (error) {
    console.error('Escrow confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simulate payment release to lender (replace with real payment gateway integration)
async function releasePaymentToLender(transaction: any) {
  try {
    // TODO: Integrate with payment gateway to release funds
    // For now, simulate the release
    console.log(`Releasing $${transaction.rentalFee} to lender ${transaction.lender._id}`);
    
    // In a real implementation, you would:
    // 1. Call payment gateway API to release funds
    // 2. Update transaction with release confirmation
    // 3. Send confirmation emails
    
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    
    return { success: true, releaseId: `release_${Date.now()}` };
  } catch (error: any) {
    console.error('Payment release error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}