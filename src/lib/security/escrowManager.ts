import crypto, { randomBytes, createCipher, createDecipher, createHmac } from 'crypto';

export interface EscrowAccount {
  id: string;
  transactionId: string;
  borrowerId: string;
  lenderId: string;
  status: 'created' | 'funded' | 'held' | 'released' | 'refunded' | 'disputed' | 'frozen';
  totalAmount: number;
  rentalFee: number;
  securityDeposit: number;
  platformFee: number;
  currency: string;
  createdAt: Date;
  fundedAt?: Date;
  releaseScheduledAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  encryptedPaymentInfo: string;
  auditTrail: EscrowAuditEntry[];
  releaseConditions: ReleaseCondition[];
  freezeReason?: string;
}

export interface EscrowAuditEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'funded' | 'held' | 'released' | 'refunded' | 'disputed' | 'frozen' | 'unfrozen';
  performedBy: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  signature: string;
}

export interface ReleaseCondition {
  type: 'time_based' | 'manual_approval' | 'dispute_resolved' | 'book_returned';
  status: 'pending' | 'met' | 'failed';
  value?: any;
  metAt?: Date;
  description: string;
}

export interface FundAllocation {
  lenderAmount: number;
  platformAmount: number;
  refundAmount?: number;
  penaltyAmount?: number;
}

export class SecureEscrowManager {
  private readonly ENCRYPTION_KEY: string;
  private readonly HMAC_KEY: string;
  
  constructor(encryptionKey?: string, hmacKey?: string) {
    this.ENCRYPTION_KEY = encryptionKey || process.env.ESCROW_ENCRYPTION_KEY || this.generateKey();
    this.HMAC_KEY = hmacKey || process.env.ESCROW_HMAC_KEY || this.generateKey();
  }

  async createEscrowAccount(
    transactionId: string,
    borrowerId: string,
    lenderId: string,
    amounts: {
      rentalFee: number;
      securityDeposit: number;
      platformFee: number;
    },
    paymentInfo: any,
    releaseConditions: Omit<ReleaseCondition, 'status' | 'metAt'>[]
  ): Promise<EscrowAccount> {
    const escrowId = this.generateEscrowId();
    const encryptedPaymentInfo = this.encryptPaymentInfo(paymentInfo);
    
    const account: EscrowAccount = {
      id: escrowId,
      transactionId,
      borrowerId,
      lenderId,
      status: 'created',
      totalAmount: amounts.rentalFee + amounts.securityDeposit + amounts.platformFee,
      rentalFee: amounts.rentalFee,
      securityDeposit: amounts.securityDeposit,
      platformFee: amounts.platformFee,
      currency: 'USD',
      createdAt: new Date(),
      encryptedPaymentInfo,
      auditTrail: [],
      releaseConditions: releaseConditions.map(condition => ({
        ...condition,
        status: 'pending' as const
      }))
    };

    // Add creation audit entry
    await this.addAuditEntry(account, 'created', 'system', {
      totalAmount: account.totalAmount,
      releaseConditions: releaseConditions.length
    });

    return account;
  }

  async fundEscrowAccount(
    account: EscrowAccount,
    paymentReference: string,
    performedBy: string,
    metadata?: Record<string, any>
  ): Promise<EscrowAccount> {
    if (account.status !== 'created') {
      throw new Error(`Cannot fund account in status: ${account.status}`);
    }

    const updatedAccount = {
      ...account,
      status: 'funded' as const,
      fundedAt: new Date()
    };

    await this.addAuditEntry(updatedAccount, 'funded', performedBy, {
      paymentReference,
      amount: account.totalAmount,
      ...metadata
    });

    // Schedule automatic hold after funding
    await this.holdFunds(updatedAccount, performedBy, 'Automatic hold after funding');

    return updatedAccount;
  }

  async holdFunds(
    account: EscrowAccount,
    performedBy: string,
    reason: string
  ): Promise<EscrowAccount> {
    if (account.status !== 'funded') {
      throw new Error(`Cannot hold funds in status: ${account.status}`);
    }

    const updatedAccount = {
      ...account,
      status: 'held' as const
    };

    await this.addAuditEntry(updatedAccount, 'held', performedBy, {
      reason,
      holdAmount: account.totalAmount
    });

    return updatedAccount;
  }

