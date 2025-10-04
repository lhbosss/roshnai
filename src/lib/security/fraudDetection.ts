import { createHash } from 'crypto';

export interface FraudCheck {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: FraudFlag[];
  recommendation: 'approve' | 'review' | 'decline';
  detectionTimestamp: Date;
}

export interface FraudFlag {
  type: 'velocity' | 'amount' | 'location' | 'device' | 'behavior' | 'blacklist';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentContext {
  userId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  timestamp: Date;
}

export interface UserHistory {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  lastTransactionDate?: Date;
  unusualHours: number[];
  commonLocations: string[];
  suspiciousActivity: number;
  accountAge: number; // days
}

export class FraudDetectionEngine {
  private readonly RISK_THRESHOLDS = {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8,
    CRITICAL: 0.9
  };

  private readonly AMOUNT_LIMITS = {
    DAILY: 1000,
    WEEKLY: 5000,
    MONTHLY: 20000,
    SINGLE_TRANSACTION: 500
  };

  async analyzePayment(
    context: PaymentContext,
    userHistory: UserHistory,
    recentTransactions: Array<{ amount: number; timestamp: Date; location?: string }>
  ): Promise<FraudCheck> {
    const flags: FraudFlag[] = [];
    let riskScore = 0;

    // Check velocity patterns
    const velocityFlags = this.checkVelocityPatterns(context, recentTransactions);
    flags.push(...velocityFlags);
    riskScore += velocityFlags.reduce((sum, flag) => sum + this.getFlagScore(flag), 0);

    // Check amount anomalies
    const amountFlags = this.checkAmountAnomalies(context, userHistory);
    flags.push(...amountFlags);
    riskScore += amountFlags.reduce((sum, flag) => sum + this.getFlagScore(flag), 0);

    // Check location anomalies
    const locationFlags = this.checkLocationAnomalies(context, userHistory);
    flags.push(...locationFlags);
    riskScore += locationFlags.reduce((sum, flag) => sum + this.getFlagScore(flag), 0);

    // Check device patterns
    const deviceFlags = this.checkDevicePatterns(context, userHistory);
    flags.push(...deviceFlags);
    riskScore += deviceFlags.reduce((sum, flag) => sum + this.getFlagScore(flag), 0);

    // Check behavioral patterns
    const behaviorFlags = this.checkBehavioralPatterns(context, userHistory);
    flags.push(...behaviorFlags);
    riskScore += behaviorFlags.reduce((sum, flag) => sum + this.getFlagScore(flag), 0);

    // Check blacklists
    const blacklistFlags = await this.checkBlacklists(context);
    flags.push(...blacklistFlags);
    riskScore += blacklistFlags.reduce((sum, flag) => sum + this.getFlagScore(flag), 0);

    // Normalize risk score (0-1)
    riskScore = Math.min(riskScore / 10, 1);

    const riskLevel = this.calculateRiskLevel(riskScore);
    const recommendation = this.getRecommendation(riskLevel, flags);

    return {
      riskScore,
      riskLevel,
      flags,
      recommendation,
      detectionTimestamp: new Date()
    };
  }

  private checkVelocityPatterns(
    context: PaymentContext,
    recentTransactions: Array<{ amount: number; timestamp: Date; location?: string }>
  ): FraudFlag[] {
    const flags: FraudFlag[] = [];
    const now = context.timestamp;
    
    // Check transactions in last hour
    const lastHour = recentTransactions.filter(
      tx => (now.getTime() - tx.timestamp.getTime()) <= 3600000
    );
    
    if (lastHour.length >= 5) {
      flags.push({
        type: 'velocity',
        severity: 'high',
        description: `${lastHour.length} transactions in the last hour`,
        metadata: { count: lastHour.length, timeframe: '1hour' }
      });
    }

    // Check daily transaction count
    const today = recentTransactions.filter(
      tx => this.isSameDay(tx.timestamp, now)
    );
    
    if (today.length >= 20) {
      flags.push({
        type: 'velocity',
        severity: 'critical',
        description: `${today.length} transactions today`,
        metadata: { count: today.length, timeframe: 'daily' }
      });
    }

    // Check daily amount
    const dailyAmount = today.reduce((sum, tx) => sum + tx.amount, 0) + context.amount;
    if (dailyAmount > this.AMOUNT_LIMITS.DAILY) {
      flags.push({
        type: 'velocity',
        severity: 'medium',
        description: `Daily transaction limit exceeded: $${dailyAmount}`,
        metadata: { amount: dailyAmount, limit: this.AMOUNT_LIMITS.DAILY }
      });
    }

    return flags;
  }

