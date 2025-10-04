import { createHash, createHmac, randomBytes } from 'crypto';

// Simple TOTP implementation without external dependencies
class SimpleTOTP {
  static generateSecret(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return secret;
  }

  static verify(secret: string, token: string, window: number = 2): boolean {
    const currentTime = Math.floor(Date.now() / 30000);
    
    for (let i = -window; i <= window; i++) {
      const testToken = this.generateTOTP(secret, currentTime + i);
      if (testToken === token) {
        return true;
      }
    }
    return false;
  }

  private static generateTOTP(secret: string, time: number): string {
    // Simplified TOTP generation (in production, use proper HOTP/TOTP implementation)
    const hash = createHmac('sha256', secret).update(time.toString()).digest('hex');
    const code = parseInt(hash.slice(-6), 16) % 1000000;
    return code.toString().padStart(6, '0');
  }

  static generateQRUrl(secret: string, issuer: string, accountName: string): string {
    const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    // In production, use a proper QR code library or service
    return `data:image/svg+xml;base64,${Buffer.from(`<svg><text>QR Code for: ${otpauth}</text></svg>`).toString('base64')}`;
  }
}

export interface MFASetup {
  userId: string;
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  isEnabled: boolean;
  enabledAt?: Date;
  lastUsed?: Date;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  isAuthenticated: boolean;
  mfaVerified: boolean;
  sensitiveOperationsEnabled: boolean;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  securityLevel: 'basic' | 'elevated' | 'critical';
}

export interface SecurityChallenge {
  challengeId: string;
  type: 'mfa_totp' | 'mfa_sms' | 'password_confirm' | 'security_questions';
  userId: string;
  operation: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isCompleted: boolean;
  metadata?: Record<string, any>;
}

export interface AuthenticationResult {
  success: boolean;
  sessionId?: string;
  mfaRequired?: boolean;
  challengeId?: string;
  securityLevel?: string;
  error?: string;
  lockoutUntil?: Date;
}

export class EnhancedAuthentication {
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SENSITIVE_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  private sessions: Map<string, AuthSession> = new Map();
  private challenges: Map<string, SecurityChallenge> = new Map();
  private loginAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map();

