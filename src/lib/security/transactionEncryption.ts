import { createCipheriv, createDecipheriv, createHash, randomBytes, createHmac, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyDerivation?: string;
  salt?: string;
}

export interface TransactionSecurityContext {
  transactionId: string;
  userId: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface SecureTransaction {
  id: string;
  encryptedData: EncryptedData;
  signature: string;
  securityContext: TransactionSecurityContext;
  metadata: {
    dataHash: string;
    encryptionVersion: string;
    createdAt: Date;
    expiresAt?: Date;
  };
}

export class TransactionEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly ENCRYPTION_VERSION = '1.0';

  private readonly masterKey: Buffer;
  private readonly hmacKey: Buffer;

  constructor(masterKey?: string, hmacKey?: string) {
    this.masterKey = Buffer.from(
      masterKey || process.env.TRANSACTION_MASTER_KEY || this.generateRandomKey(),
      'hex'
    );
    this.hmacKey = Buffer.from(
      hmacKey || process.env.TRANSACTION_HMAC_KEY || this.generateRandomKey(),
      'hex'
    );

    if (this.masterKey.length !== TransactionEncryption.KEY_LENGTH) {
      throw new Error('Master key must be 32 bytes (64 hex characters)');
    }
  }

  async encryptTransactionData(
    data: any,
    context: TransactionSecurityContext,
    options?: {
      useKeyDerivation?: boolean;
      expirationHours?: number;
    }
  ): Promise<SecureTransaction> {
    const jsonData = JSON.stringify(data);
    const dataHash = this.createDataHash(jsonData);

    // Generate encryption key
    let encryptionKey: Buffer;
    let keyDerivation: string | undefined;
    let salt: Buffer | undefined;

    if (options?.useKeyDerivation) {
      salt = randomBytes(TransactionEncryption.SALT_LENGTH);
      const keyMaterial = `${context.transactionId}:${context.userId}:${context.timestamp}`;
      encryptionKey = await this.deriveKey(keyMaterial, salt);
      keyDerivation = 'scrypt';
    } else {
      encryptionKey = this.masterKey;
    }

    // Encrypt data
    const encryptedData = await this.encryptData(jsonData, encryptionKey);
    if (salt) {
      encryptedData.salt = salt.toString('hex');
      encryptedData.keyDerivation = keyDerivation;
    }

    // Create secure transaction
    const secureTransaction: SecureTransaction = {
      id: this.generateTransactionId(),
      encryptedData,
      signature: '',
      securityContext: context,
      metadata: {
        dataHash,
        encryptionVersion: TransactionEncryption.ENCRYPTION_VERSION,
        createdAt: new Date(),
        expiresAt: options?.expirationHours 
          ? new Date(Date.now() + options.expirationHours * 60 * 60 * 1000) 
          : undefined
      }
    };

    // Sign the transaction
    secureTransaction.signature = this.signTransaction(secureTransaction);

    return secureTransaction;
  }

  async decryptTransactionData(
    secureTransaction: SecureTransaction,
    context?: Partial<TransactionSecurityContext>
  ): Promise<any> {
    // Verify transaction hasn't expired
    if (secureTransaction.metadata.expiresAt && new Date() > secureTransaction.metadata.expiresAt) {
      throw new Error('Transaction data has expired');
    }

    // Verify signature
    if (!this.verifyTransactionSignature(secureTransaction)) {
      throw new Error('Transaction signature verification failed');
    }

    // Verify context if provided
    if (context) {
      this.verifySecurityContext(secureTransaction.securityContext, context);
    }

    // Derive decryption key
    let decryptionKey: Buffer;
    if (secureTransaction.encryptedData.keyDerivation === 'scrypt' && secureTransaction.encryptedData.salt) {
      const keyMaterial = `${secureTransaction.securityContext.transactionId}:${secureTransaction.securityContext.userId}:${secureTransaction.securityContext.timestamp}`;
      const salt = Buffer.from(secureTransaction.encryptedData.salt, 'hex');
      decryptionKey = await this.deriveKey(keyMaterial, salt);
    } else {
      decryptionKey = this.masterKey;
    }

    // Decrypt data
    const decryptedJson = await this.decryptData(secureTransaction.encryptedData, decryptionKey);
    const decryptedData = JSON.parse(decryptedJson);

    // Verify data integrity
    const dataHash = this.createDataHash(decryptedJson);
    if (dataHash !== secureTransaction.metadata.dataHash) {
      throw new Error('Data integrity check failed');
    }

    return decryptedData;
  }

  private async encryptData(plaintext: string, key: Buffer): Promise<EncryptedData> {
    const iv = randomBytes(TransactionEncryption.IV_LENGTH);
    const cipher = createCipheriv(TransactionEncryption.ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: TransactionEncryption.ALGORITHM
    };
  }