  private checkAmountAnomalies(context: PaymentContext, userHistory: UserHistory): FraudFlag[] {
    const flags: FraudFlag[] = [];

    // Check if amount is significantly higher than average
    if (userHistory.averageAmount > 0) {
      const ratio = context.amount / userHistory.averageAmount;
      if (ratio > 10) {
        flags.push({
          type: 'amount',
          severity: 'high',
          description: `Amount ${ratio.toFixed(1)}x higher than user average`,
          metadata: { amount: context.amount, average: userHistory.averageAmount, ratio }
        });
      } else if (ratio > 5) {
        flags.push({
          type: 'amount',
          severity: 'medium',
          description: `Amount ${ratio.toFixed(1)}x higher than user average`,
          metadata: { amount: context.amount, average: userHistory.averageAmount, ratio }
        });
      }
    }

    // Check absolute amount limits
    if (context.amount > this.AMOUNT_LIMITS.SINGLE_TRANSACTION) {
      const severity = context.amount > this.AMOUNT_LIMITS.SINGLE_TRANSACTION * 2 ? 'high' : 'medium';
      flags.push({
        type: 'amount',
        severity,
        description: `High transaction amount: $${context.amount}`,
        metadata: { amount: context.amount, limit: this.AMOUNT_LIMITS.SINGLE_TRANSACTION }
      });
    }

    // Check for round numbers (potential testing)
    if (context.amount % 100 === 0 && context.amount >= 1000) {
      flags.push({
        type: 'amount',
        severity: 'low',
        description: 'Round number transaction amount',
        metadata: { amount: context.amount }
      });
    }

    return flags;
  }

  private checkLocationAnomalies(context: PaymentContext, userHistory: UserHistory): FraudFlag[] {
    const flags: FraudFlag[] = [];

    if (!context.location) return flags;

    const currentLocation = `${context.location.country}-${context.location.region}`;
    
    // Check if location is new for user
    if (userHistory.commonLocations.length > 0 && 
        !userHistory.commonLocations.includes(currentLocation)) {
      flags.push({
        type: 'location',
        severity: 'medium',
        description: 'Transaction from new location',
        metadata: { location: currentLocation, knownLocations: userHistory.commonLocations }
      });
    }

    // Check for high-risk countries (simplified example)
    const highRiskCountries = ['XX', 'YY', 'ZZ']; // Replace with actual list
    if (highRiskCountries.includes(context.location.country)) {
      flags.push({
        type: 'location',
        severity: 'high',
        description: 'Transaction from high-risk country',
        metadata: { country: context.location.country }
      });
    }

    return flags;
  }

  private checkDevicePatterns(context: PaymentContext, userHistory: UserHistory): FraudFlag[] {
    const flags: FraudFlag[] = [];

    // Check for new device
    if (context.deviceFingerprint) {
      const deviceHash = createHash('sha256')
        .update(context.deviceFingerprint + context.userAgent)
        .digest('hex');
      
      // In production, check against known device hashes for user
      // For now, simulate new device detection
      flags.push({
        type: 'device',
        severity: 'low',
        description: 'Transaction from new device',
        metadata: { deviceHash: deviceHash.substring(0, 8) }
      });
    }

    // Check for suspicious user agents
    if (context.userAgent) {
      const suspiciousPatterns = ['bot', 'crawler', 'headless', 'automated'];
      const hasSuspiciousUA = suspiciousPatterns.some(pattern => 
        context.userAgent!.toLowerCase().includes(pattern)
      );
      
      if (hasSuspiciousUA) {
        flags.push({
          type: 'device',
          severity: 'critical',
          description: 'Suspicious user agent detected',
          metadata: { userAgent: context.userAgent }
        });
      }
    }

    return flags;
  }

  private checkBehavioralPatterns(context: PaymentContext, userHistory: UserHistory): FraudFlag[] {
    const flags: FraudFlag[] = [];

    // Check transaction time patterns
    const hour = context.timestamp.getHours();
    if (userHistory.unusualHours.includes(hour)) {
      flags.push({
        type: 'behavior',
        severity: 'low',
        description: 'Transaction at unusual hour for user',
        metadata: { hour, unusualHours: userHistory.unusualHours }
      });
    }

    // Check for very new accounts
    if (userHistory.accountAge < 1) {
      flags.push({
        type: 'behavior',
        severity: 'medium',
        description: 'Transaction from very new account',
        metadata: { accountAge: userHistory.accountAge }
      });
    }

    // Check for users with previous suspicious activity
    if (userHistory.suspiciousActivity > 3) {
      flags.push({
        type: 'behavior',
        severity: 'high',
        description: 'User has history of suspicious activity',
        metadata: { suspiciousCount: userHistory.suspiciousActivity }
      });
    }

    return flags;
  }

