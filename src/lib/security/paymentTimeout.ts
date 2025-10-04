export interface PaymentTimeout {
  transactionId: string;
  paymentIntentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'timeout' | 'retry' | 'failed' | 'cancelled';
  timeoutAt: Date;
  maxRetries: number;
  currentRetry: number;
  lastAttempt?: Date;
  createdAt: Date;
  metadata: {
    paymentMethod: string;
    originalTimeout: number;
    timeoutReason?: string;
    escalationLevel: 'none' | 'automatic' | 'manual' | 'admin';
  };
}

export interface RetryStrategy {
  type: 'immediate' | 'exponential' | 'fixed' | 'custom';
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  maxRetries: number;
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  paymentIntentId: string;
  userId: string;
  amount: number;
  reason: 'timeout' | 'failure' | 'cancellation' | 'dispute' | 'system_error';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  processedAt?: Date;
  refundReference?: string;
  metadata?: Record<string, any>;
}

export interface PaymentRecoveryAction {
  actionId: string;
  transactionId: string;
  type: 'retry_payment' | 'alternative_method' | 'partial_refund' | 'full_refund' | 'manual_review';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  scheduledAt: Date;
  executedAt?: Date;
  result?: {
    success: boolean;
    message: string;
    newPaymentIntentId?: string;
    refundId?: string;
  };
}

export class PaymentTimeoutHandler {
  private readonly DEFAULT_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_AUTO_RETRIES = 3;
  private readonly RETRY_STRATEGIES: Record<string, RetryStrategy> = {
    credit_card: {
      type: 'exponential',
      initialDelay: 30000, // 30 seconds
      maxDelay: 300000, // 5 minutes
      backoffMultiplier: 2,
      jitter: true,
      maxRetries: 3
    },
    bank_transfer: {
      type: 'fixed',
      initialDelay: 300000, // 5 minutes
      maxDelay: 1800000, // 30 minutes
      maxRetries: 2
    },
    digital_wallet: {
      type: 'immediate',
      initialDelay: 10000, // 10 seconds
      maxDelay: 60000, // 1 minute
      maxRetries: 5
    }
  };

  private timeouts: Map<string, PaymentTimeout> = new Map();
  private recoveryActions: Map<string, PaymentRecoveryAction> = new Map();
  private refundRequests: Map<string, RefundRequest> = new Map();

  async handlePaymentTimeout(
    transactionId: string,
    paymentIntentId: string,
    userId: string,
    amount: number,
    paymentMethod: string,
    timeoutReason?: string
  ): Promise<PaymentTimeout> {
    const timeout: PaymentTimeout = {
      transactionId,
      paymentIntentId,
      userId,
      amount,
      currency: 'USD',
      status: 'timeout',
      timeoutAt: new Date(),
      maxRetries: this.getMaxRetries(paymentMethod),
      currentRetry: 0,
      createdAt: new Date(),
      metadata: {
        paymentMethod,
        originalTimeout: this.DEFAULT_TIMEOUT,
        timeoutReason,
        escalationLevel: 'none'
      }
    };

    this.timeouts.set(transactionId, timeout);

    // Determine recovery strategy
    const recoveryStrategy = await this.determineRecoveryStrategy(timeout);
    await this.executeRecoveryStrategy(timeout, recoveryStrategy);

    return timeout;
  }

  async retryPayment(
    transactionId: string,
    options?: {
      useAlternativeMethod?: boolean;
      alternativePaymentMethodId?: string;
      customRetryDelay?: number;
    }
  ): Promise<{ success: boolean; newPaymentIntentId?: string; error?: string }> {
    const timeout = this.timeouts.get(transactionId);
    if (!timeout) {
      return { success: false, error: 'Timeout record not found' };
    }

    if (timeout.currentRetry >= timeout.maxRetries) {
      return { success: false, error: 'Maximum retry attempts exceeded' };
    }

    // Create retry action
    const actionId = this.generateActionId();
    const retryAction: PaymentRecoveryAction = {
      actionId,
      transactionId,
      type: options?.useAlternativeMethod ? 'alternative_method' : 'retry_payment',
      status: 'pending',
      scheduledAt: new Date(Date.now() + this.calculateRetryDelay(timeout))
    };

    this.recoveryActions.set(actionId, retryAction);

    // Execute retry
    const result = await this.executeRetry(timeout, retryAction);
    
    retryAction.executedAt = new Date();
    retryAction.status = result.success ? 'completed' : 'failed';
    retryAction.result = {
      success: result.success,
      message: result.success ? 'Retry completed successfully' : (result.error || 'Retry failed'),
      newPaymentIntentId: result.newPaymentIntentId
    };

    timeout.currentRetry++;
    timeout.lastAttempt = new Date();
    timeout.status = result.success ? 'processing' : 'retry';

    return result;
  }

