import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  // Rate limiting
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
  
  // Request validation
  requestValidation: {
    maxBodySize: number;
    allowedMethods: string[];
    requiredHeaders: string[];
    blockedUserAgents: string[];
    blockedIPs: string[];
    allowedOrigins: string[];
  };
  
  // Security headers
  securityHeaders: {
    contentSecurityPolicy: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
    permissionsPolicy: string;
    strictTransportSecurity: string;
  };
  
  // Authentication
  authentication: {
    requireAuthForPaths: string[];
    adminOnlyPaths: string[];
    allowedTokenTypes: string[];
    tokenValidationStrict: boolean;
  };
  
  // Input sanitization
  inputSanitization: {
    enableSqlInjectionProtection: boolean;
    enableXssProtection: boolean;
    enableNoSqlInjectionProtection: boolean;
    enablePathTraversalProtection: boolean;
    maxStringLength: number;
    allowedFileTypes: string[];
  };
  
  // Attack prevention
  attackPrevention: {
    enableDDoSProtection: boolean;
    enableBruteForceProtection: boolean;
    enableClickjackingProtection: boolean;
    enableCSRFProtection: boolean;
    suspiciousPatternDetection: boolean;
  };
}

export interface SecurityMetrics {
  requests: {
    total: number;
    blocked: number;
    suspicious: number;
    authenticated: number;
  };
  
  attacks: {
    sqlInjection: number;
    xss: number;
    csrf: number;
    bruteForce: number;
    ddos: number;
    pathTraversal: number;
  };
  
  performance: {
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
  };
  
  users: {
    uniqueIPs: Set<string>;
    blockedIPs: Set<string>;
    suspiciousUsers: Set<string>;
  };
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'blocked_request' | 'suspicious_activity' | 'attack_detected' | 'rate_limit_exceeded' | 'validation_failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  source: {
    ip: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    country?: string;
  };
  
  request: {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: string;
    query?: Record<string, string>;
  };
  
  detection: {
    rule: string;
    reason: string;
    confidence: number; // 0-1
    pattern?: string;
  };
  
  response: {
    action: 'block' | 'rate_limit' | 'sanitize' | 'log' | 'alert';
    statusCode: number;
    message: string;
  };
}

export interface ValidationRule {
  name: string;
  enabled: boolean;
  pattern: RegExp;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'block' | 'sanitize' | 'log';
}

export class SecurityMiddleware {
  private config: SecurityConfig;
  private metrics: SecurityMetrics;
  private securityEvents: SecurityEvent[] = [];
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private bruteForceStore: Map<string, { attempts: number; blockUntil?: number }> = new Map();
  private validationRules: ValidationRule[];
  
  private readonly MAX_EVENTS_STORED = 10000;
  private readonly RATE_LIMIT_CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly BRUTE_FORCE_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly BRUTE_FORCE_MAX_ATTEMPTS = 5;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = this.mergeWithDefaults(config);
    this.metrics = this.initializeMetrics();
    this.validationRules = this.initializeValidationRules();
    