  async releaseFunds(
    account: EscrowAccount,
    allocation: FundAllocation,
    performedBy: string,
    reason?: string
  ): Promise<EscrowAccount> {
    if (account.status !== 'held') {
      throw new Error(`Cannot release funds in status: ${account.status}`);
    }

    // Verify all release conditions are met
    const unmetConditions = account.releaseConditions.filter(c => c.status !== 'met');
    if (unmetConditions.length > 0) {
      throw new Error(`Cannot release funds: ${unmetConditions.length} conditions not met`);
    }

    // Validate fund allocation
    this.validateFundAllocation(account, allocation);

    const updatedAccount = {
      ...account,
      status: 'released' as const,
      releasedAt: new Date()
    };

    await this.addAuditEntry(updatedAccount, 'released', performedBy, {
      reason,
      allocation,
      releaseAmount: account.totalAmount
    });

    // Process the actual fund transfers
    await this.executeFundTransfers(account, allocation);

    return updatedAccount;
  }

  async refundFunds(
    account: EscrowAccount,
    refundAmount: number,
    performedBy: string,
    reason: string
  ): Promise<EscrowAccount> {
    if (!['held', 'funded'].includes(account.status)) {
      throw new Error(`Cannot refund funds in status: ${account.status}`);
    }

    if (refundAmount > account.totalAmount) {
      throw new Error(`Refund amount exceeds escrow balance`);
    }

    const updatedAccount = {
      ...account,
      status: 'refunded' as const,
      refundedAt: new Date()
    };

    await this.addAuditEntry(updatedAccount, 'refunded', performedBy, {
      reason,
      refundAmount,
      originalAmount: account.totalAmount
    });

    // Process refund to borrower
    await this.executeRefund(account, refundAmount);

    return updatedAccount;
  }

  async freezeAccount(
    account: EscrowAccount,
    reason: string,
    performedBy: string
  ): Promise<EscrowAccount> {
    const updatedAccount = {
      ...account,
      status: 'frozen' as const,
      freezeReason: reason
    };

    await this.addAuditEntry(updatedAccount, 'frozen', performedBy, {
      reason,
      frozenAmount: account.totalAmount
    });

    return updatedAccount;
  }

  async unfreezeAccount(
    account: EscrowAccount,
    performedBy: string
  ): Promise<EscrowAccount> {
    if (account.status !== 'frozen') {
      throw new Error(`Cannot unfreeze account in status: ${account.status}`);
    }

    const updatedAccount = {
      ...account,
      status: 'held' as const,
      freezeReason: undefined
    };

    await this.addAuditEntry(updatedAccount, 'unfrozen', performedBy, {
      previousReason: account.freezeReason
    });

    return updatedAccount;
  }

  async updateReleaseCondition(
    account: EscrowAccount,
    conditionType: string,
    status: 'met' | 'failed',
    value?: any
  ): Promise<EscrowAccount> {
    const condition = account.releaseConditions.find(c => c.type === conditionType);
    if (!condition) {
      throw new Error(`Release condition not found: ${conditionType}`);
    }

    condition.status = status;
    condition.value = value;
    condition.metAt = status === 'met' ? new Date() : undefined;

    // Check if all conditions are now met for auto-release
    const allConditionsMet = account.releaseConditions.every(c => c.status === 'met');
    if (allConditionsMet && account.status === 'held') {
      // Schedule automatic release
      account.releaseScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours delay
    }

    return account;
  }