  private async decryptData(encryptedData: EncryptedData, key: Buffer): Promise<string> {
    if (encryptedData.algorithm !== TransactionEncryption.ALGORITHM) {
      throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
    }

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    const decipher = createDecipheriv(encryptedData.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private async deriveKey(keyMaterial: string, salt: Buffer): Promise<Buffer> {
    return scryptAsync(keyMaterial, salt, TransactionEncryption.KEY_LENGTH) as Promise<Buffer>;
  }

  private createDataHash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private signTransaction(transaction: Omit<SecureTransaction, 'signature'>): string {
    const signatureData = JSON.stringify({
      id: transaction.id,
      encryptedData: transaction.encryptedData,
      securityContext: transaction.securityContext,
      metadata: transaction.metadata
    });

    return createHmac('sha256', this.hmacKey).update(signatureData).digest('hex');
  }

  verifyTransactionSignature(transaction: SecureTransaction): boolean {
    const expectedSignature = this.signTransaction({
      id: transaction.id,
      encryptedData: transaction.encryptedData,
      securityContext: transaction.securityContext,
      metadata: transaction.metadata
    });

    return transaction.signature === expectedSignature;
  }

  private verifySecurityContext(
    stored: TransactionSecurityContext,
    provided: Partial<TransactionSecurityContext>
  ): void {
    if (provided.transactionId && provided.transactionId !== stored.transactionId) {
      throw new Error('Transaction ID mismatch');
    }
    if (provided.userId && provided.userId !== stored.userId) {
      throw new Error('User ID mismatch');
    }
    if (provided.sessionId && provided.sessionId !== stored.sessionId) {
      throw new Error('Session ID mismatch');
    }
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `txn_${timestamp}_${random}`;
  }

  private generateRandomKey(): string {
    return randomBytes(TransactionEncryption.KEY_LENGTH).toString('hex');
  }

  // Utility methods for field-level encryption
  async encryptField(value: string, context: string): Promise<string> {
    const key = await this.deriveKey(context, randomBytes(TransactionEncryption.SALT_LENGTH));
    const encryptedData = await this.encryptData(value, key);
    return JSON.stringify(encryptedData);
  }

  async decryptField(encryptedValue: string, context: string): Promise<string> {
    const encryptedData: EncryptedData = JSON.parse(encryptedValue);
    if (!encryptedData.salt) {
      throw new Error('Salt required for field decryption');
    }
    
    const key = await this.deriveKey(context, Buffer.from(encryptedData.salt, 'hex'));
    return this.decryptData(encryptedData, key);
  }

  // Key rotation support
  async rotateKeys(newMasterKey?: string, newHmacKey?: string): Promise<{
    oldMasterKeyId: string;
    newMasterKeyId: string;
    rotationTimestamp: Date;
  }> {
    const oldMasterKeyId = this.createDataHash(this.masterKey.toString('hex'));
    
    // In production, securely store old keys for backward compatibility
    const rotationInfo = {
      oldMasterKeyId,
      newMasterKeyId: '',
      rotationTimestamp: new Date()
    };

    if (newMasterKey) {
      const newKey = Buffer.from(newMasterKey, 'hex');
      if (newKey.length !== TransactionEncryption.KEY_LENGTH) {
        throw new Error('New master key must be 32 bytes');
      }
      rotationInfo.newMasterKeyId = this.createDataHash(newMasterKey);
    }

    return rotationInfo;
  }
}

// Specialized encryption for different data types
export class PaymentDataEncryption extends TransactionEncryption {
  async encryptPaymentMethod(paymentMethod: {
    type: string;
    cardNumber?: string;
    expirationDate?: string;
    cvv?: string;
    accountNumber?: string;
    routingNumber?: string;
  }, context: TransactionSecurityContext): Promise<SecureTransaction> {
    // Remove sensitive data from logs
    const sanitizedMethod = {
      ...paymentMethod,
      cardNumber: paymentMethod.cardNumber ? '**** **** **** ' + paymentMethod.cardNumber.slice(-4) : undefined,
      cvv: paymentMethod.cvv ? '***' : undefined,
      accountNumber: paymentMethod.accountNumber ? '****' + paymentMethod.accountNumber.slice(-4) : undefined
    };

    console.log('Encrypting payment method:', sanitizedMethod);

    return this.encryptTransactionData(paymentMethod, context, {
      useKeyDerivation: true,
      expirationHours: 24
    });
  }

  async encryptBankingDetails(bankingDetails: {
    accountHolderName: string;
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  }, context: TransactionSecurityContext): Promise<SecureTransaction> {
    return this.encryptTransactionData(bankingDetails, context, {
      useKeyDerivation: true,
      expirationHours: 168 // 1 week
    });
  }
}

// Utility functions for transaction security
export class TransactionSecurity {
  static validateTransactionAmount(amount: number, currency: string = 'USD'): boolean {
    if (amount <= 0) return false;
    if (amount > 10000) return false; // Arbitrary limit
    if (currency !== 'USD') return false; // Only USD supported for now
    return true;
  }

  static generateSecureTransactionReference(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(12).toString('base64url');
    return `ref_${timestamp}_${random}`;
  }

  static createTransactionFingerprint(data: {
    userId: string;
    amount: number;
    timestamp: number;
    paymentMethodId: string;
  }): string {
    const fingerprint = `${data.userId}:${data.amount}:${data.timestamp}:${data.paymentMethodId}`;
    return createHash('sha256').update(fingerprint).digest('hex');
  }

  static verifyTransactionFingerprint(data: any, expectedFingerprint: string): boolean {
    const actualFingerprint = this.createTransactionFingerprint(data);
    return actualFingerprint === expectedFingerprint;
  }
}

export default TransactionEncryption;