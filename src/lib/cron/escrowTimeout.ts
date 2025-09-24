import { connectDB } from '@/lib/db';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { Message } from '@/models/Message';

export class EscrowTimeoutHandler {
  private static instance: EscrowTimeoutHandler;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly intervalMs = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): EscrowTimeoutHandler {
    if (!EscrowTimeoutHandler.instance) {
      EscrowTimeoutHandler.instance = new EscrowTimeoutHandler();
    }
    return EscrowTimeoutHandler.instance;
  }

  async processExpiredTransactions(): Promise<{
    processed: number;
    errors: number;
    results: Array<{ transactionId: string; status: string; error?: string }>;
  }> {
    try {
      await connectDB();
      
      const now = new Date();
      const expiredTransactions = await EscrowTransaction.find({
        expiresAt: { $lte: now },
        status: { $in: ['pending', 'paid'] }
      }).populate('borrower lender book');

      const results = [];
      let processed = 0;
      let errors = 0;

      for (const transaction of expiredTransactions) {
        try {
          // Update transaction status
          transaction.status = 'cancelled';
          transaction.refundReason = 'Transaction expired - automatic timeout';
          transaction.refundedAt = now;
          await transaction.save();

          // Send notification messages
          const borrowerMessage = new Message({
            sender: null,
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
            sender: null,
            recipient: transaction.lender._id,
            subject: 'Transaction Expired',
            content: `The book rental transaction for "${(transaction.book as any).title}" has expired due to lack of confirmation. The transaction has been automatically cancelled.`,
            type: 'system',
            metadata: {
              transactionId: transaction._id,
              reason: 'timeout'
            }
          });

          await Promise.all([borrowerMessage.save(), lenderMessage.save()]);

          results.push({
            transactionId: String(transaction._id),
            status: 'processed'
          });
          processed++;

        } catch (error) {
          console.error('Error processing expired transaction:', transaction._id, error);
          results.push({
            transactionId: String(transaction._id),
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          errors++;
        }
      }

      if (processed > 0 || errors > 0) {
        console.log(`Processed ${processed} expired transactions, ${errors} errors`);
      }

      return { processed, errors, results };

    } catch (error) {
      console.error('Error in processExpiredTransactions:', error);
      throw error;
    }
  }

  async sendExpirationWarnings(): Promise<{
    sent: number;
    errors: number;
  }> {
    try {
      await connectDB();
      
      const now = new Date();
      const warningTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      // Find transactions expiring within 2 hours that haven't been warned
      const expiringTransactions = await EscrowTransaction.find({
        expiresAt: { $lte: warningTime, $gt: now },
        status: { $in: ['pending', 'paid'] },
        'metadata.warningsSent': { $ne: true }
      }).populate('borrower lender book');

      let sent = 0;
      let errors = 0;

      for (const transaction of expiringTransactions) {
        try {
          const timeUntilExpiry = Math.ceil((transaction.expiresAt.getTime() - now.getTime()) / (60 * 1000)); // minutes

          // Send warning to borrower
          const borrowerWarning = new Message({
            sender: null,
            recipient: transaction.borrower._id,
            subject: 'Transaction Expiring Soon',
            content: `Your book rental transaction for "${(transaction.book as any).title}" will expire in ${timeUntilExpiry} minutes. Please complete the transaction to avoid automatic cancellation.`,
            type: 'system',
            metadata: {
              transactionId: transaction._id,
              reason: 'expiry_warning',
              minutesUntilExpiry: timeUntilExpiry
            }
          });

          // Send warning to lender
          const lenderWarning = new Message({
            sender: null,
            recipient: transaction.lender._id,
            subject: 'Transaction Expiring Soon',
            content: `The book rental transaction for "${(transaction.book as any).title}" will expire in ${timeUntilExpiry} minutes unless confirmed by the borrower.`,
            type: 'system',
            metadata: {
              transactionId: transaction._id,
              reason: 'expiry_warning',
              minutesUntilExpiry: timeUntilExpiry
            }
          });

          await Promise.all([borrowerWarning.save(), lenderWarning.save()]);

          // Mark transaction as warned
          await EscrowTransaction.updateOne(
            { _id: transaction._id },
            { $set: { 'metadata.warningsSent': true } }
          );

          sent++;

        } catch (error) {
          console.error('Error sending warning for transaction:', transaction._id, error);
          errors++;
        }
      }

      if (sent > 0 || errors > 0) {
        console.log(`Sent ${sent} expiration warnings, ${errors} errors`);
      }

      return { sent, errors };

    } catch (error) {
      console.error('Error in sendExpirationWarnings:', error);
      throw error;
    }
  }

  startPeriodicProcessing(): void {
    if (this.intervalId) {
      console.log('Timeout handler already running');
      return;
    }

    console.log('Starting escrow timeout handler');
    
    this.intervalId = setInterval(async () => {
      try {
        // Process expired transactions
        await this.processExpiredTransactions();
        
        // Send expiration warnings
        await this.sendExpirationWarnings();
        
      } catch (error) {
        console.error('Error in periodic timeout processing:', error);
      }
    }, this.intervalMs);
  }

  stopPeriodicProcessing(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped escrow timeout handler');
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Initialize the handler (but don't start it automatically)
export const escrowTimeoutHandler = EscrowTimeoutHandler.getInstance();

// Export convenience functions
export const processExpiredTransactions = () => escrowTimeoutHandler.processExpiredTransactions();
export const sendExpirationWarnings = () => escrowTimeoutHandler.sendExpirationWarnings();
export const startTimeoutHandler = () => escrowTimeoutHandler.startPeriodicProcessing();
export const stopTimeoutHandler = () => escrowTimeoutHandler.stopPeriodicProcessing();