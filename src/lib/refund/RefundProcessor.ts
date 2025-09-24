import { connectDB } from '@/lib/db';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { Message } from '@/models/Message';

export interface RefundOptions {
  transactionId: string;
  refundType: 'full' | 'partial' | 'security_only' | 'damage_deduction';
  reason: string;
  damageAmount?: number; // For damage_deduction type
  initiatedBy: string; // User ID who initiated the refund
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amounts: {
    rentalFee: number;
    securityDeposit: number;
    platformFee: number;
    total: number;
  };
  description: string;
  estimatedArrival?: Date;
  error?: string;
}

export class RefundProcessor {
  static async processRefund(options: RefundOptions): Promise<RefundResult> {
    try {
      await connectDB();

      // Get transaction
      const transaction = await EscrowTransaction.findById(options.transactionId)
        .populate('borrower lender book');

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          amounts: { rentalFee: 0, securityDeposit: 0, platformFee: 0, total: 0 },
          description: ''
        };
      }

      // Calculate refund amounts
      const amounts = this.calculateRefundAmounts(transaction, options);

      // Process with payment gateway (simulated)
      const paymentResult = await this.processPaymentRefund(transaction, amounts.total);

      if (!paymentResult.success) {
        return {
          success: false,
          error: paymentResult.error,
          amounts,
          description: amounts.description
        };
      }

      // Update transaction
      transaction.status = 'refunded';
      transaction.refundReason = options.reason;
      transaction.refundedAt = new Date();
      transaction.notes = `${transaction.notes || ''}\nRefund: $${amounts.total} - ${options.reason}`;
      await transaction.save();

      // Send notifications
      await this.sendRefundNotifications(transaction, amounts, options);

