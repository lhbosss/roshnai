import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { Message } from '@/models/Message';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get user from auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { transactionId, reason, refundType } = await request.json();

    if (!transactionId || !reason) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID and reason are required'
      }, { status: 400 });
    }

    // Find the transaction
    const transaction = await EscrowTransaction.findById(transactionId)
      .populate('borrower lender book');

    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    // Check if user is authorized (borrower, lender, or admin)
    const isAuthorized = 
      String(transaction.borrower._id) === userId ||
      String(transaction.lender._id) === userId;
    
    if (!isAuthorized) {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to refund this transaction'
      }, { status: 403 });
    }

    // Check if transaction can be refunded
    if (!['paid', 'confirmed', 'cancelled'].includes(transaction.status)) {
      return NextResponse.json({
        success: false,
        error: `Cannot refund transaction with status: ${transaction.status}`
      }, { status: 400 });
    }

    // Calculate refund amounts
    const refundResult = calculateRefundAmounts(transaction, refundType, reason);

    // Process the refund
    const refundSuccess = await processRefund(transaction, refundResult);

    if (!refundSuccess.success) {
      return NextResponse.json({
        success: false,
        error: refundSuccess.error
      }, { status: 500 });
    }

    // Update transaction
    transaction.status = 'refunded';
    transaction.refundReason = reason;
    transaction.refundedAt = new Date();
    transaction.notes = `${transaction.notes || ''}\nRefund processed: ${refundResult.description}`;
    await transaction.save();

    // Send notifications
    await sendRefundNotifications(transaction, refundResult, userId);

    return NextResponse.json({
      success: true,
      refund: refundResult,
      transaction: {
        id: transaction._id,
        status: transaction.status,
        refundedAt: transaction.refundedAt
      }
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateRefundAmounts(transaction: any, refundType: string, reason: string) {
  const { totalAmount, rentalFee, securityDeposit } = transaction;
  const platformFee = totalAmount - rentalFee - securityDeposit;

  let refundAmounts = {
    rentalFee: 0,
    securityDeposit: 0,
    platformFee: 0,
    total: 0,
    description: ''
  };

  switch (refundType) {
    case 'full':
      // Full refund - all money back
      refundAmounts = {
        rentalFee: rentalFee,
        securityDeposit: securityDeposit,
        platformFee: platformFee * 0.5, // 50% platform fee refunded
        total: rentalFee + securityDeposit + (platformFee * 0.5),
        description: 'Full refund due to cancellation or failure'
      };
      break;

    case 'partial':
      // Partial refund - keep some fees
      refundAmounts = {
        rentalFee: rentalFee * 0.5, // 50% rental fee refunded
        securityDeposit: securityDeposit,
        platformFee: 0, // No platform fee refund
        total: (rentalFee * 0.5) + securityDeposit,
        description: 'Partial refund - 50% rental fee retained'
      };
      break;

    case 'security_only':
      // Only security deposit refunded
      refundAmounts = {
        rentalFee: 0,
        securityDeposit: securityDeposit,
        platformFee: 0,
        total: securityDeposit,
        description: 'Security deposit refund only'
      };
      break;

    case 'damage_deduction':
      // Deduct damage from security deposit
      const damageAmount = Math.min(securityDeposit * 0.5, 50); // Max $50 or 50% of deposit
      refundAmounts = {
        rentalFee: 0,
        securityDeposit: securityDeposit - damageAmount,
        platformFee: 0,
        total: securityDeposit - damageAmount,
        description: `Security deposit refund minus $${damageAmount.toFixed(2)} damage fee`
      };
      break;

    default:
      // Default to security deposit only
      refundAmounts = {
        rentalFee: 0,
        securityDeposit: securityDeposit,
        platformFee: 0,
        total: securityDeposit,
        description: 'Standard security deposit refund'
      };
  }

  return refundAmounts;
}

async function processRefund(transaction: any, refundResult: any) {
  try {
    // Simulate payment processing
    // In a real application, you would integrate with payment processors like:
    // - Stripe: stripe.refunds.create()
    // - PayPal: paypal.payment.refund()
    // - Bank transfer APIs
    
    console.log(`Processing refund of $${refundResult.total} for transaction ${transaction._id}`);
    console.log(`Payment method: ${transaction.paymentMethod}`);
    console.log(`Refund breakdown:`, refundResult);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, always return success
    // In production, handle actual payment gateway responses
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      return {
        success: false,
        error: 'Payment processor declined refund'
      };
    }

    return {
      success: true,
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      processorResponse: {
        status: 'completed',
        amount: refundResult.total,
        currency: 'USD',
        estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      }
    };

  } catch (error) {
    console.error('Error in payment processor:', error);
    return {
      success: false,
      error: 'Payment processor error'
    };
  }
}

async function sendRefundNotifications(transaction: any, refundResult: any, initiatedBy: string) {
  try {
    const isInitiatedByBorrower = String(transaction.borrower._id) === initiatedBy;
    const bookTitle = (transaction.book as any).title;

    // Notify borrower
    const borrowerMessage = new Message({
      sender: null,
      recipient: transaction.borrower._id,
      subject: 'Refund Processed',
      content: `A refund of $${refundResult.total.toFixed(2)} has been processed for your book rental transaction "${bookTitle}". ${refundResult.description}. The refund should appear in your account within 3-5 business days.`,
      type: 'system',
      metadata: {
        transactionId: transaction._id,
        refundAmount: refundResult.total,
        refundType: 'processed'
      }
    });

    // Notify lender
    const lenderMessage = new Message({
      sender: null,
      recipient: transaction.lender._id,
      subject: 'Transaction Refunded',
      content: `A refund has been processed for the book rental transaction "${bookTitle}". ${refundResult.description}. ${isInitiatedByBorrower ? 'The refund was initiated by the borrower.' : 'The refund was processed automatically.'}`,
      type: 'system',
      metadata: {
        transactionId: transaction._id,
        refundAmount: refundResult.total,
        refundType: 'notification'
      }
    });

    await Promise.all([borrowerMessage.save(), lenderMessage.save()]);

  } catch (error) {
    console.error('Error sending refund notifications:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get refund statistics and pending refunds
    await connectDB();
    
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [totalRefunds, recentRefunds, pendingRefunds] = await Promise.all([
      EscrowTransaction.countDocuments({ status: 'refunded' }),
      EscrowTransaction.countDocuments({ 
        status: 'refunded', 
        refundedAt: { $gte: last30Days } 
      }),
      EscrowTransaction.countDocuments({ 
        status: { $in: ['cancelled'] }
      })
    ]);

    const refundAmount = await EscrowTransaction.aggregate([
      { $match: { status: 'refunded', refundedAt: { $gte: last30Days } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalRefunds,
        recentRefunds,
        pendingRefunds,
        recentRefundAmount: refundAmount[0]?.total || 0,
        period: '30 days'
      }
    });

  } catch (error) {
    console.error('Error getting refund stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}