export interface Dispute {
  id: string;
  transactionId: string;
  reportedBy: string; // userId
  againstUser: string; // userId
  type: 'book_condition' | 'late_return' | 'damage' | 'payment_issue' | 'fraud' | 'policy_violation' | 'other';
  status: 'open' | 'investigating' | 'mediation' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'financial' | 'book_quality' | 'delivery' | 'behavior' | 'policy' | 'technical';
  
  // Dispute Details
  title: string;
  description: string;
  evidence: Evidence[];
  timeline: DisputeEvent[];
  
  // Resolution
  resolution?: DisputeResolution;
  mediator?: {
    userId: string;
    name: string;
    assignedAt: Date;
  };
  
  // Financial Impact
  disputedAmount: number;
  escrowHeld: boolean;
  refundAmount?: number;
  penaltyAmount?: number;
  
  // Tracking
  createdAt: Date;
  lastUpdated: Date;
  resolvedAt?: Date;
  autoEscalateAt?: Date;
  
  // Communication
  messages: DisputeMessage[];
  notifications: DisputeNotification[];
  
  // System
  metadata: {
    ip?: string;
    userAgent?: string;
    severity: number; // 1-10 scale
    autoResolved: boolean;
    requiresManualReview: boolean;
  };
}

export interface Evidence {
  id: string;
  type: 'photo' | 'document' | 'video' | 'audio' | 'screenshot' | 'receipt' | 'correspondence';
  url: string;
  description: string;
  uploadedBy: string;
  uploadedAt: Date;
  verified: boolean;
  metadata?: {
    filename?: string;
    size?: number;
    mimeType?: string;
    hash?: string;
  };
}

export interface DisputeEvent {
  id: string;
  type: 'created' | 'updated' | 'evidence_added' | 'status_changed' | 'message_sent' | 'resolved' | 'escalated' | 'mediation_started' | 'admin_intervention';
  performedBy: string;
  timestamp: Date;
  description: string;
  previousValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

export interface DisputeMessage {
  id: string;
  senderId: string;
  recipientId?: string; // If null, message is public to all parties
  content: string;
  attachments?: string[];
  sentAt: Date;
  readBy: { userId: string; readAt: Date }[];
  isInternal: boolean; // Admin/mediator notes
}

export interface DisputeNotification {
  id: string;
  userId: string;
  type: 'dispute_created' | 'status_update' | 'message_received' | 'evidence_requested' | 'resolution_proposed' | 'resolved';
  title: string;
  message: string;
  sentAt: Date;
  readAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
}

export interface DisputeResolution {
  id: string;
  type: 'refund' | 'replacement' | 'partial_refund' | 'penalty' | 'warning' | 'account_suspension' | 'no_action';
  description: string;
  decidedBy: string;
  decidedAt: Date;
  financialAdjustments: {
    refundToBuyer?: number;
    refundToSeller?: number;
    penaltyToBuyer?: number;
    penaltyToSeller?: number;
    platformFeeAdjustment?: number;
  };
  actions: ResolutionAction[];
  acceptedBy: { userId: string; acceptedAt: Date }[];
  appealDeadline?: Date;
}

export interface ResolutionAction {
  id: string;
  type: 'process_refund' | 'issue_penalty' | 'suspend_account' | 'send_warning' | 'update_reputation' | 'escalate_to_admin';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  scheduledAt?: Date;
  executedAt?: Date;
  result?: any;
}

export class DisputeResolutionWorkflow {
  private disputes: Map<string, Dispute> = new Map();
  private readonly AUTO_ESCALATION_HOURS = 72; // 3 days
  private readonly MEDIATION_TIMEOUT_HOURS = 168; // 7 days
  private readonly EVIDENCE_SUBMISSION_HOURS = 48; // 2 days