  private encryptPaymentInfo(paymentInfo: any): string {
    const plaintext = JSON.stringify(paymentInfo);
    const iv = randomBytes(16);
    const cipher = createCipher('aes-256-gcm', this.ENCRYPTION_KEY);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    });
  }

  decryptPaymentInfo(encryptedData: string): any {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);
    
    const decipher = createDecipher('aes-256-gcm', this.ENCRYPTION_KEY);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  private async addAuditEntry(
    account: EscrowAccount,
    action: EscrowAuditEntry['action'],
    performedBy: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const entry: EscrowAuditEntry = {
      id: randomBytes(16).toString('hex'),
      timestamp: new Date(),
      action,
      performedBy,
      metadata,
      signature: ''
    };

    // Create signature for audit entry integrity
    entry.signature = this.createAuditSignature(entry);
    
    account.auditTrail.push(entry);
  }

  private createAuditSignature(entry: Omit<EscrowAuditEntry, 'signature'>): string {
    const data = `${entry.id}:${entry.timestamp.toISOString()}:${entry.action}:${entry.performedBy}:${JSON.stringify(entry.metadata || {})}`;
    return createHmac('sha256', this.HMAC_KEY).update(data).digest('hex');
  }

  verifyAuditEntry(entry: EscrowAuditEntry): boolean {
    const expectedSignature = this.createAuditSignature({
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      performedBy: entry.performedBy,
      metadata: entry.metadata
    });
    
    return entry.signature === expectedSignature;
  }

  private validateFundAllocation(account: EscrowAccount, allocation: FundAllocation): void {
    const totalAllocation = allocation.lenderAmount + allocation.platformAmount + (allocation.refundAmount || 0) + (allocation.penaltyAmount || 0);
    
    if (Math.abs(totalAllocation - account.totalAmount) > 0.01) {
      throw new Error(`Fund allocation mismatch: ${totalAllocation} vs ${account.totalAmount}`);
    }

    if (allocation.lenderAmount < 0 || allocation.platformAmount < 0) {
      throw new Error('Allocation amounts cannot be negative');
    }
  }

  private async executeFundTransfers(account: EscrowAccount, allocation: FundAllocation): Promise<void> {
    // In production, integrate with payment processor for actual transfers
    console.log(`Transferring funds for escrow ${account.id}:`);
    console.log(`- Lender: $${allocation.lenderAmount}`);
    console.log(`- Platform: $${allocation.platformAmount}`);
    
    if (allocation.refundAmount) {
      console.log(`- Refund: $${allocation.refundAmount}`);
    }
    
    if (allocation.penaltyAmount) {
      console.log(`- Penalty: $${allocation.penaltyAmount}`);
    }

    // Simulate transfer delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async executeRefund(account: EscrowAccount, amount: number): Promise<void> {
    // In production, process actual refund through payment processor
    console.log(`Refunding $${amount} to borrower for escrow ${account.id}`);
    
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private generateEscrowId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `escrow_${timestamp}_${random}`;
  }

  private generateKey(): string {
    return randomBytes(32).toString('hex');
  }

  // Account status and balance queries
  getAccountBalance(account: EscrowAccount): {
    total: number;
    available: number;
    held: number;
    currency: string;
  } {
    const held = ['held', 'frozen'].includes(account.status) ? account.totalAmount : 0;
    const available = account.status === 'funded' ? account.totalAmount : 0;

    return {
      total: account.totalAmount,
      available,
      held,
      currency: account.currency
    };
  }

  isAccountActive(account: EscrowAccount): boolean {
    return ['created', 'funded', 'held'].includes(account.status);
  }

  getAccountSummary(account: EscrowAccount): {
    id: string;
    status: string;
    balance: {
      total: number;
      available: number;
      held: number;
      currency: string;
    };
    conditionsMet: number;
    totalConditions: number;
    auditEntries: number;
    createdAt: Date;
    lastActivity?: Date;
  } {
    const conditionsMet = account.releaseConditions.filter(c => c.status === 'met').length;
    const lastAuditEntry = account.auditTrail[account.auditTrail.length - 1];

    return {
      id: account.id,
      status: account.status,
      balance: this.getAccountBalance(account),
      conditionsMet,
      totalConditions: account.releaseConditions.length,
      auditEntries: account.auditTrail.length,
      createdAt: account.createdAt,
      lastActivity: lastAuditEntry?.timestamp
    };
  }
}

export default SecureEscrowManager;