  async requestRefund(
    transactionId: string,
    reason: RefundRequest['reason'],
    partialAmount?: number
  ): Promise<RefundRequest> {
    const timeout = this.timeouts.get(transactionId);
    if (!timeout) {
      throw new Error('Transaction timeout record not found');
    }

    const refundAmount = partialAmount || timeout.amount;
    if (refundAmount > timeout.amount) {
      throw new Error('Refund amount cannot exceed original payment amount');
    }

    const refundId = this.generateRefundId();
    const refundRequest: RefundRequest = {
      id: refundId,
      transactionId,
      paymentIntentId: timeout.paymentIntentId,
      userId: timeout.userId,
      amount: refundAmount,
      reason,
      status: 'pending',
      requestedAt: new Date()
    };

    this.refundRequests.set(refundId, refundRequest);

    // Process refund
    await this.processRefund(refundRequest);

    return refundRequest;
  }

  async processTimeoutEscalation(transactionId: string): Promise<{
    escalated: boolean;
    escalationLevel: string;
    actions: string[];
  }> {
    const timeout = this.timeouts.get(transactionId);
    if (!timeout) {
      return { escalated: false, escalationLevel: 'none', actions: [] };
    }

    const actions: string[] = [];

    // Automatic escalation based on timeout duration and retry attempts
    const timeoutDuration = Date.now() - timeout.timeoutAt.getTime();
    const hoursSinceTimeout = timeoutDuration / (1000 * 60 * 60);

    if (hoursSinceTimeout > 24 && timeout.metadata.escalationLevel === 'none') {
      timeout.metadata.escalationLevel = 'automatic';
      actions.push('automatic_escalation');
      
      // Attempt automatic resolution
      if (timeout.amount <= 100) {
        // Auto-refund for small amounts
        await this.requestRefund(transactionId, 'timeout');
        actions.push('auto_refund');
      } else {
        // Create manual review for larger amounts
        await this.createManualReview(transactionId);
        actions.push('manual_review');
      }
    }

    if (hoursSinceTimeout > 72 && timeout.metadata.escalationLevel === 'automatic') {
      timeout.metadata.escalationLevel = 'manual';
      actions.push('manual_escalation');
      await this.notifyAdministrators(transactionId);
      actions.push('admin_notification');
    }

    if (hoursSinceTimeout > 168) { // 1 week
      timeout.metadata.escalationLevel = 'admin';
      actions.push('admin_escalation');
      await this.createAdminTicket(transactionId);
      actions.push('admin_ticket');
    }

    return {
      escalated: actions.length > 0,
      escalationLevel: timeout.metadata.escalationLevel,
      actions
    };
  }

  private async determineRecoveryStrategy(timeout: PaymentTimeout): Promise<{
    action: 'retry' | 'alternative' | 'refund' | 'manual';
    reasoning: string;
  }> {
    const { paymentMethod, timeoutReason } = timeout.metadata;

    // Check if payment method supports retries
    if (timeoutReason === 'insufficient_funds') {
      return {
        action: 'manual',
        reasoning: 'Insufficient funds require user intervention'
      };
    }

    if (timeoutReason === 'card_declined' && timeout.currentRetry >= 2) {
      return {
        action: 'alternative',
        reasoning: 'Card repeatedly declined, suggest alternative payment method'
      };
    }

    if (paymentMethod === 'bank_transfer' && timeout.currentRetry === 0) {
      return {
        action: 'retry',
        reasoning: 'Bank transfers often succeed on retry due to processing delays'
      };
    }

    if (timeout.amount <= 10) {
      return {
        action: 'refund',
        reasoning: 'Small amount, automatic refund to improve user experience'
      };
    }

    return {
      action: 'retry',
      reasoning: 'Standard retry for payment timeout'
    };
  }

  private async executeRecoveryStrategy(
    timeout: PaymentTimeout,
    strategy: { action: string; reasoning: string }
  ): Promise<void> {
    switch (strategy.action) {
      case 'retry':
        await this.scheduleAutomaticRetry(timeout);
        break;
      case 'alternative':
        await this.suggestAlternativePaymentMethod(timeout);
        break;
      case 'refund':
        await this.requestRefund(timeout.transactionId, 'timeout');
        break;
      case 'manual':
        await this.createManualReview(timeout.transactionId);
        break;
    }
  }