  async createDispute(
    transactionId: string,
    reportedBy: string,
    againstUser: string,
    disputeDetails: {
      type: Dispute['type'];
      title: string;
      description: string;
      disputedAmount: number;
      evidence?: Omit<Evidence, 'id' | 'uploadedBy' | 'uploadedAt' | 'verified'>[];
    },
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<Dispute> {
    const disputeId = this.generateDisputeId();
    const now = new Date();

    // Calculate severity and priority
    const severity = this.calculateDisputeSeverity(disputeDetails);
    const priority = this.determinePriority(disputeDetails, severity);

    const dispute: Dispute = {
      id: disputeId,
      transactionId,
      reportedBy,
      againstUser,
      type: disputeDetails.type,
      status: 'open',
      priority,
      category: this.categorizeDispute(disputeDetails.type),
      title: disputeDetails.title,
      description: disputeDetails.description,
      evidence: [],
      timeline: [],
      disputedAmount: disputeDetails.disputedAmount,
      escrowHeld: false,
      createdAt: now,
      lastUpdated: now,
      autoEscalateAt: new Date(now.getTime() + this.AUTO_ESCALATION_HOURS * 60 * 60 * 1000),
      messages: [],
      notifications: [],
      metadata: {
        ip: metadata?.ip,
        userAgent: metadata?.userAgent,
        severity,
        autoResolved: false,
        requiresManualReview: severity >= 7 || disputeDetails.disputedAmount > 500
      }
    };

    // Add evidence if provided
    if (disputeDetails.evidence) {
      for (const evidenceData of disputeDetails.evidence) {
        await this.addEvidence(dispute, evidenceData, reportedBy);
      }
    }

    // Add creation event
    await this.addDisputeEvent(dispute, 'created', reportedBy, 'Dispute created');

    // Hold escrow if financial dispute
    if (this.isFinancialDispute(dispute)) {
      dispute.escrowHeld = true;
      await this.addDisputeEvent(dispute, 'updated', 'system', 'Escrow funds held pending resolution');
    }

    // Send notifications
    await this.sendNotification(dispute, againstUser, 'dispute_created', 
      'New Dispute Filed', 'A dispute has been filed regarding your transaction');
    
    await this.sendNotification(dispute, reportedBy, 'dispute_created', 
      'Dispute Created', 'Your dispute has been created and is under review');

    // Check for immediate automatic resolution
    const autoResolution = await this.attemptAutomaticResolution(dispute);
    if (autoResolution) {
      dispute.resolution = autoResolution;
      dispute.status = 'resolved';
      dispute.resolvedAt = new Date();
      dispute.metadata.autoResolved = true;
    }

    this.disputes.set(disputeId, dispute);
    return dispute;
  }

  async addEvidence(
    dispute: Dispute,
    evidenceData: Omit<Evidence, 'id' | 'uploadedBy' | 'uploadedAt' | 'verified'>,
    uploadedBy: string
  ): Promise<Evidence> {
    const evidence: Evidence = {
      id: this.generateEvidenceId(),
      ...evidenceData,
      uploadedBy,
      uploadedAt: new Date(),
      verified: false
    };

    dispute.evidence.push(evidence);
    dispute.lastUpdated = new Date();

    await this.addDisputeEvent(dispute, 'evidence_added', uploadedBy, 
      `Evidence added: ${evidence.type}`);

    // Verify evidence automatically if possible
    await this.verifyEvidence(evidence);

    return evidence;
  }

  async updateDisputeStatus(
    disputeId: string,
    newStatus: Dispute['status'],
    updatedBy: string,
    reason?: string
  ): Promise<boolean> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return false;

    const oldStatus = dispute.status;
    dispute.status = newStatus;
    dispute.lastUpdated = new Date();

    await this.addDisputeEvent(dispute, 'status_changed', updatedBy, 
      `Status changed from ${oldStatus} to ${newStatus}${reason ? ': ' + reason : ''}`);

    // Handle status-specific logic
    switch (newStatus) {
      case 'investigating':
        await this.startInvestigation(dispute);
        break;
      case 'mediation':
        await this.startMediation(dispute);
        break;
      case 'escalated':
        await this.escalateToAdmin(dispute);
        break;
      case 'resolved':
        dispute.resolvedAt = new Date();
        await this.processResolution(dispute);
        break;
      case 'closed':
        await this.closeDispute(dispute);
        break;
    }

    return true;
  }

  async proposeResolution(
    disputeId: string,
    proposedBy: string,
    resolution: Omit<DisputeResolution, 'id' | 'decidedBy' | 'decidedAt' | 'acceptedBy' | 'actions'>
  ): Promise<DisputeResolution> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const resolutionId = this.generateResolutionId();
    const fullResolution: DisputeResolution = {
      id: resolutionId,
      ...resolution,
      decidedBy: proposedBy,
      decidedAt: new Date(),
      acceptedBy: [],
      actions: this.createResolutionActions(resolution)
    };

    dispute.resolution = fullResolution;
    dispute.lastUpdated = new Date();

    await this.addDisputeEvent(dispute, 'updated', proposedBy, 'Resolution proposed');

    // Notify parties about proposed resolution
    await this.sendNotification(dispute, dispute.reportedBy, 'resolution_proposed',
      'Resolution Proposed', 'A resolution has been proposed for your dispute');
    