  async authenticate(
    userId: string,
    password: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      requireMFA?: boolean;
    }
  ): Promise<AuthenticationResult> {
    // Check if user is locked out
    const lockoutStatus = this.checkLockoutStatus(userId);
    if (lockoutStatus.isLockedOut) {
      return {
        success: false,
        error: 'Account temporarily locked due to multiple failed attempts',
        lockoutUntil: lockoutStatus.lockedUntil
      };
    }

    // Verify password (in production, hash and compare)
    const isPasswordValid = await this.verifyPassword(userId, password);
    if (!isPasswordValid) {
      this.recordFailedAttempt(userId);
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Reset failed attempts on successful password verification
    this.loginAttempts.delete(userId);

    // Check if MFA is required
    const userMFAStatus = await this.getUserMFAStatus(userId);
    if (userMFAStatus.isEnabled || options?.requireMFA) {
      const challengeId = this.createSecurityChallenge(userId, 'mfa_totp', 'login');
      return {
        success: true,
        mfaRequired: true,
        challengeId,
        securityLevel: 'basic'
      };
    }

    // Create session
    const session = this.createSession(userId, 'basic', options);
    return {
      success: true,
      sessionId: session.sessionId,
      securityLevel: session.securityLevel
    };
  }

  async verifyMFA(
    challengeId: string,
    token: string,
    options?: {
      isBackupCode?: boolean;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuthenticationResult> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      return {
        success: false,
        error: 'Invalid or expired challenge'
      };
    }

    if (challenge.isCompleted) {
      return {
        success: false,
        error: 'Challenge already completed'
      };
    }

    if (new Date() > challenge.expiresAt) {
      this.challenges.delete(challengeId);
      return {
        success: false,
        error: 'Challenge expired'
      };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      this.challenges.delete(challengeId);
      return {
        success: false,
        error: 'Too many attempts'
      };
    }

    // Verify MFA token
    const isValidToken = await this.verifyMFAToken(challenge.userId, token, options?.isBackupCode);
    challenge.attempts++;

    if (!isValidToken) {
      return {
        success: false,
        error: 'Invalid MFA token'
      };
    }

    // Mark challenge as completed
    challenge.isCompleted = true;
    
    // Create authenticated session
    const session = this.createSession(challenge.userId, 'elevated', options);
    session.mfaVerified = true;

    return {
      success: true,
      sessionId: session.sessionId,
      securityLevel: session.securityLevel
    };
  }

  async requireSensitiveOperationAuth(
    sessionId: string,
    operation: string,
    additionalVerification?: {
      requirePassword?: boolean;
      requireMFA?: boolean;
    }
  ): Promise<AuthenticationResult> {
    const session = this.sessions.get(sessionId);
    if (!session || !this.isSessionValid(session)) {
      return {
        success: false,
        error: 'Invalid or expired session'
      };
    }

    // Check if sensitive operations are already enabled for this session
    if (session.sensitiveOperationsEnabled && 
        session.securityLevel === 'critical' &&
        (Date.now() - session.lastActivity.getTime()) < this.SENSITIVE_SESSION_DURATION) {
      
      session.lastActivity = new Date();
      return {
        success: true,
        sessionId,
        securityLevel: 'critical'
      };
    }

    // Create security challenge for sensitive operation
    const challengeType = additionalVerification?.requireMFA ? 'mfa_totp' : 'password_confirm';
    const challengeId = this.createSecurityChallenge(session.userId, challengeType, operation);

    return {
      success: false,
      mfaRequired: challengeType === 'mfa_totp',
      challengeId,
      error: 'Additional verification required for sensitive operation'
    };
  }

  async verifySensitiveOperation(
    challengeId: string,
    verificationData: string,
    sessionId?: string
  ): Promise<AuthenticationResult> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      return {
        success: false,
        error: 'Invalid or expired challenge'
      };
    }

    const session = sessionId ? this.sessions.get(sessionId) : null;
    if (!session) {
      return {
        success: false,
        error: 'Invalid session'
      };
    }

    let isVerified = false;

    switch (challenge.type) {
      case 'password_confirm':
        isVerified = await this.verifyPassword(challenge.userId, verificationData);
        break;
      case 'mfa_totp':
        isVerified = await this.verifyMFAToken(challenge.userId, verificationData);
        break;
      default:
        return {
          success: false,
          error: 'Unsupported challenge type'
        };
    }

    if (!isVerified) {
      challenge.attempts++;
      return {
        success: false,
        error: 'Verification failed'
      };
    }

    // Upgrade session to critical level for sensitive operations
    session.securityLevel = 'critical';
    session.sensitiveOperationsEnabled = true;
    session.lastActivity = new Date();

    challenge.isCompleted = true;

    return {
      success: true,
      sessionId,
      securityLevel: 'critical'
    };
  }

  async setupMFA(userId: string): Promise<MFASetup> {
    const secret = SimpleTOTP.generateSecret(32);
    const qrCodeUrl = SimpleTOTP.generateQRUrl(secret, 'BookShare Platform', `BookShare (${userId})`);
    
    const backupCodes = Array.from({ length: 10 }, () => 
      randomBytes(4).toString('hex').toUpperCase()
    );

    return {
      userId,
      secret,
      qrCodeUrl,
      backupCodes,
      isEnabled: false
    };
  }

  async enableMFA(userId: string, secret: string, token: string): Promise<boolean> {
    const isValid = SimpleTOTP.verify(secret, token, 2);

    if (isValid) {
      // In production, save MFA settings to database
      console.log(`MFA enabled for user ${userId}`);
      return true;
    }

    return false;
  }

  async disableMFA(userId: string, currentToken: string): Promise<boolean> {
    const isValid = await this.verifyMFAToken(userId, currentToken);
    if (isValid) {
      // In production, remove MFA settings from database
      console.log(`MFA disabled for user ${userId}`);
      return true;
    }
    return false;
  }

  private async verifyPassword(userId: string, password: string): Promise<boolean> {
    // In production, hash the password and compare with stored hash
    // For now, simulate password verification
    return password.length >= 8;
  }

  private async verifyMFAToken(userId: string, token: string, isBackupCode?: boolean): Promise<boolean> {
    if (isBackupCode) {
      // In production, verify backup code against stored codes
      return token.length === 8 && /^[A-F0-9]+$/.test(token);
    }

    // In production, get user's MFA secret from database
    const userSecret = 'JBSWY3DPEHPK3PXP'; // Placeholder secret
    
    return SimpleTOTP.verify(userSecret, token, 2);
  }

  private async getUserMFAStatus(userId: string): Promise<{ isEnabled: boolean; lastUsed?: Date }> {
    // In production, fetch from database
    return { isEnabled: false };
  }

  private createSession(
    userId: string, 
    securityLevel: 'basic' | 'elevated' | 'critical',
    options?: { ipAddress?: string; userAgent?: string }
  ): AuthSession {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const duration = securityLevel === 'critical' 
      ? this.SENSITIVE_SESSION_DURATION 
      : this.SESSION_DURATION;

    const session: AuthSession = {
      sessionId,
      userId,
      isAuthenticated: true,
      mfaVerified: securityLevel !== 'basic',
      sensitiveOperationsEnabled: securityLevel === 'critical',
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + duration),
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      securityLevel
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  private createSecurityChallenge(
    userId: string,
    type: SecurityChallenge['type'],
    operation: string
  ): string {
    const challengeId = this.generateChallengeId();
    const now = new Date();

    const challenge: SecurityChallenge = {
      challengeId,
      type,
      userId,
      operation,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      isCompleted: false
    };

    this.challenges.set(challengeId, challenge);
    return challengeId;
  }

  private isSessionValid(session: AuthSession): boolean {
    return new Date() < session.expiresAt;
  }

  private checkLockoutStatus(userId: string): { isLockedOut: boolean; lockedUntil?: Date } {
    const attempts = this.loginAttempts.get(userId);
    if (!attempts) return { isLockedOut: false };

    if (attempts.lockedUntil && new Date() < attempts.lockedUntil) {
      return { isLockedOut: true, lockedUntil: attempts.lockedUntil };
    }

    // Clear expired lockout
    if (attempts.lockedUntil && new Date() >= attempts.lockedUntil) {
      this.loginAttempts.delete(userId);
      return { isLockedOut: false };
    }

    return { isLockedOut: false };
  }

  private recordFailedAttempt(userId: string): void {
    const attempts = this.loginAttempts.get(userId) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();

    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
    }

    this.loginAttempts.set(userId, attempts);
  }

  private generateSessionId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${randomBytes(32).toString('hex')}`)
      .digest('hex');
  }

  private generateChallengeId(): string {
    return `challenge_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  // Session management methods
  async validateSession(sessionId: string): Promise<AuthSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !this.isSessionValid(session)) {
      if (session) this.sessions.delete(sessionId);
      return null;
    }

    session.lastActivity = new Date();
    return session;
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async revokeAllSessions(userId: string): Promise<number> {
    let revokedCount = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        revokedCount++;
      }
    }
    return revokedCount;
  }

  getActiveSessionsCount(userId: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && this.isSessionValid(session)) {
        count++;
      }
    }
    return count;
  }

  // Cleanup expired sessions and challenges
  cleanupExpired(): { sessionsCleared: number; challengesCleared: number } {
    let sessionsCleared = 0;
    let challengesCleared = 0;

    const now = new Date();

    // Clear expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now >= session.expiresAt) {
        this.sessions.delete(sessionId);
        sessionsCleared++;
      }
    }

    // Clear expired challenges
    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (now >= challenge.expiresAt || challenge.isCompleted) {
        this.challenges.delete(challengeId);
        challengesCleared++;
      }
    }

    return { sessionsCleared, challengesCleared };
  }
}

export default EnhancedAuthentication;