  private async scheduleAutomaticRetry(timeout: PaymentTimeout): Promise<void> {
    const delay = this.calculateRetryDelay(timeout);
    
    setTimeout(async () => {
      try {
        await this.retryPayment(timeout.transactionId);
      } catch (error) {
        console.error(`Automatic retry failed for ${timeout.transactionId}:`, error);
        await this.handleRetryFailure(timeout);
      }
    }, delay);
  }

  private calculateRetryDelay(timeout: PaymentTimeout): number {
    const strategy = this.RETRY_STRATEGIES[timeout.metadata.paymentMethod] || 
                     this.RETRY_STRATEGIES.credit_card;

    switch (strategy.type) {
      case 'immediate':
        return strategy.initialDelay;
      
      case 'fixed':
        return strategy.initialDelay;
      
      case 'exponential':
        let delay = strategy.initialDelay * Math.pow(strategy.backoffMultiplier || 2, timeout.currentRetry);
        delay = Math.min(delay, strategy.maxDelay);
        
        if (strategy.jitter) {
          delay += Math.random() * 0.1 * delay; // Add 10% jitter
        }
        
        return delay;
      
      default:
        return strategy.initialDelay;
    }
  }

  private async executeRetry(
    timeout: PaymentTimeout,
    action: PaymentRecoveryAction
  ): Promise<{ success: boolean; newPaymentIntentId?: string; error?: string }> {
    try {
      action.status = 'in_progress';

      // In production, integrate with payment processor
      // Simulate retry logic
      const isSuccessful = Math.random() > 0.3; // 70% success rate for simulation

      if (isSuccessful) {
        const newPaymentIntentId = `pi_retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          success: true,
          newPaymentIntentId
        };
      } else {
        return {
          success: false,
          error: 'Payment processor unavailable'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processRefund(refund: RefundRequest): Promise<void> {
    try {
      refund.status = 'processing';

      // In production, integrate with payment processor for actual refunds
      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      refund.status = 'completed';
      refund.processedAt = new Date();
      refund.refundReference = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`Refund processed: ${refund.id} for amount $${refund.amount}`);
    } catch (error) {
      refund.status = 'failed';
      console.error(`Refund failed for ${refund.id}:`, error);
    }
  }

  private async suggestAlternativePaymentMethod(timeout: PaymentTimeout): Promise<void> {
    // In production, notify user about alternative payment options
    console.log(`Suggesting alternative payment method for transaction ${timeout.transactionId}`);
  }

  private async createManualReview(transactionId: string): Promise<void> {
    // In production, create manual review ticket
    console.log(`Creating manual review for transaction ${transactionId}`);
  }

  private async notifyAdministrators(transactionId: string): Promise<void> {
    // In production, send notifications to administrators
    console.log(`Notifying administrators about escalated transaction ${transactionId}`);
  }

  private async createAdminTicket(transactionId: string): Promise<void> {
    // In production, create admin support ticket
    console.log(`Creating admin ticket for transaction ${transactionId}`);
  }

  private async handleRetryFailure(timeout: PaymentTimeout): Promise<void> {
    if (timeout.currentRetry >= timeout.maxRetries) {
      // All retries exhausted, escalate
      await this.processTimeoutEscalation(timeout.transactionId);
    } else {
      // Schedule next retry
      await this.scheduleAutomaticRetry(timeout);
    }
  }

  private getMaxRetries(paymentMethod: string): number {
    return this.RETRY_STRATEGIES[paymentMethod]?.maxRetries || this.MAX_AUTO_RETRIES;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRefundId(): string {
    return `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public query methods
  getTimeoutStatus(transactionId: string): PaymentTimeout | null {
    return this.timeouts.get(transactionId) || null;
  }

  getRefundStatus(refundId: string): RefundRequest | null {
    return this.refundRequests.get(refundId) || null;
  }

  getRecoveryActions(transactionId: string): PaymentRecoveryAction[] {
    return Array.from(this.recoveryActions.values())
      .filter(action => action.transactionId === transactionId);
  }

  // Cleanup expired timeouts
  cleanupExpiredTimeouts(): number {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    let cleanedCount = 0;

    for (const [transactionId, timeout] of this.timeouts.entries()) {
      if ((now - timeout.createdAt.getTime()) > maxAge) {
        this.timeouts.delete(transactionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

export default PaymentTimeoutHandler;