      return {
        success: true,
        refundId: paymentResult.refundId,
        amounts,
        description: amounts.description,
        estimatedArrival: paymentResult.estimatedArrival
      };

    } catch (error) {
      console.error('Error in processRefund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing error',
        amounts: { rentalFee: 0, securityDeposit: 0, platformFee: 0, total: 0 },
        description: ''
      };
    }
  }

  private static calculateRefundAmounts(transaction: any, options: RefundOptions) {
    const { totalAmount, rentalFee, securityDeposit } = transaction;
    const platformFee = totalAmount - rentalFee - securityDeposit;

    let amounts = {
      rentalFee: 0,
      securityDeposit: 0,
      platformFee: 0,
      total: 0,
      description: ''
    };

    switch (options.refundType) {
      case 'full':
        amounts = {
          rentalFee: rentalFee,
          securityDeposit: securityDeposit,
          platformFee: Math.floor(platformFee * 0.5), // 50% platform fee back
          total: rentalFee + securityDeposit + Math.floor(platformFee * 0.5),
          description: 'Full refund - transaction cancelled before completion'
        };
        break;

      case 'partial':
        const partialRental = Math.floor(rentalFee * 0.3); // 30% rental fee back
        amounts = {
          rentalFee: partialRental,
          securityDeposit: securityDeposit,
          platformFee: 0,
          total: partialRental + securityDeposit,
          description: 'Partial refund - book was delivered but returned early'
        };
        break;

      case 'security_only':
        amounts = {
          rentalFee: 0,
          securityDeposit: securityDeposit,
          platformFee: 0,
          total: securityDeposit,
          description: 'Security deposit refund - book returned in good condition'
        };
        break;

      case 'damage_deduction':
        const damageAmount = Math.min(
          options.damageAmount || securityDeposit * 0.2, 
          securityDeposit
        );
        const refundedDeposit = securityDeposit - damageAmount;
        amounts = {
          rentalFee: 0,
          securityDeposit: refundedDeposit,
          platformFee: 0,
          total: refundedDeposit,
          description: `Security deposit refund minus $${damageAmount.toFixed(2)} damage fee`
        };
        break;
    }

    return amounts;
  }

  private static async processPaymentRefund(
    transaction: any, 
    amount: number
  ): Promise<{
    success: boolean;
    refundId?: string;
    estimatedArrival?: Date;
    error?: string;
  }> {
    try {
      // Simulate payment gateway integration
      console.log(`Processing refund: $${amount} via ${transaction.paymentMethod}`);
      
      // Add realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure (95% success rate)
      if (Math.random() < 0.05) {
        return {
          success: false,
          error: 'Payment gateway declined the refund'
        };
      }

      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const estimatedArrival = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

      // Log successful refund
      console.log(`Refund processed successfully: ${refundId}`);

      return {
        success: true,
        refundId,
        estimatedArrival
      };

    } catch (error) {
      console.error('Payment gateway error:', error);
      return {
        success: false,
        error: 'Payment gateway communication error'
      };
    }
  }

  private static async sendRefundNotifications(
    transaction: any, 
    amounts: any, 
    options: RefundOptions
  ) {
    try {
      const bookTitle = (transaction.book as any).title;
      const isInitiatedByBorrower = String(transaction.borrower._id) === options.initiatedBy;

      // Borrower notification
      const borrowerMessage = new Message({
        sender: null,
        recipient: transaction.borrower._id,
        subject: 'Refund Processed',
        content: `Your refund of $${amounts.total.toFixed(2)} for "${bookTitle}" has been processed. ${amounts.description}. Funds should appear in your account within 3-5 business days. Reason: ${options.reason}`,
        type: 'system',
        metadata: {
          transactionId: transaction._id,
          refundAmount: amounts.total,
          refundType: options.refundType
        }
      });

      // Lender notification
      const lenderMessage = new Message({
        sender: null,
        recipient: transaction.lender._id,
        subject: 'Transaction Refund Processed',
        content: `A refund has been processed for "${bookTitle}". Amount: $${amounts.total.toFixed(2)}. ${amounts.description}. ${isInitiatedByBorrower ? 'Refund was requested by the borrower.' : 'Refund was processed automatically by the system.'}`,
        type: 'system',
        metadata: {
          transactionId: transaction._id,
          refundAmount: amounts.total,
          refundType: options.refundType
        }
      });

      await Promise.all([borrowerMessage.save(), lenderMessage.save()]);

    } catch (error) {
      console.error('Error sending refund notifications:', error);
    }
  }

  // Helper method to check if a transaction is refundable
  static isRefundable(transaction: any): { canRefund: boolean; reason?: string } {
    if (!transaction) {
      return { canRefund: false, reason: 'Transaction not found' };
    }

    switch (transaction.status) {
      case 'pending':
        return { canRefund: true };
      case 'paid':
        return { canRefund: true };
      case 'confirmed':
        return { canRefund: true };
      case 'cancelled':
        return { canRefund: true };
      case 'completed':
        // Can only refund security deposit after completion
        return { canRefund: true };
      case 'refunded':
        return { canRefund: false, reason: 'Already refunded' };
      default:
        return { canRefund: false, reason: `Cannot refund transaction with status: ${transaction.status}` };
    }
  }

  // Get refund history for a user
  static async getRefundHistory(userId: string, limit: number = 10) {
    try {
      await connectDB();

      const refunds = await EscrowTransaction.find({
        $or: [
          { borrower: userId },
          { lender: userId }
        ],
        status: 'refunded'
      })
      .populate('book', 'title author')
      .populate('borrower', 'name email')
      .populate('lender', 'name email')
      .sort({ refundedAt: -1 })
      .limit(limit);

      return {
        success: true,
        refunds: refunds.map(refund => ({
          id: refund._id,
          bookTitle: (refund.book as any).title,
          amount: refund.totalAmount,
          refundedAt: refund.refundedAt,
          reason: refund.refundReason,
          role: String(refund.borrower._id) === userId ? 'borrower' : 'lender'
        }))
      };

    } catch (error) {
      console.error('Error getting refund history:', error);
      return {
        success: false,
        error: 'Failed to get refund history'
      };
    }
  }
}

export default RefundProcessor;