  private async checkBlacklists(context: PaymentContext): Promise<FraudFlag[]> {
    const flags: FraudFlag[] = [];

    // Check IP blacklist
    if (context.ipAddress) {
      const isBlacklisted = await this.checkIPBlacklist(context.ipAddress);
      if (isBlacklisted) {
        flags.push({
          type: 'blacklist',
          severity: 'critical',
          description: 'IP address found on blacklist',
          metadata: { ipAddress: context.ipAddress }
        });
      }
    }

    // Check payment method blacklist
    const isPaymentBlacklisted = await this.checkPaymentMethodBlacklist(context.paymentMethodId);
    if (isPaymentBlacklisted) {
      flags.push({
        type: 'blacklist',
        severity: 'critical',
        description: 'Payment method found on blacklist',
        metadata: { paymentMethodId: context.paymentMethodId }
      });
    }

    return flags;
  }

  private async checkIPBlacklist(ipAddress: string): Promise<boolean> {
    // In production, check against IP reputation services
    // For now, simulate blacklist check
    const blacklistedIPs = ['192.168.1.100', '10.0.0.5']; // Example IPs
    return blacklistedIPs.includes(ipAddress);
  }

  private async checkPaymentMethodBlacklist(paymentMethodId: string): Promise<boolean> {
    // In production, check against payment method blacklist
    // For now, return false
    return false;
  }

  private getFlagScore(flag: FraudFlag): number {
    const severityScores = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      critical: 1.0
    };
    return severityScores[flag.severity];
  }

  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= this.RISK_THRESHOLDS.CRITICAL) return 'critical';
    if (riskScore >= this.RISK_THRESHOLDS.HIGH) return 'high';
    if (riskScore >= this.RISK_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  }

  private getRecommendation(riskLevel: string, flags: FraudFlag[]): 'approve' | 'review' | 'decline' {
    // Auto-decline for critical risk or critical flags
    if (riskLevel === 'critical' || flags.some(f => f.severity === 'critical')) {
      return 'decline';
    }
    
    // Review for high risk
    if (riskLevel === 'high') {
      return 'review';
    }
    
    // Review for multiple medium severity flags
    const mediumFlags = flags.filter(f => f.severity === 'medium');
    if (mediumFlags.length >= 3) {
      return 'review';
    }
    
    return 'approve';
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
}

// Payment verification utilities
export class PaymentVerification {
  static async verifyPaymentMethod(paymentMethodId: string): Promise<{
    isValid: boolean;
    details?: any;
    error?: string;
  }> {
    try {
      // In production, integrate with payment provider's verification API
      // For now, simulate verification
      
      if (!paymentMethodId || paymentMethodId.length < 10) {
        return {
          isValid: false,
          error: 'Invalid payment method ID format'
        };
      }

      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        isValid: true,
        details: {
          type: 'card',
          last4: paymentMethodId.slice(-4),
          verified: true,
          verificationTimestamp: new Date()
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Payment method verification failed'
      };
    }
  }

  static async verifyTransaction(transactionId: string): Promise<{
    isValid: boolean;
    status: string;
    amount?: number;
    currency?: string;
    timestamp?: Date;
    error?: string;
  }> {
    try {
      // In production, verify with payment processor
      // For now, simulate transaction verification
      
      if (!transactionId) {
        return {
          isValid: false,
          status: 'invalid',
          error: 'Transaction ID required'
        };
      }

      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        isValid: true,
        status: 'completed',
        amount: 50.00,
        currency: 'USD',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        isValid: false,
        status: 'error',
        error: 'Transaction verification failed'
      };
    }
  }

  static generateVerificationToken(userId: string, transactionId: string): string {
    const timestamp = Date.now().toString();
    const data = `${userId}:${transactionId}:${timestamp}`;
    return createHash('sha256').update(data).digest('hex');
  }

  static verifyToken(token: string, _userId: string, _transactionId: string): boolean {
    // In production, implement proper token verification with expiration
    // For now, basic validation
    return Boolean(token && token.length === 64);
  }
}

export default FraudDetectionEngine;