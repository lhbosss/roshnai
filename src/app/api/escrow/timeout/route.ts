import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { Message } from '@/models/Message';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Find all expired transactions that haven't been processed
    const now = new Date();
    const expiredTransactions = await EscrowTransaction.find({
      expiresAt: { $lte: now },
      status: { $in: ['pending', 'paid'] }
    }).populate('borrower lender book');

    const results = [];
    
    for (const transaction of expiredTransactions) {
      try {
        // Update transaction status to cancelled
        transaction.status = 'cancelled';
        transaction.refundReason = 'Transaction expired - automatic timeout';
        transaction.refundedAt = now;
        await transaction.save();

        // Send notification messages
        const borrowerMessage = new Message({
          sender: null, // System message
          recipient: transaction.borrower._id,
          subject: 'Transaction Expired',
          content: `Your book rental transaction for "${(transaction.book as any).title}" has expired and been automatically cancelled. Any payment will be refunded within 3-5 business days.`,
          type: 'system',
          metadata: {
            transactionId: transaction._id,
            reason: 'timeout'
          }
        });

        const lenderMessage = new Message({
          sender: null, // System message
          recipient: transaction.lender._id,
          subject: 'Transaction Expired',
          content: `The book rental transaction for "${(transaction.book as any).title}" has expired due to lack of confirmation. The transaction has been automatically cancelled.`,
          type: 'system',
          metadata: {
            transactionId: transaction._id,
            reason: 'timeout'
          }
        });

        await Promise.all([
          borrowerMessage.save(),
          lenderMessage.save()
        ]);

        results.push({
          transactionId: transaction._id,
          status: 'processed',
          action: 'cancelled_expired'
        });

      } catch (error) {
        console.error('Error processing expired transaction:', transaction._id, error);
        results.push({
          transactionId: transaction._id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error in timeout handler:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const now = new Date();
    
    // Get count of expired transactions
    const expiredCount = await EscrowTransaction.countDocuments({
      expiresAt: { $lte: now },
      status: { $in: ['pending', 'paid'] }
    });

    // Get transactions expiring soon (within 1 hour)
    const soonExpiring = await EscrowTransaction.countDocuments({
      expiresAt: { 
        $lte: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        $gt: now 
      },
      status: { $in: ['pending', 'paid'] }
    });

    return NextResponse.json({
      success: true,
      expiredCount,
      soonExpiringCount: soonExpiring,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error checking timeouts:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}