    // Start cleanup intervals
    this.startCleanupIntervals();
  }

  async middleware(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now();
    
    try {
      // Extract request information
      const requestInfo = this.extractRequestInfo(request);
      
      // 1. IP and User Agent Validation
      const ipValidation = await this.validateIPAndUserAgent(requestInfo);
      if (!ipValidation.allowed) {
        return this.blockRequest(request, requestInfo, ipValidation.reason || 'Access denied', 'blocked_request');
      }
      
      // 2. Rate Limiting
      const rateLimitCheck = await this.checkRateLimit(requestInfo);
      if (!rateLimitCheck.allowed) {
        return this.handleRateLimit(request, requestInfo, rateLimitCheck.resetTime || Date.now() + 60000);
      }
      
      // 3. Method and Path Validation
      const methodValidation = this.validateMethodAndPath(requestInfo);
      if (!methodValidation.allowed) {
        return this.blockRequest(request, requestInfo, methodValidation.reason || 'Request validation failed', 'validation_failed');
      }
      
      // 4. Authentication Check
      const authCheck = await this.checkAuthentication(request, requestInfo);
      if (!authCheck.allowed) {
        return this.blockRequest(request, requestInfo, authCheck.reason || 'Authentication failed', 'validation_failed');
      }
      
      // 5. Brute Force Protection
      const bruteForceCheck = this.checkBruteForce(requestInfo);
      if (!bruteForceCheck.allowed) {
        return this.blockRequest(request, requestInfo, 'Brute force attack detected', 'attack_detected');
      }
      
      // 6. DDoS Protection
      if (this.config.attackPrevention.enableDDoSProtection) {
        const ddosCheck = this.detectDDoS(requestInfo);
        if (!ddosCheck.allowed) {
          return this.blockRequest(request, requestInfo, 'DDoS attack detected', 'attack_detected');
        }
      }
      
      // 7. Request Body Validation
      if (request.body) {
        const bodyValidation = await this.validateRequestBody(request, requestInfo);
        if (!bodyValidation.allowed) {
          return this.blockRequest(request, requestInfo, bodyValidation.reason || 'Invalid request body', 'attack_detected');
        }
      }
      
      // 8. Input Sanitization
      if (['POST', 'PUT', 'PATCH'].includes(requestInfo.method)) {
        const sanitizationResult = await this.sanitizeInput(request, requestInfo);
        if (sanitizationResult.blocked) {
          return this.blockRequest(request, requestInfo, sanitizationResult.reason || 'Input sanitization failed', 'attack_detected');
        }
      }
      
      // 9. Header Validation
      const headerValidation = this.validateHeaders(requestInfo);
      if (!headerValidation.allowed) {
        return this.blockRequest(request, requestInfo, headerValidation.reason || 'Header validation failed', 'validation_failed');
      }
      
      // 10. Suspicious Pattern Detection
      if (this.config.attackPrevention.suspiciousPatternDetection) {
        const patternCheck = this.detectSuspiciousPatterns(requestInfo);
        if (patternCheck.suspicious) {
          this.logSecurityEvent(request, requestInfo, 'suspicious_activity', patternCheck.reason || 'Suspicious pattern detected');
        }
      }
      
      // Update metrics
      this.updateMetrics(requestInfo, startTime, true);
      
      // Request passed all security checks
      return null; // Allow request to continue
      
    } catch (error) {
      console.error('Security middleware error:', error);
      this.updateMetrics(this.extractRequestInfo(request), startTime, false);
      
      // On error, allow request but log incident
      this.logSecurityEvent(request, this.extractRequestInfo(request), 'suspicious_activity', 
        'Security middleware error occurred');
      
      return null;
    }
  }

  createSecurityHeaders(): Record<string, string> {
    const headers = this.config.securityHeaders;
    
    return {
      'Content-Security-Policy': headers.contentSecurityPolicy,
      'X-Frame-Options': headers.xFrameOptions,
      'X-Content-Type-Options': headers.xContentTypeOptions,
      'Referrer-Policy': headers.referrerPolicy,
      'Permissions-Policy': headers.permissionsPolicy,
      'Strict-Transport-Security': headers.strictTransportSecurity,
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  private extractRequestInfo(request: NextRequest): RequestInfo {
    const url = new URL(request.url);
    
    return {
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || '',
      origin: request.headers.get('origin') || '',
      referer: request.headers.get('referer') || '',
      contentType: request.headers.get('content-type') || '',
      contentLength: parseInt(request.headers.get('content-length') || '0'),
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date(),
      userId: this.extractUserId(request),
      sessionId: this.extractSessionId(request)
    };
  }

  private getClientIP(request: NextRequest): string {
    // Check various headers for real IP
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (xRealIP) return xRealIP;
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
    
    return request.ip || 'unknown';
  }

  private extractUserId(request: NextRequest): string | undefined {
    // Extract from JWT token or session
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = this.decodeJWTPayload(token);
        return payload?.userId || payload?.sub;
      } catch (error) {
        return undefined;
      }
    }
    return undefined;
  }

  private extractSessionId(request: NextRequest): string | undefined {
    return request.cookies.get('session')?.value;
  }

  private decodeJWTPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(payload);
    } catch (error) {
      return null;
    }
  }

  private async validateIPAndUserAgent(requestInfo: RequestInfo): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check blocked IPs
    if (this.config.requestValidation.blockedIPs.includes(requestInfo.ip)) {
      return { allowed: false, reason: 'IP address is blocked' };
    }

    // Check blocked user agents
    for (const blockedUA of this.config.requestValidation.blockedUserAgents) {
      if (requestInfo.userAgent.includes(blockedUA)) {
        return { allowed: false, reason: 'User agent is blocked' };
      }
    }

    // Check for suspicious user agent patterns
    const suspiciousUAPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /hack/i,
      /injection/i
    ];

    for (const pattern of suspiciousUAPatterns) {
      if (pattern.test(requestInfo.userAgent)) {
        this.metrics.requests.suspicious++;
        // Don't block, but log for monitoring
      }
    }

    return { allowed: true };
  }

  private async checkRateLimit(requestInfo: RequestInfo): Promise<{
    allowed: boolean;
    resetTime?: number;
  }> {
    const key = `${requestInfo.ip}:${requestInfo.userId || 'anonymous'}`;
    const now = Date.now();
    const windowStart = now - this.config.rateLimiting.windowMs;

    let rateLimitData = this.rateLimitStore.get(key);
    
    if (!rateLimitData || rateLimitData.resetTime <= now) {
      rateLimitData = {
        count: 0,
        resetTime: now + this.config.rateLimiting.windowMs
      };
    }

    rateLimitData.count++;
    this.rateLimitStore.set(key, rateLimitData);

    if (rateLimitData.count > this.config.rateLimiting.maxRequests) {
      return { allowed: false, resetTime: rateLimitData.resetTime };
    }

    return { allowed: true };
  }

  private validateMethodAndPath(requestInfo: RequestInfo): {
    allowed: boolean;
    reason?: string;
  } {
    // Check allowed methods
    if (!this.config.requestValidation.allowedMethods.includes(requestInfo.method)) {
      return { allowed: false, reason: `Method ${requestInfo.method} not allowed` };
    }

    // Check for path traversal attempts
    if (requestInfo.path.includes('..') || requestInfo.path.includes('~')) {
      return { allowed: false, reason: 'Path traversal attempt detected' };
    }

    // Check for suspicious path patterns
    const suspiciousPatterns = [
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\/admin$/i,
      /\/phpmyadmin/i,
      /\/wp-admin/i,
      /\/config/i,
      /\/backup/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestInfo.path)) {
        this.metrics.attacks.pathTraversal++;
        return { allowed: false, reason: 'Suspicious path pattern detected' };
      }
    }

    return { allowed: true };
  }

  private async checkAuthentication(request: NextRequest, requestInfo: RequestInfo): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check if path requires authentication
    const requiresAuth = this.config.authentication.requireAuthForPaths.some(path =>
      requestInfo.path.startsWith(path)
    );

    const isAdminPath = this.config.authentication.adminOnlyPaths.some(path =>
      requestInfo.path.startsWith(path)
    );

    if (!requiresAuth && !isAdminPath) {
      return { allowed: true };
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { allowed: false, reason: 'Authentication required' };
    }

    // Validate token format
    if (!authHeader.startsWith('Bearer ')) {
      return { allowed: false, reason: 'Invalid token format' };
    }

    const token = authHeader.slice(7);
    
    try {
      // Basic token validation (in production, verify signature)
      const payload = this.decodeJWTPayload(token);
      if (!payload) {
        return { allowed: false, reason: 'Invalid token' };
      }

      // Check token expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return { allowed: false, reason: 'Token expired' };
      }

      // Check admin access
      if (isAdminPath && !payload.roles?.includes('admin')) {
        return { allowed: false, reason: 'Admin access required' };
      }

      this.metrics.requests.authenticated++;
      return { allowed: true };

    } catch (error) {
      return { allowed: false, reason: 'Token validation failed' };
    }
  }

  private checkBruteForce(requestInfo: RequestInfo): {
    allowed: boolean;
    reason?: string;
  } {
    if (!this.config.attackPrevention.enableBruteForceProtection) {
      return { allowed: true };
    }

    const key = requestInfo.ip;
    const now = Date.now();
    
    let bruteForceData = this.bruteForceStore.get(key);
    
    if (!bruteForceData) {
      bruteForceData = { attempts: 0 };
      this.bruteForceStore.set(key, bruteForceData);
    }

    // Check if currently blocked
    if (bruteForceData.blockUntil && now < bruteForceData.blockUntil) {
      return { allowed: false, reason: 'IP temporarily blocked due to brute force attempts' };
    }

    // Reset if block period expired
    if (bruteForceData.blockUntil && now >= bruteForceData.blockUntil) {
      bruteForceData.attempts = 0;
      delete bruteForceData.blockUntil;
    }

    // Check for suspicious login patterns (failed auth responses would increment this)
    if (requestInfo.path.includes('/login') || requestInfo.path.includes('/auth')) {
      bruteForceData.attempts++;
      
      if (bruteForceData.attempts >= this.BRUTE_FORCE_MAX_ATTEMPTS) {
        bruteForceData.blockUntil = now + this.BRUTE_FORCE_WINDOW;
        this.metrics.attacks.bruteForce++;
        return { allowed: false, reason: 'Brute force attack detected' };
      }
    }

    return { allowed: true };
  }

  private detectDDoS(requestInfo: RequestInfo): {
    allowed: boolean;
    reason?: string;
  } {
    // Simple DDoS detection based on request frequency
    const recentRequests = Array.from(this.rateLimitStore.entries())
      .filter(([key, data]) => key.includes(requestInfo.ip))
      .reduce((sum, [, data]) => sum + data.count, 0);

    if (recentRequests > this.config.rateLimiting.maxRequests * 5) {
      this.metrics.attacks.ddos++;
      return { allowed: false, reason: 'DDoS attack pattern detected' };
    }

    return { allowed: true };
  }

  private async validateRequestBody(request: NextRequest, requestInfo: RequestInfo): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check content length
    if (requestInfo.contentLength > this.config.requestValidation.maxBodySize) {
      return { allowed: false, reason: 'Request body too large' };
    }

    try {
      const bodyText = await request.text();
      
      // Check for various injection patterns
      const injectionChecks = [
        { pattern: /(union|select|insert|update|delete|drop|create|alter)\s/i, type: 'SQL injection' },
        { pattern: /<script|javascript:|vbscript:|onload=|onerror=/i, type: 'XSS attack' },
        { pattern: /\{\s*\$\w+\s*\}/i, type: 'NoSQL injection' },
        { pattern: /\.\./i, type: 'Path traversal' }
      ];

      for (const check of injectionChecks) {
        if (check.pattern.test(bodyText)) {
          this.incrementAttackMetric(check.type);
          return { allowed: false, reason: `${check.type} detected in request body` };
        }
      }

      return { allowed: true };

    } catch (error) {
      return { allowed: false, reason: 'Invalid request body' };
    }
  }

  private async sanitizeInput(request: NextRequest, requestInfo: RequestInfo): Promise<{
    blocked: boolean;
    reason?: string;
  }> {
    try {
      const bodyText = await request.text();

      // Apply validation rules
      for (const rule of this.validationRules) {
        if (!rule.enabled) continue;

        if (rule.pattern.test(bodyText)) {
          if (rule.action === 'block') {
            return { blocked: true, reason: rule.message };
          } else if (rule.action === 'log') {
            this.logSecurityEvent(request, requestInfo, 'suspicious_activity', rule.message);
          }
        }
      }

      return { blocked: false };

    } catch (error) {
      return { blocked: true, reason: 'Input sanitization failed' };
    }
  }

  private validateHeaders(requestInfo: RequestInfo): {
    allowed: boolean;
    reason?: string;
  } {
    // Check required headers
    for (const requiredHeader of this.config.requestValidation.requiredHeaders) {
      if (!requestInfo.headers[requiredHeader.toLowerCase()]) {
        return { allowed: false, reason: `Required header missing: ${requiredHeader}` };
      }
    }

    // Check allowed origins for CORS
    if (requestInfo.origin && this.config.requestValidation.allowedOrigins.length > 0) {
      if (!this.config.requestValidation.allowedOrigins.includes(requestInfo.origin)) {
        return { allowed: false, reason: 'Origin not allowed' };
      }
    }

    // Check for suspicious header patterns
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite-url'
    ];

    for (const header of suspiciousHeaders) {
      if (requestInfo.headers[header]) {
        this.logSecurityEvent({} as NextRequest, requestInfo, 'suspicious_activity', 
          `Suspicious header detected: ${header}`);
      }
    }

    return { allowed: true };
  }

  private detectSuspiciousPatterns(requestInfo: RequestInfo): {
    suspicious: boolean;
    reason?: string;
  } {
    const suspiciousPatterns = [
      // Common attack patterns
      { pattern: /\b(eval|exec|system|shell_exec)\b/i, reason: 'Code execution pattern' },
      { pattern: /\b(base64_decode|file_get_contents|fopen|fwrite)\b/i, reason: 'File operation pattern' },
      { pattern: /(sleep|benchmark|waitfor)\s*\(/i, reason: 'Time-based attack pattern' },
      { pattern: /\b(cmd|powershell|bash|sh)\b/i, reason: 'Command injection pattern' },
      { pattern: /(\.\.\/){3,}/i, reason: 'Directory traversal pattern' },
      
      // Suspicious user agents
      { pattern: /curl|wget|python|java|perl|ruby/i, reason: 'Automated tool detected' },
      
      // Suspicious paths
      { pattern: /\/(admin|config|backup|logs|private)/i, reason: 'Sensitive path access' }
    ];

    const combinedText = `${requestInfo.path} ${requestInfo.query} ${requestInfo.userAgent}`;

    for (const { pattern, reason } of suspiciousPatterns) {
      if (pattern.test(combinedText)) {
        return { suspicious: true, reason };
      }
    }

    return { suspicious: false };
  }

  private incrementAttackMetric(attackType: string): void {
    switch (attackType.toLowerCase()) {
      case 'sql injection':
        this.metrics.attacks.sqlInjection++;
        break;
      case 'xss attack':
        this.metrics.attacks.xss++;
        break;
      case 'nosql injection':
        this.metrics.attacks.sqlInjection++; // Group with SQL injection
        break;
      case 'path traversal':
        this.metrics.attacks.pathTraversal++;
        break;
      case 'csrf':
        this.metrics.attacks.csrf++;
        break;
    }
  }

  private blockRequest(
    request: NextRequest,
    requestInfo: RequestInfo,
    reason: string,
    eventType: SecurityEvent['type']
  ): NextResponse {
    // Log security event
    this.logSecurityEvent(request, requestInfo, eventType, reason);
    
    // Update metrics
    this.metrics.requests.blocked++;
    
    // Create security headers
    const securityHeaders = this.createSecurityHeaders();
    
    // Return blocked response
    return new NextResponse(JSON.stringify({
      error: 'Request blocked by security middleware',
      message: 'Your request has been blocked due to security policies',
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...securityHeaders
      }
    });
  }

  private handleRateLimit(
    request: NextRequest,
    requestInfo: RequestInfo,
    resetTime: number
  ): NextResponse {
    this.logSecurityEvent(request, requestInfo, 'rate_limit_exceeded', 'Rate limit exceeded');
    
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    const securityHeaders = this.createSecurityHeaders();
    
    return new NextResponse(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
      timestamp: new Date().toISOString()
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...securityHeaders
      }
    });
  }

  private logSecurityEvent(
    request: NextRequest,
    requestInfo: RequestInfo,
    type: SecurityEvent['type'],
    reason: string
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type,
      severity: this.determineSeverity(type, reason),
      source: {
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        userId: requestInfo.userId,
        sessionId: requestInfo.sessionId
      },
      request: {
        method: requestInfo.method,
        path: requestInfo.path,
        headers: requestInfo.headers,
        query: requestInfo.query
      },
      detection: {
        rule: 'security_middleware',
        reason,
        confidence: 0.9
      },
      response: {
        action: type === 'rate_limit_exceeded' ? 'rate_limit' : 'block',
        statusCode: type === 'rate_limit_exceeded' ? 429 : 403,
        message: reason
      }
    };

    this.securityEvents.unshift(event);
    
    // Maintain events limit
    if (this.securityEvents.length > this.MAX_EVENTS_STORED) {
      this.securityEvents.splice(this.MAX_EVENTS_STORED);
    }
    
    // Log to console for monitoring
    console.warn(`Security Event: ${type} - ${reason}`, {
      ip: requestInfo.ip,
      path: requestInfo.path,
      userAgent: requestInfo.userAgent
    });
  }

  private determineSeverity(type: SecurityEvent['type'], reason: string): SecurityEvent['severity'] {
    if (reason.includes('injection') || reason.includes('attack')) {
      return 'critical';
    }
    if (type === 'attack_detected' || reason.includes('brute force')) {
      return 'high';
    }
    if (type === 'suspicious_activity') {
      return 'medium';
    }
    return 'low';
  }

  private updateMetrics(requestInfo: RequestInfo, startTime: number, success: boolean): void {
    this.metrics.requests.total++;
    
    if (requestInfo.userId) {
      this.metrics.requests.authenticated++;
    }
    
    this.metrics.users.uniqueIPs.add(requestInfo.ip);
    
    const responseTime = Date.now() - startTime;
    this.metrics.performance.averageResponseTime = 
      (this.metrics.performance.averageResponseTime + responseTime) / 2;
    
    if (responseTime > 1000) {
      this.metrics.performance.slowRequests++;
    }
    
    if (!success) {
      this.metrics.performance.errorRate++;
    }
  }

  private startCleanupIntervals(): void {
    // Clean up rate limit store
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.rateLimitStore.entries()) {
        if (data.resetTime <= now) {
          this.rateLimitStore.delete(key);
        }
      }
    }, this.RATE_LIMIT_CLEANUP_INTERVAL);

    // Clean up brute force store
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.bruteForceStore.entries()) {
        if (data.blockUntil && data.blockUntil <= now) {
          this.bruteForceStore.delete(key);
        }
      }
    }, this.RATE_LIMIT_CLEANUP_INTERVAL);
  }

  private mergeWithDefaults(config?: Partial<SecurityConfig>): SecurityConfig {
    const defaults: SecurityConfig = {
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        standardHeaders: true,
        legacyHeaders: false
      },
      requestValidation: {
        maxBodySize: 10 * 1024 * 1024, // 10MB
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        requiredHeaders: [],
        blockedUserAgents: ['BadBot', 'MaliciousBot'],
        blockedIPs: [],
        allowedOrigins: []
      },
      securityHeaders: {
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
        strictTransportSecurity: 'max-age=31536000; includeSubDomains'
      },
      authentication: {
        requireAuthForPaths: ['/api/user', '/api/transactions', '/api/messages'],
        adminOnlyPaths: ['/api/admin'],
        allowedTokenTypes: ['JWT'],
        tokenValidationStrict: true
      },
      inputSanitization: {
        enableSqlInjectionProtection: true,
        enableXssProtection: true,
        enableNoSqlInjectionProtection: true,
        enablePathTraversalProtection: true,
        maxStringLength: 10000,
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt']
      },
      attackPrevention: {
        enableDDoSProtection: true,
        enableBruteForceProtection: true,
        enableClickjackingProtection: true,
        enableCSRFProtection: true,
        suspiciousPatternDetection: true
      }
    };

    return this.deepMerge(defaults, config || {});
  }

  private deepMerge<T>(target: T, source: Partial<T>): T {
    const output = { ...target };
    
    for (const key in source) {
      const targetValue = target[key];
      const sourceValue = source[key];
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        output[key] = this.deepMerge(targetValue as any, sourceValue);
      } else if (sourceValue !== undefined) {
        output[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
    
    return output;
  }

  private initializeMetrics(): SecurityMetrics {
    return {
      requests: {
        total: 0,
        blocked: 0,
        suspicious: 0,
        authenticated: 0
      },
      attacks: {
        sqlInjection: 0,
        xss: 0,
        csrf: 0,
        bruteForce: 0,
        ddos: 0,
        pathTraversal: 0
      },
      performance: {
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0
      },
      users: {
        uniqueIPs: new Set(),
        blockedIPs: new Set(),
        suspiciousUsers: new Set()
      }
    };
  }

  private initializeValidationRules(): ValidationRule[] {
    return [
      {
        name: 'SQL Injection',
        enabled: true,
        pattern: /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/i,
        message: 'SQL injection attempt detected',
        severity: 'critical',
        action: 'block'
      },
      {
        name: 'XSS Attack',
        enabled: true,
        pattern: /<script|javascript:|vbscript:|onload=|onerror=|onclick=|onmouseover=/i,
        message: 'XSS attack attempt detected',
        severity: 'high',
        action: 'block'
      },
      {
        name: 'NoSQL Injection',
        enabled: true,
        pattern: /\{\s*\$\w+\s*:|where\s*:|mapreduce\s*:/i,
        message: 'NoSQL injection attempt detected',
        severity: 'high',
        action: 'block'
      },
      {
        name: 'Path Traversal',
        enabled: true,
        pattern: /\.\.[\/\\]|\.\.%2f|\.\.%5c/i,
        message: 'Path traversal attempt detected',
        severity: 'high',
        action: 'block'
      },
      {
        name: 'Command Injection',
        enabled: true,
        pattern: /;.*(&|%26|%0a|%0d|\||%7c)/i,
        message: 'Command injection attempt detected',
        severity: 'critical',
        action: 'block'
      },
      {
        name: 'LDAP Injection',
        enabled: true,
        pattern: /\(\s*\|\s*\(\s*&\s*\(\s*objectclass\s*=/i,
        message: 'LDAP injection attempt detected',
        severity: 'high',
        action: 'block'
      }
    ];
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(0, limit);
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = this.mergeWithDefaults(newConfig);
  }

  clearMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  addCustomValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  removeValidationRule(ruleName: string): void {
    this.validationRules = this.validationRules.filter(rule => rule.name !== ruleName);
  }
}

interface RequestInfo {
  method: string;
  path: string;
  query: Record<string, string>;
  ip: string;
  userAgent: string;
  origin: string;
  referer: string;
  contentType: string;
  contentLength: number;
  headers: Record<string, string>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export default SecurityMiddleware;