import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  
  // Event classification
  category: 'authentication' | 'authorization' | 'data_access' | 'financial' | 'system' | 'security' | 'admin' | 'user_action';
  action: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Actor information
  actor: {
    type: 'user' | 'system' | 'admin' | 'service' | 'unknown';
    id?: string;
    username?: string;
    role?: string;
    ip: string;
    userAgent?: string;
    sessionId?: string;
  };
  
  // Target/resource information
  target?: {
    type: 'user' | 'book' | 'transaction' | 'message' | 'complaint' | 'system_config';
    id?: string;
    attributes?: Record<string, any>;
  };
  
  // Event details
  details: {
    description: string;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    changes?: {
      field: string;
      oldValue?: any;
      newValue?: any;
    }[];
    metadata?: Record<string, any>;
  };
  
  // Context information
  context: {
    requestId?: string;
    transactionId?: string;
    endpoint?: string;
    method?: string;
    responseTime?: number;
    dataSize?: number;
  };
  
  // Compliance and security
  compliance: {
    regulations: string[]; // e.g., ['GDPR', 'PCI-DSS']
    dataTypes: string[]; // e.g., ['PII', 'financial']
    retention: Date; // When this log entry should be deleted
  };
  
  // Integrity
  signature: string; // HMAC signature for tamper detection
}

export interface AuditQueryFilter {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  actions?: string[];
  severities?: string[];
  actorIds?: string[];
  targetIds?: string[];
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  id: string;
  title: string;
  description: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  summary: {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    successRate: number;
    uniqueUsers: number;
    criticalEvents: number;
  };
  
  findings: AuditFinding[];
  recommendations: string[];
  
  createdAt: Date;
  createdBy: string;
}

export interface AuditFinding {
  type: 'anomaly' | 'compliance_violation' | 'security_incident' | 'performance_issue' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[]; // Audit log entry IDs
  impact: string;
  recommendation: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regulation: string; // e.g., 'GDPR', 'PCI-DSS', 'SOX'
  
  trigger: {
    categories: string[];
    actions: string[];
    conditions: Record<string, any>;
  };
  
  requirements: {
    dataRetention: number; // days
    encryptionRequired: boolean;
    accessControls: string[];
    notifications: string[];
  };
  
  monitoring: {
    alertThreshold: number;
    reportingFrequency: 'daily' | 'weekly' | 'monthly';
    stakeholders: string[];
  };
}

export interface SecurityMetrics {
  timeRange: {
    start: Date;
    end: Date;
  };
  
  events: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: { success: number; failure: number; };
  };
  
  security: {
    authenticationFailures: number;
    authorizationFailures: number;
    suspiciousActivities: number;
    blockedRequests: number;
    dataBreachAttempts: number;
  };
  
  financial: {
    transactionVolume: number;
    transactionValue: number;
    failedTransactions: number;
    disputedTransactions: number;
    fraudulentTransactions: number;
  };
  
  users: {
    activeUsers: number;
    newRegistrations: number;
    suspiciousUsers: number;
    blockedUsers: number;
  };
  
  performance: {
    averageResponseTime: number;
    slowRequests: number;
    systemErrors: number;
    uptime: number;
  };
}

export class SecurityAuditLogger {
  private logBuffer: AuditLogEntry[] = [];
  private signingKey: Buffer;
  private encryptionKey: Buffer;
  private complianceRules: ComplianceRule[] = [];
  
  private readonly LOG_DIRECTORY = './logs/audit';
  private readonly BUFFER_SIZE = 1000;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly RETENTION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(signingKey?: Buffer, encryptionKey?: Buffer) {
    this.signingKey = signingKey || crypto.randomBytes(32);
    this.encryptionKey = encryptionKey || crypto.randomBytes(32);
    
    this.initializeAuditSystem();
    this.loadComplianceRules();
    this.startPeriodicTasks();
  }

