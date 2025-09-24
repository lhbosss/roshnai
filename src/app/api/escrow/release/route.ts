import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { Book } from '@/models/Book';

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
    const { transactionId, releaseType = 'complete' } = body;

    // Validate required fields
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing transaction ID' },
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

    // Verify user has admin access or is system automated process
    // In a production system, this would be called by automated processes
    // or admin functions, not directly by users
    const isSystemCall = request.headers.get('x-system-key') === process.env.SYSTEM_API_KEY;
    const isAdmin = auth.role === 'admin'; // Assuming you have admin roles
    
    if (!isSystemCall && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied - insufficient privileges' },
        { status: 403 }
      );
    }

    // Check transaction state
    if (transaction.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Transaction must be confirmed before payment release' },
        { status: 400 }
      );
    }

    if (transaction.completedAt) {
      return NextResponse.json(
        { error: 'Payment has already been released' },
        { status: 400 }
      );
    }

    let releaseResult;
    
    switch (releaseType) {
      case 'complete':
        // Release rental fee to lender, security deposit back to borrower
        releaseResult = await processCompleteRelease(transaction);
        break;
      case 'refund':
        // Refund everything back to borrower
        releaseResult = await processFullRefund(transaction);
        break;
      case 'partial':
        // Handle dispute resolution with partial amounts
        releaseResult = await processPartialRelease(transaction, body.amounts);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid release type' },
          { status: 400 }
        );
    }

    if (releaseResult.success) {
      // Update transaction status
      transaction.status = releaseType === 'refund' ? 'refunded' : 'completed';
      transaction.completedAt = new Date();
      if (releaseType === 'refund') {
        transaction.refundedAt = new Date();
        transaction.refundReason = body.reason || 'Manual refund processed';
      }
      await transaction.save();

      // Restore book availability if transaction is completed or refunded
      const book = await Book.findById(transaction.book._id);
      if (book) {
        book.available = true;
        await book.save();
      }

      return NextResponse.json({
        success: true,
        transactionId: (transaction as any)._id.toString(),
        releaseType,
        releaseDetails: releaseResult,
        status: transaction.status,
        completedAt: transaction.completedAt.toISOString(),
        message: `Payment ${releaseType} processed successfully`
      });

    } else {
      return NextResponse.json(
        { error: 'Payment release failed', details: releaseResult.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment release error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Process complete release: rental fee to lender, security deposit back to borrower
async function processCompleteRelease(transaction: any) {
  try {
    const results = [];

    // Release rental fee to lender
    if (transaction.rentalFee > 0) {
      const lenderRelease = await simulatePaymentRelease(
        transaction.lender._id,
        transaction.rentalFee,
        'rental_fee',
        transaction.paymentId
      );
      results.push({
        recipient: 'lender',
        amount: transaction.rentalFee,
        type: 'rental_fee',
        ...lenderRelease
      });
    }

    // Refund security deposit to borrower
    if (transaction.securityDeposit > 0) {
      const borrowerRefund = await simulatePaymentRelease(
        transaction.borrower._id,
        transaction.securityDeposit,
        'security_deposit_refund',
        transaction.paymentId
      );
      results.push({
        recipient: 'borrower',
        amount: transaction.securityDeposit,
        type: 'security_deposit_refund',
        ...borrowerRefund
      });
    }

    const allSuccessful = results.every(r => r.success);
    
    return {
      success: allSuccessful,
      releases: results,
      totalReleased: transaction.rentalFee,
      totalRefunded: transaction.securityDeposit
    };

  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
}

// Process full refund: everything back to borrower
async function processFullRefund(transaction: any) {
  try {
    const totalRefund = transaction.totalAmount;
    
    const refundResult = await simulatePaymentRelease(
      transaction.borrower._id,
      totalRefund,
      'full_refund',
      transaction.paymentId
    );

    return {
      success: refundResult.success,
      releases: [{
        recipient: 'borrower',
        amount: totalRefund,
        type: 'full_refund',
        ...refundResult
      }],
      totalRefunded: totalRefund
    };

  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
}

// Process partial release for dispute resolution
async function processPartialRelease(transaction: any, amounts: any) {
  try {
    const results = [];
    
    if (amounts.toLender > 0) {
      const lenderRelease = await simulatePaymentRelease(
        transaction.lender._id,
        amounts.toLender,
        'dispute_settlement',
        transaction.paymentId
      );
      results.push({
        recipient: 'lender',
        amount: amounts.toLender,
        type: 'dispute_settlement',
        ...lenderRelease
      });
    }

    if (amounts.toBorrower > 0) {
      const borrowerRefund = await simulatePaymentRelease(
        transaction.borrower._id,
        amounts.toBorrower,
        'dispute_refund',
        transaction.paymentId
      );
      results.push({
        recipient: 'borrower',
        amount: amounts.toBorrower,
        type: 'dispute_refund',
        ...borrowerRefund
      });
    }

    const allSuccessful = results.every(r => r.success);
    
    return {
      success: allSuccessful,
      releases: results,
      totalReleased: amounts.toLender || 0,
      totalRefunded: amounts.toBorrower || 0
    };

  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
}

// Simulate payment release/refund (replace with real payment gateway integration)
async function simulatePaymentRelease(recipientId: string, amount: number, type: string, originalPaymentId: string) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate 98% success rate for releases
  const isSuccessful = Math.random() > 0.02;
  
  if (isSuccessful) {
    return {
      success: true,
      releaseId: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      recipientId,
      originalPaymentId,
      processedAt: new Date().toISOString()
    };
  } else {
    return {
      success: false,
      error: 'Payment gateway release failed'
    };
  }
}