    await this.sendNotification(dispute, dispute.againstUser, 'resolution_proposed',
      'Resolution Proposed', 'A resolution has been proposed for the dispute against you');

    return fullResolution;
  }

  async acceptResolution(
    disputeId: string,
    userId: string
  ): Promise<boolean> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute || !dispute.resolution) return false;

    // Check if user hasn't already accepted
    if (dispute.resolution.acceptedBy.some(a => a.userId === userId)) {
      return true; // Already accepted
    }

    dispute.resolution.acceptedBy.push({
      userId,
      acceptedAt: new Date()
    });

    await this.addDisputeEvent(dispute, 'updated', userId, 'Resolution accepted');

    // Check if all parties have accepted
    const requiredParties = [dispute.reportedBy, dispute.againstUser];
    const allAccepted = requiredParties.every(partyId =>
      dispute.resolution!.acceptedBy.some(a => a.userId === partyId)
    );

    if (allAccepted) {
      dispute.status = 'resolved';
      dispute.resolvedAt = new Date();
      await this.processResolution(dispute);
    }

    return true;
  }

  async sendMessage(
    disputeId: string,
    senderId: string,
    content: string,
    recipientId?: string,
    attachments?: string[]
  ): Promise<DisputeMessage> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const message: DisputeMessage = {
      id: this.generateMessageId(),
      senderId,
      recipientId,
      content,
      attachments,
      sentAt: new Date(),
      readBy: [],
      isInternal: false
    };

    dispute.messages.push(message);
    dispute.lastUpdated = new Date();

    await this.addDisputeEvent(dispute, 'message_sent', senderId, 'Message sent');

    // Send notification to recipient(s)
    const recipients = recipientId ? [recipientId] : [dispute.reportedBy, dispute.againstUser];
    for (const recipient of recipients) {
      if (recipient !== senderId) {
        await this.sendNotification(dispute, recipient, 'message_received',
          'New Message', 'You have received a new message in your dispute');
      }
    }

    return message;
  }

  async escalateToAdmin(dispute: Dispute): Promise<void> {
    dispute.status = 'escalated';
    dispute.priority = 'high';
    dispute.metadata.requiresManualReview = true;

    await this.addDisputeEvent(dispute, 'escalated', 'system', 'Escalated to admin review');

    // Assign to available admin
    const availableAdmin = await this.getAvailableAdmin();
    if (availableAdmin) {
      dispute.mediator = {
        userId: availableAdmin.id,
        name: availableAdmin.name,
        assignedAt: new Date()
      };
    }

    // Send admin notification
    await this.notifyAdmins(dispute);
  }

  private async attemptAutomaticResolution(dispute: Dispute): Promise<DisputeResolution | null> {
    // Auto-resolve simple cases
    if (dispute.type === 'late_return' && dispute.disputedAmount <= 10) {
      return {
        id: this.generateResolutionId(),
        type: 'penalty',
        description: 'Automatic late return fee applied',
        decidedBy: 'system',
        decidedAt: new Date(),
        financialAdjustments: {
          penaltyToBuyer: dispute.disputedAmount
        },
        acceptedBy: [],
        actions: []
      };
    }

    // Auto-resolve if clear evidence exists
    if (dispute.evidence.length >= 3 && dispute.evidence.every(e => e.verified)) {
      const evidenceSupportsReporter = this.analyzeEvidence(dispute.evidence);
      if (evidenceSupportsReporter !== null) {
        return {
          id: this.generateResolutionId(),
          type: evidenceSupportsReporter ? 'refund' : 'no_action',
          description: 'Automatic resolution based on evidence analysis',
          decidedBy: 'system',
          decidedAt: new Date(),
          financialAdjustments: evidenceSupportsReporter ? {
            refundToBuyer: dispute.disputedAmount
          } : {},
          acceptedBy: [],
          actions: []
        };
      }
    }

    return null;
  }

  private async startInvestigation(dispute: Dispute): Promise<void> {
    // Request additional evidence if needed
    if (dispute.evidence.length < 2) {
      await this.requestEvidence(dispute);
    }

    // Set investigation timeline
    dispute.autoEscalateAt = new Date(Date.now() + this.EVIDENCE_SUBMISSION_HOURS * 60 * 60 * 1000);

    await this.sendNotification(dispute, dispute.reportedBy, 'status_update',
      'Investigation Started', 'Your dispute is now under investigation');
  }

  private async startMediation(dispute: Dispute): Promise<void> {
    // Assign mediator
    const mediator = await this.getAvailableMediator();
    if (mediator) {
      dispute.mediator = {
        userId: mediator.id,
        name: mediator.name,
        assignedAt: new Date()
      };

      await this.addDisputeEvent(dispute, 'mediation_started', mediator.id, 'Mediation started');

      // Set mediation timeout
      dispute.autoEscalateAt = new Date(Date.now() + this.MEDIATION_TIMEOUT_HOURS * 60 * 60 * 1000);

      // Notify parties
      await this.sendNotification(dispute, dispute.reportedBy, 'status_update',
        'Mediation Started', `${mediator.name} has been assigned as your mediator`);
      
      await this.sendNotification(dispute, dispute.againstUser, 'status_update',
        'Mediation Started', `${mediator.name} has been assigned as mediator for this dispute`);
    }
  }

  private async processResolution(dispute: Dispute): Promise<void> {
    if (!dispute.resolution) return;

    // Execute resolution actions
    for (const action of dispute.resolution.actions) {
      await this.executeResolutionAction(dispute, action);
    }

    // Process financial adjustments
    await this.processFinancialAdjustments(dispute, dispute.resolution.financialAdjustments);

    // Release escrow if held
    if (dispute.escrowHeld) {
      dispute.escrowHeld = false;
      await this.addDisputeEvent(dispute, 'updated', 'system', 'Escrow released');
    }

    // Send final notifications
    await this.sendNotification(dispute, dispute.reportedBy, 'resolved',
      'Dispute Resolved', 'Your dispute has been resolved');
    
    await this.sendNotification(dispute, dispute.againstUser, 'resolved',
      'Dispute Resolved', 'The dispute against you has been resolved');
  }

  private async closeDispute(dispute: Dispute): Promise<void> {
    dispute.resolvedAt = new Date();
    
    // Archive messages and cleanup
    await this.archiveDisputeData(dispute);
    
    await this.addDisputeEvent(dispute, 'updated', 'system', 'Dispute closed');
  }

  // Helper methods
  private calculateDisputeSeverity(details: any): number {
    let severity = 3; // Base severity

    // Increase severity based on amount
    if (details.disputedAmount > 100) severity += 2;
    if (details.disputedAmount > 500) severity += 2;

    // Increase severity based on type
    const highSeverityTypes = ['fraud', 'payment_issue'];
    if (highSeverityTypes.includes(details.type)) severity += 3;

    return Math.min(severity, 10);
  }

  private determinePriority(details: any, severity: number): Dispute['priority'] {
    if (severity >= 8 || details.disputedAmount > 1000) return 'critical';
    if (severity >= 6 || details.disputedAmount > 200) return 'high';
    if (severity >= 4 || details.disputedAmount > 50) return 'medium';
    return 'low';
  }

  private categorizeDispute(type: Dispute['type']): Dispute['category'] {
    const categoryMap: Record<Dispute['type'], Dispute['category']> = {
      'book_condition': 'book_quality',
      'late_return': 'delivery',
      'damage': 'book_quality',
      'payment_issue': 'financial',
      'fraud': 'policy',
      'policy_violation': 'policy',
      'other': 'technical'
    };
    return categoryMap[type];
  }

  private isFinancialDispute(dispute: Dispute): boolean {
    return dispute.category === 'financial' || dispute.disputedAmount > 0;
  }

  private analyzeEvidence(evidence: Evidence[]): boolean | null {
    // Simplified evidence analysis - in production, use AI/ML
    const positiveEvidence = evidence.filter(e => 
      e.description.toLowerCase().includes('damaged') ||
      e.description.toLowerCase().includes('wrong') ||
      e.type === 'photo'
    ).length;

    if (positiveEvidence >= 2) return true;
    if (evidence.length >= 3 && positiveEvidence === 0) return false;
    return null; // Inconclusive
  }

  private createResolutionActions(resolution: Omit<DisputeResolution, 'id' | 'decidedBy' | 'decidedAt' | 'acceptedBy' | 'actions'>): ResolutionAction[] {
    const actions: ResolutionAction[] = [];

    if (resolution.financialAdjustments.refundToBuyer) {
      actions.push({
        id: this.generateActionId(),
        type: 'process_refund',
        status: 'pending'
      });
    }

    if (resolution.financialAdjustments.penaltyToBuyer || resolution.financialAdjustments.penaltyToSeller) {
      actions.push({
        id: this.generateActionId(),
        type: 'issue_penalty',
        status: 'pending'
      });
    }

    return actions;
  }

  private async executeResolutionAction(dispute: Dispute, action: ResolutionAction): Promise<void> {
    action.status = 'in_progress';
    action.executedAt = new Date();

    try {
      switch (action.type) {
        case 'process_refund':
          // In production, integrate with payment processor
          console.log(`Processing refund for dispute ${dispute.id}`);
          break;
        case 'issue_penalty':
          // In production, process penalty
          console.log(`Issuing penalty for dispute ${dispute.id}`);
          break;
        case 'suspend_account':
          // In production, suspend user account
          console.log(`Suspending account for dispute ${dispute.id}`);
          break;
      }

      action.status = 'completed';
    } catch (error) {
      action.status = 'failed';
      action.result = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async processFinancialAdjustments(dispute: Dispute, adjustments: DisputeResolution['financialAdjustments']): Promise<void> {
    // In production, integrate with payment and escrow systems
    console.log(`Processing financial adjustments for dispute ${dispute.id}:`, adjustments);
  }

  private async verifyEvidence(evidence: Evidence): Promise<void> {
    // In production, implement evidence verification
    // For now, mark as verified after delay
    setTimeout(() => {
      evidence.verified = true;
    }, 1000);
  }

  private async requestEvidence(dispute: Dispute): Promise<void> {
    await this.sendNotification(dispute, dispute.reportedBy, 'evidence_requested',
      'Evidence Requested', 'Please provide additional evidence for your dispute');
  }

  private async getAvailableMediator(): Promise<{ id: string; name: string } | null> {
    // In production, fetch from mediator pool
    return { id: 'mediator_1', name: 'John Mediator' };
  }

  private async getAvailableAdmin(): Promise<{ id: string; name: string } | null> {
    // In production, fetch from admin pool
    return { id: 'admin_1', name: 'Admin Smith' };
  }

  private async notifyAdmins(dispute: Dispute): Promise<void> {
    console.log(`Notifying admins about escalated dispute ${dispute.id}`);
  }

  private async archiveDisputeData(dispute: Dispute): Promise<void> {
    // In production, archive dispute data for compliance
    console.log(`Archiving dispute data for ${dispute.id}`);
  }

  // Notification and event helpers
  private async addDisputeEvent(
    dispute: Dispute,
    type: DisputeEvent['type'],
    performedBy: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: DisputeEvent = {
      id: this.generateEventId(),
      type,
      performedBy,
      timestamp: new Date(),
      description,
      metadata
    };

    dispute.timeline.push(event);
  }

  private async sendNotification(
    dispute: Dispute,
    userId: string,
    type: DisputeNotification['type'],
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    const notification: DisputeNotification = {
      id: this.generateNotificationId(),
      userId,
      type,
      title,
      message,
      sentAt: new Date(),
      actionRequired: ['evidence_requested', 'resolution_proposed'].includes(type),
      actionUrl
    };

    dispute.notifications.push(notification);
  }

  // ID generators
  private generateDisputeId(): string {
    return `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEvidenceId(): string {
    return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResolutionId(): string {
    return `resolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public query methods
  getDispute(disputeId: string): Dispute | null {
    return this.disputes.get(disputeId) || null;
  }

  getDisputesByUser(userId: string): Dispute[] {
    return Array.from(this.disputes.values())
      .filter(d => d.reportedBy === userId || d.againstUser === userId);
  }

  getDisputesByTransaction(transactionId: string): Dispute[] {
    return Array.from(this.disputes.values())
      .filter(d => d.transactionId === transactionId);
  }

  getPendingDisputes(): Dispute[] {
    return Array.from(this.disputes.values())
      .filter(d => ['open', 'investigating', 'mediation', 'escalated'].includes(d.status));
  }

  getDisputeStats(): {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    avgResolutionTime: number;
  } {
    const disputes = Array.from(this.disputes.values());
    const resolved = disputes.filter(d => d.resolvedAt);
    
    const avgResolutionTime = resolved.length > 0 
      ? resolved.reduce((sum, d) => sum + (d.resolvedAt!.getTime() - d.createdAt.getTime()), 0) / resolved.length
      : 0;

    return {
      total: disputes.length,
      byStatus: this.groupByField(disputes, 'status'),
      byType: this.groupByField(disputes, 'type'),
      avgResolutionTime: avgResolutionTime / (1000 * 60 * 60) // Convert to hours
    };
  }

  private groupByField<T extends Record<string, any>>(items: T[], field: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = String(item[field]);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export default DisputeResolutionWorkflow;