  async logEvent(
    category: AuditLogEntry['category'],
    action: string,
    actor: AuditLogEntry['actor'],
    details: AuditLogEntry['details'],
    target?: AuditLogEntry['target'],
    context?: Partial<AuditLogEntry['context']>
  ): Promise<string> {
    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      category,
      action,
      severity: this.determineSeverity(category, action, details.success),
      actor,
      target,
      details,
      context: {
        requestId: context?.requestId || this.generateRequestId(),
        transactionId: context?.transactionId,
        endpoint: context?.endpoint,
        method: context?.method,
        responseTime: context?.responseTime,
        dataSize: context?.dataSize
      },
      compliance: this.determineComplianceRequirements(category, action, target),
      signature: '' // Will be calculated
    };

    // Calculate signature for integrity
    logEntry.signature = this.calculateSignature(logEntry);

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Check if buffer needs flushing
    if (this.logBuffer.length >= this.BUFFER_SIZE) {
      await this.flushBuffer();
    }

    // Check compliance rules
    await this.checkComplianceRules(logEntry);

    return logEntry.id;
  }

  async logAuthentication(
    actor: AuditLogEntry['actor'],
    action: 'login' | 'logout' | 'password_change' | 'mfa_setup' | 'mfa_verify',
    success: boolean,
    details?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      'authentication',
      action,
      actor,
      {
        description: `User ${action} ${success ? 'successful' : 'failed'}`,
        success,
        metadata: details
      }
    );
  }

  async logAuthorization(
    actor: AuditLogEntry['actor'],
    resource: string,
    action: string,
    success: boolean,
    reason?: string
  ): Promise<string> {
    return this.logEvent(
      'authorization',
      `access_${action}`,
      actor,
      {
        description: `Access ${action} on ${resource} ${success ? 'granted' : 'denied'}`,
        success,
        errorMessage: reason
      },
      {
        type: resource.includes('user') ? 'user' : resource.includes('book') ? 'book' : 'system_config',
        attributes: { resource }
      }
    );
  }

  async logDataAccess(
    actor: AuditLogEntry['actor'],
    targetType: 'user' | 'book' | 'transaction' | 'message',
    targetId: string,
    action: 'read' | 'create' | 'update' | 'delete',
    success: boolean,
    changes?: { field: string; oldValue?: any; newValue?: any; }[]
  ): Promise<string> {
    return this.logEvent(
      'data_access',
      action,
      actor,
      {
        description: `${action.toUpperCase()} operation on ${targetType} ${success ? 'successful' : 'failed'}`,
        success,
        changes
      },
      {
        type: targetType,
        id: targetId
      }
    );
  }

  async logFinancialTransaction(
    actor: AuditLogEntry['actor'],
    transactionId: string,
    action: 'initiate' | 'authorize' | 'capture' | 'refund' | 'dispute',
    amount: number,
    success: boolean,
    details?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      'financial',
      action,
      actor,
      {
        description: `Financial transaction ${action} for $${amount} ${success ? 'successful' : 'failed'}`,
        success,
        metadata: { amount, currency: 'USD', ...details }
      },
      {
        type: 'transaction',
        id: transactionId,
        attributes: { amount }
      },
      {
        transactionId
      }
    );
  }

  async logSecurityEvent(
    actor: AuditLogEntry['actor'],
    eventType: 'blocked_request' | 'suspicious_activity' | 'attack_detected' | 'fraud_detected',
    description: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      'security',
      eventType,
      actor,
      {
        description,
        success: false, // Security events are typically threats/failures
        metadata
      }
    );
  }

  async logSystemEvent(
    action: 'startup' | 'shutdown' | 'backup' | 'restore' | 'maintenance' | 'error',
    description: string,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent(
      'system',
      action,
      {
        type: 'system',
        ip: 'localhost',
        id: 'system'
      },
      {
        description,
        success,
        metadata
      }
    );
  }

  async logAdminAction(
    admin: AuditLogEntry['actor'],
    action: string,
    target?: AuditLogEntry['target'],
    description?: string,
    changes?: { field: string; oldValue?: any; newValue?: any; }[]
  ): Promise<string> {
    return this.logEvent(
      'admin',
      action,
      admin,
      {
        description: description || `Admin performed ${action}`,
        success: true,
        changes
      },
      target
    );
  }

  async queryLogs(filter: AuditQueryFilter): Promise<AuditLogEntry[]> {
    try {
      // Flush current buffer to ensure latest entries are available
      await this.flushBuffer();

      const logs = await this.loadLogsFromFiles(filter);
      return this.filterLogs(logs, filter);
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }

  async generateReport(
    title: string,
    startDate: Date,
    endDate: Date,
    createdBy: string
  ): Promise<AuditReport> {
    const logs = await this.queryLogs({ startDate, endDate });
    
    const report: AuditReport = {
      id: this.generateReportId(),
      title,
      description: `Security audit report for period ${startDate.toISOString()} to ${endDate.toISOString()}`,
      period: { startDate, endDate },
      summary: this.generateSummary(logs),
      findings: await this.generateFindings(logs),
      recommendations: this.generateRecommendations(logs),
      createdAt: new Date(),
      createdBy
    };

    // Save report
    await this.saveReport(report);

    return report;
  }

  async getSecurityMetrics(startDate: Date, endDate: Date): Promise<SecurityMetrics> {
    const logs = await this.queryLogs({ startDate, endDate });

    return {
      timeRange: { start: startDate, end: endDate },
      events: {
        total: logs.length,
        byCategory: this.countByField(logs, 'category'),
        bySeverity: this.countByField(logs, 'severity'),
        byStatus: {
          success: logs.filter(l => l.details.success).length,
          failure: logs.filter(l => !l.details.success).length
        }
      },
      security: {
        authenticationFailures: logs.filter(l => 
          l.category === 'authentication' && !l.details.success
        ).length,
        authorizationFailures: logs.filter(l => 
          l.category === 'authorization' && !l.details.success
        ).length,
        suspiciousActivities: logs.filter(l => 
          l.category === 'security' && l.action === 'suspicious_activity'
        ).length,
        blockedRequests: logs.filter(l => 
          l.category === 'security' && l.action === 'blocked_request'
        ).length,
        dataBreachAttempts: logs.filter(l => 
          l.category === 'security' && ['attack_detected', 'fraud_detected'].includes(l.action)
        ).length
      },
      financial: {
        transactionVolume: logs.filter(l => l.category === 'financial').length,
        transactionValue: logs
          .filter(l => l.category === 'financial')
          .reduce((sum, l) => sum + (l.details.metadata?.amount || 0), 0),
        failedTransactions: logs.filter(l => 
          l.category === 'financial' && !l.details.success
        ).length,
        disputedTransactions: logs.filter(l => 
          l.category === 'financial' && l.action === 'dispute'
        ).length,
        fraudulentTransactions: logs.filter(l => 
          l.category === 'security' && l.action === 'fraud_detected'
        ).length
      },
      users: {
        activeUsers: new Set(logs.map(l => l.actor.id).filter(Boolean)).size,
        newRegistrations: logs.filter(l => 
          l.category === 'user_action' && l.action === 'register'
        ).length,
        suspiciousUsers: new Set(
          logs.filter(l => l.category === 'security')
            .map(l => l.actor.id)
            .filter(Boolean)
        ).size,
        blockedUsers: logs.filter(l => 
          l.category === 'security' && l.action === 'user_blocked'
        ).length
      },
      performance: {
        averageResponseTime: this.calculateAverageResponseTime(logs),
        slowRequests: logs.filter(l => 
          (l.context.responseTime || 0) > 5000
        ).length,
        systemErrors: logs.filter(l => 
          l.category === 'system' && l.severity === 'error'
        ).length,
        uptime: this.calculateUptime(logs)
      }
    };
  }

  async exportLogs(
    filter: AuditQueryFilter,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    const logs = await this.queryLogs(filter);
    
    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      case 'csv':
        return this.convertToCSV(logs);
      case 'xml':
        return this.convertToXML(logs);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async verifyLogIntegrity(logId?: string): Promise<{
    valid: boolean;
    tamperedEntries: string[];
    message: string;
  }> {
    try {
      const logs = logId 
        ? await this.queryLogs({ limit: 1 }) // Would need to implement ID-based query
        : await this.queryLogs({});

      const tamperedEntries: string[] = [];

      for (const log of logs) {
        const logWithoutSignature: Omit<AuditLogEntry, 'signature'> = {
          id: log.id,
          timestamp: log.timestamp,
          category: log.category,
          action: log.action,
          severity: log.severity,
          actor: log.actor,
          target: log.target,
          details: log.details,
          context: log.context,
          compliance: log.compliance
        };
        const expectedSignature = this.calculateSignature(logWithoutSignature);
        if (expectedSignature !== log.signature) {
          tamperedEntries.push(log.id);
        }
      }

      return {
        valid: tamperedEntries.length === 0,
        tamperedEntries,
        message: tamperedEntries.length === 0 
          ? 'All log entries are valid'
          : `${tamperedEntries.length} tampered entries detected`
      };
    } catch (error) {
      return {
        valid: false,
        tamperedEntries: [],
        message: `Integrity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private methods

  private async initializeAuditSystem(): Promise<void> {
    try {
      await fs.mkdir(this.LOG_DIRECTORY, { recursive: true });
      await this.logSystemEvent('startup', 'Audit logging system initialized', true);
    } catch (error) {
      console.error('Failed to initialize audit system:', error);
    }
  }

  private loadComplianceRules(): void {
    this.complianceRules = [
      {
        id: 'gdpr-data-access',
        name: 'GDPR Data Access Logging',
        description: 'Log all personal data access for GDPR compliance',
        regulation: 'GDPR',
        trigger: {
          categories: ['data_access'],
          actions: ['read', 'update', 'delete'],
          conditions: { containsPII: true }
        },
        requirements: {
          dataRetention: 2555, // 7 years
          encryptionRequired: true,
          accessControls: ['admin', 'compliance_officer'],
          notifications: ['dpo@company.com']
        },
        monitoring: {
          alertThreshold: 100,
          reportingFrequency: 'monthly',
          stakeholders: ['dpo@company.com', 'security@company.com']
        }
      },
      {
        id: 'pci-financial-transactions',
        name: 'PCI-DSS Financial Transaction Logging',
        description: 'Log all financial transactions for PCI-DSS compliance',
        regulation: 'PCI-DSS',
        trigger: {
          categories: ['financial'],
          actions: ['initiate', 'authorize', 'capture', 'refund'],
          conditions: {}
        },
        requirements: {
          dataRetention: 365, // 1 year minimum
          encryptionRequired: true,
          accessControls: ['admin', 'finance', 'security'],
          notifications: ['security@company.com']
        },
        monitoring: {
          alertThreshold: 50,
          reportingFrequency: 'daily',
          stakeholders: ['ciso@company.com', 'cfo@company.com']
        }
      }
    ];
  }

  private startPeriodicTasks(): void {
    // Buffer flush interval
    setInterval(() => {
      this.flushBuffer();
    }, this.FLUSH_INTERVAL);

    // Retention cleanup
    setInterval(() => {
      this.cleanupExpiredLogs();
    }, this.RETENTION_CHECK_INTERVAL);

    // File rotation check
    setInterval(() => {
      this.checkFileRotation();
    }, 60 * 60 * 1000); // Every hour
  }

  private calculateSignature(entry: Omit<AuditLogEntry, 'signature'>): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      category: entry.category,
      action: entry.action,
      actor: entry.actor,
      target: entry.target,
      details: entry.details
    });

    return crypto.createHmac('sha256', this.signingKey)
      .update(data)
      .digest('hex');
  }

  private determineSeverity(
    category: string,
    action: string,
    success: boolean
  ): AuditLogEntry['severity'] {
    if (category === 'security' && !success) return 'critical';
    if (category === 'financial' && !success) return 'error';
    if (category === 'authentication' && !success) return 'warning';
    if (category === 'system' && !success) return 'error';
    return 'info';
  }

  private determineComplianceRequirements(
    category: string,
    action: string,
    target?: AuditLogEntry['target']
  ): AuditLogEntry['compliance'] {
    const regulations: string[] = [];
    const dataTypes: string[] = [];
    let retentionDays = 365; // Default 1 year

    // GDPR requirements
    if (category === 'data_access' || category === 'user_action') {
      regulations.push('GDPR');
      dataTypes.push('PII');
      retentionDays = Math.max(retentionDays, 2555); // 7 years
    }

    // PCI-DSS requirements
    if (category === 'financial') {
      regulations.push('PCI-DSS');
      dataTypes.push('financial');
      retentionDays = Math.max(retentionDays, 365); // 1 year minimum
    }

    // SOX requirements for admin actions
    if (category === 'admin' || category === 'system') {
      regulations.push('SOX');
      retentionDays = Math.max(retentionDays, 2555); // 7 years
    }

    return {
      regulations,
      dataTypes,
      retention: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
    };
  }

  private async checkComplianceRules(entry: AuditLogEntry): Promise<void> {
    for (const rule of this.complianceRules) {
      if (this.matchesComplianceRule(entry, rule)) {
        // Check if alert threshold is exceeded
        const recentLogs = await this.queryLogs({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          categories: rule.trigger.categories
        });

        if (recentLogs.length >= rule.monitoring.alertThreshold) {
          await this.sendComplianceAlert(rule, recentLogs.length);
        }
      }
    }
  }

  private matchesComplianceRule(entry: AuditLogEntry, rule: ComplianceRule): boolean {
    return rule.trigger.categories.includes(entry.category) &&
           rule.trigger.actions.includes(entry.action);
  }

  private async sendComplianceAlert(rule: ComplianceRule, count: number): Promise<void> {
    const alertMessage = `Compliance alert for ${rule.regulation}: ${count} events in 24 hours (threshold: ${rule.monitoring.alertThreshold})`;
    
    await this.logSystemEvent(
      'error',
      alertMessage,
      true,
      { rule: rule.id, count, threshold: rule.monitoring.alertThreshold }
    );

    // In production, send actual notifications to stakeholders
    console.warn('Compliance Alert:', alertMessage);
  }

  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const logs = [...this.logBuffer];
      this.logBuffer = [];

      const fileName = `audit_${new Date().toISOString().split('T')[0]}.jsonl`;
      const filePath = path.join(this.LOG_DIRECTORY, fileName);

      const logLines = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
      
      await fs.appendFile(filePath, logLines, 'utf8');
    } catch (error) {
      console.error('Error flushing audit log buffer:', error);
      // Restore logs to buffer for retry
      this.logBuffer.unshift(...this.logBuffer);
    }
  }

  private async loadLogsFromFiles(filter: AuditQueryFilter): Promise<AuditLogEntry[]> {
    const logs: AuditLogEntry[] = [];
    
    try {
      const files = await fs.readdir(this.LOG_DIRECTORY);
      const logFiles = files.filter(f => f.startsWith('audit_') && f.endsWith('.jsonl'));

      for (const file of logFiles) {
        const filePath = path.join(this.LOG_DIRECTORY, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        const lines = content.trim().split('\n').filter(line => line);
        for (const line of lines) {
          try {
            const log = JSON.parse(line);
            log.timestamp = new Date(log.timestamp);
            log.compliance.retention = new Date(log.compliance.retention);
            logs.push(log);
          } catch (parseError) {
            console.error('Error parsing log line:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading logs from files:', error);
    }

    return logs;
  }

  private filterLogs(logs: AuditLogEntry[], filter: AuditQueryFilter): AuditLogEntry[] {
    let filtered = logs;

    if (filter.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
    }

    if (filter.categories?.length) {
      filtered = filtered.filter(log => filter.categories!.includes(log.category));
    }

    if (filter.actions?.length) {
      filtered = filtered.filter(log => filter.actions!.includes(log.action));
    }

    if (filter.severities?.length) {
      filtered = filtered.filter(log => filter.severities!.includes(log.severity));
    }

    if (filter.actorIds?.length) {
      filtered = filtered.filter(log => 
        log.actor.id && filter.actorIds!.includes(log.actor.id));
    }

    if (filter.targetIds?.length) {
      filtered = filtered.filter(log => 
        log.target?.id && filter.targetIds!.includes(log.target.id));
    }

    if (filter.success !== undefined) {
      filtered = filtered.filter(log => log.details.success === filter.success);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit and offset
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  private generateSummary(logs: AuditLogEntry[]): AuditReport['summary'] {
    return {
      totalEvents: logs.length,
      eventsByCategory: this.countByField(logs, 'category'),
      eventsBySeverity: this.countByField(logs, 'severity'),
      successRate: logs.length > 0 
        ? logs.filter(l => l.details.success).length / logs.length 
        : 0,
      uniqueUsers: new Set(logs.map(l => l.actor.id).filter(Boolean)).size,
      criticalEvents: logs.filter(l => l.severity === 'critical').length
    };
  }

  private async generateFindings(logs: AuditLogEntry[]): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Detect authentication anomalies
    const authFailures = logs.filter(l => 
      l.category === 'authentication' && !l.details.success
    );

    if (authFailures.length > 10) {
      findings.push({
        type: 'security_incident',
        severity: 'high',
        title: 'High Authentication Failure Rate',
        description: `${authFailures.length} authentication failures detected`,
        evidence: authFailures.map(l => l.id),
        impact: 'Potential brute force attack or credential compromise',
        recommendation: 'Review failed login attempts and consider implementing additional security measures'
      });
    }

    // Detect unusual data access patterns
    const dataAccessLogs = logs.filter(l => l.category === 'data_access');
    const userAccessCounts = new Map<string, number>();
    
    for (const log of dataAccessLogs) {
      if (log.actor.id) {
        userAccessCounts.set(log.actor.id, (userAccessCounts.get(log.actor.id) || 0) + 1);
      }
    }

    for (const [userId, count] of userAccessCounts.entries()) {
      if (count > 100) { // Threshold for unusual access
        findings.push({
          type: 'anomaly',
          severity: 'medium',
          title: 'Unusual Data Access Pattern',
          description: `User ${userId} accessed data ${count} times`,
          evidence: logs.filter(l => l.actor.id === userId).map(l => l.id),
          impact: 'Potential data exfiltration or unauthorized access',
          recommendation: 'Review user activity and validate business justification'
        });
      }
    }

    // Check compliance violations
    const gdprLogs = logs.filter(l => 
      l.compliance.regulations.includes('GDPR') &&
      l.category === 'data_access' &&
      !l.details.success
    );

    if (gdprLogs.length > 0) {
      findings.push({
        type: 'compliance_violation',
        severity: 'high',
        title: 'GDPR Compliance Issues',
        description: `${gdprLogs.length} failed data access attempts on personal data`,
        evidence: gdprLogs.map(l => l.id),
        impact: 'Potential GDPR violation and regulatory penalties',
        recommendation: 'Investigate failed access attempts and ensure proper data protection controls'
      });
    }

    return findings;
  }

  private generateRecommendations(logs: AuditLogEntry[]): string[] {
    const recommendations: string[] = [];

    const failureRate = logs.filter(l => !l.details.success).length / logs.length;
    if (failureRate > 0.1) {
      recommendations.push('High failure rate detected. Review system stability and error handling.');
    }

    const securityEvents = logs.filter(l => l.category === 'security');
    if (securityEvents.length > 0) {
      recommendations.push('Security events detected. Review security controls and monitoring.');
    }

    const criticalEvents = logs.filter(l => l.severity === 'critical');
    if (criticalEvents.length > 0) {
      recommendations.push('Critical events detected. Implement immediate response procedures.');
    }

    const slowRequests = logs.filter(l => (l.context.responseTime || 0) > 5000);
    if (slowRequests.length > logs.length * 0.05) {
      recommendations.push('High number of slow requests. Review system performance and optimization.');
    }

    return recommendations;
  }

  private async saveReport(report: AuditReport): Promise<void> {
    try {
      const reportPath = path.join(this.LOG_DIRECTORY, 'reports', `${report.id}.json`);
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Error saving audit report:', error);
    }
  }

  private countByField(logs: AuditLogEntry[], field: keyof AuditLogEntry): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const log of logs) {
      const value = log[field] as string;
      counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
  }

  private calculateAverageResponseTime(logs: AuditLogEntry[]): number {
    const responseTimes = logs
      .map(l => l.context.responseTime)
      .filter((time): time is number => time !== undefined);
    
    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
  }

  private calculateUptime(logs: AuditLogEntry[]): number {
    const systemLogs = logs.filter(l => l.category === 'system');
    const errorLogs = systemLogs.filter(l => l.severity === 'error');
    
    // Simple uptime calculation based on error ratio
    return systemLogs.length > 0
      ? Math.max(0, 1 - (errorLogs.length / systemLogs.length))
      : 1;
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    const headers = [
      'id', 'timestamp', 'category', 'action', 'severity',
      'actor_type', 'actor_id', 'actor_ip',
      'target_type', 'target_id',
      'success', 'description', 'error_message'
    ];

    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.category,
      log.action,
      log.severity,
      log.actor.type,
      log.actor.id || '',
      log.actor.ip,
      log.target?.type || '',
      log.target?.id || '',
      log.details.success.toString(),
      log.details.description,
      log.details.errorMessage || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private convertToXML(logs: AuditLogEntry[]): string {
    const escapeXml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const logElements = logs.map(log => `
    <log>
      <id>${log.id}</id>
      <timestamp>${log.timestamp.toISOString()}</timestamp>
      <category>${log.category}</category>
      <action>${log.action}</action>
      <severity>${log.severity}</severity>
      <actor>
        <type>${log.actor.type}</type>
        <id>${log.actor.id || ''}</id>
        <ip>${log.actor.ip}</ip>
      </actor>
      <target>
        <type>${log.target?.type || ''}</type>
        <id>${log.target?.id || ''}</id>
      </target>
      <details>
        <success>${log.details.success}</success>
        <description>${escapeXml(log.details.description)}</description>
        <errorMessage>${escapeXml(log.details.errorMessage || '')}</errorMessage>
      </details>
    </log>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<auditLogs>
  ${logElements}
</auditLogs>`;
  }

  private async cleanupExpiredLogs(): Promise<void> {
    try {
      const now = new Date();
      const logs = await this.loadLogsFromFiles({});
      
      const expiredLogs = logs.filter(log => log.compliance.retention <= now);
      
      if (expiredLogs.length > 0) {
        console.log(`Cleaning up ${expiredLogs.length} expired log entries`);
        // In production, implement actual cleanup logic
      }
    } catch (error) {
      console.error('Error during log cleanup:', error);
    }
  }

  private async checkFileRotation(): Promise<void> {
    try {
      const files = await fs.readdir(this.LOG_DIRECTORY);
      
      for (const file of files) {
        if (file.startsWith('audit_') && file.endsWith('.jsonl')) {
          const filePath = path.join(this.LOG_DIRECTORY, file);
          const stats = await fs.stat(filePath);
          
          if (stats.size > this.MAX_FILE_SIZE) {
            // Rotate file
            const newName = file.replace('.jsonl', `_${Date.now()}.jsonl`);
            await fs.rename(filePath, path.join(this.LOG_DIRECTORY, newName));
            console.log(`Rotated log file: ${file} -> ${newName}`);
          }
        }
      }
    } catch (error) {
      console.error('Error during file rotation:', error);
    }
  }

  // ID generators
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SecurityAuditLogger;