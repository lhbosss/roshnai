import { EventEmitter } from 'events';

// Message batching and optimization system
export class MessageBatcher extends EventEmitter {
  private batches: Map<string, {
    messages: any[];
    priority: number;
    timestamp: number;
    timeout: NodeJS.Timeout | null;
  }> = new Map();
  
  private config = {
    maxBatchSize: 10,
    maxWaitTime: 100, // milliseconds
    priorityLevels: {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3
    }
  };

  constructor(options: Partial<typeof MessageBatcher.prototype.config> = {}) {
    super();
    this.config = { ...this.config, ...options };
  }

  /**
   * Add message to batch
   */
  addMessage(
    batchKey: string, 
    message: any, 
    priority: keyof typeof this.config.priorityLevels = 'normal'
  ): void {
    const priorityLevel = this.config.priorityLevels[priority];
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        messages: [],
        priority: priorityLevel,
        timestamp: Date.now(),
        timeout: null
      });
    }
    
    const batch = this.batches.get(batchKey)!;
    batch.messages.push({ ...message, priority: priorityLevel, timestamp: Date.now() });
    
    // Update batch priority to highest priority message
    if (priorityLevel < batch.priority) {
      batch.priority = priorityLevel;
    }
    
    // Check if we should flush immediately
    if (this.shouldFlushImmediately(batch)) {
      this.flushBatch(batchKey);
      return;
    }
    
    // Set timeout for batch if not already set
    if (!batch.timeout) {
      batch.timeout = setTimeout(() => {
        this.flushBatch(batchKey);
      }, this.getWaitTime(batch.priority));
    }
  }

  /**
   * Determine if batch should be flushed immediately
   */
  private shouldFlushImmediately(batch: { messages: any[]; priority: number }): boolean {
    return (
      batch.messages.length >= this.config.maxBatchSize ||
      batch.priority === this.config.priorityLevels.critical
    );
  }

  /**
   * Get wait time based on priority
   */
  private getWaitTime(priority: number): number {
    switch (priority) {
      case this.config.priorityLevels.critical:
        return 0;
      case this.config.priorityLevels.high:
        return this.config.maxWaitTime / 2;
      case this.config.priorityLevels.normal:
        return this.config.maxWaitTime;
      case this.config.priorityLevels.low:
        return this.config.maxWaitTime * 2;
      default:
        return this.config.maxWaitTime;
    }
  }

  /**
   * Flush a specific batch
   */
  flushBatch(batchKey: string): void {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.messages.length === 0) return;
    
    // Clear timeout
    if (batch.timeout) {
      clearTimeout(batch.timeout);
    }
    
    // Sort messages by priority and timestamp
    const sortedMessages = batch.messages.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.timestamp - b.timestamp;
    });
    
    // Emit batch
    this.emit('batch', {
      key: batchKey,
      messages: sortedMessages,
      priority: batch.priority,
      size: sortedMessages.length,
      age: Date.now() - batch.timestamp
    });
    
    // Remove batch
    this.batches.delete(batchKey);
  }

  /**
   * Flush all batches
   */
  flushAll(): void {
    const batchKeys = Array.from(this.batches.keys());
    batchKeys.forEach(key => this.flushBatch(key));
  }

  /**
   * Get batch statistics
   */
  getStats(): {
    totalBatches: number;
    totalMessages: number;
    averageBatchSize: number;
    oldestBatch: number;
  } {
    const now = Date.now();
    let totalMessages = 0;
    let oldestTimestamp = now;
    
    for (const batch of this.batches.values()) {
      totalMessages += batch.messages.length;
      if (batch.timestamp < oldestTimestamp) {
        oldestTimestamp = batch.timestamp;
      }
    }
    
    return {
      totalBatches: this.batches.size,
      totalMessages,
      averageBatchSize: this.batches.size > 0 ? totalMessages / this.batches.size : 0,
      oldestBatch: now - oldestTimestamp
    };
  }
}

// Connection pooling for database and external services
export class ConnectionPool<T> extends EventEmitter {
  private pool: T[] = [];
  private activeConnections: Set<T> = new Set();
  private maxSize: number;
  private minSize: number;
  private createConnection: () => Promise<T>;
  private validateConnection: (connection: T) => boolean;
  private destroyConnection: (connection: T) => Promise<void>;
  private waitQueue: Array<{
    resolve: (connection: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];

  constructor(options: {
    maxSize: number;
    minSize: number;
    createConnection: () => Promise<T>;
    validateConnection: (connection: T) => boolean;
    destroyConnection: (connection: T) => Promise<void>;
  }) {
    super();
    
    this.maxSize = options.maxSize;
    this.minSize = options.minSize;
    this.createConnection = options.createConnection;
    this.validateConnection = options.validateConnection;
    this.destroyConnection = options.destroyConnection;
    
    this.initializePool();
  }

  /**
   * Initialize the connection pool
   */
  private async initializePool(): Promise<void> {
    const connections = await Promise.all(
      Array.from({ length: this.minSize }, () => this.createConnection())
    );
    
    this.pool.push(...connections);
    this.emit('initialized', { size: this.pool.length });
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(timeout: number = 5000): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        const index = this.waitQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Connection acquisition timeout'));
      }, timeout);

      // Try to get available connection
      const connection = await this.getAvailableConnection();
      if (connection) {
        clearTimeout(timeoutHandle);
        this.activeConnections.add(connection);
        resolve(connection);
        return;
      }

      // Add to wait queue
      this.waitQueue.push({
        resolve,
        reject,
        timeout: timeoutHandle
      });
    });
  }

  /**
   * Get available connection from pool
   */
  private async getAvailableConnection(): Promise<T | null> {
    // Check for valid connections in pool
    while (this.pool.length > 0) {
      const connection = this.pool.pop()!;
      
      if (this.validateConnection(connection)) {
        return connection;
      } else {
        // Connection is invalid, destroy it
        try {
          await this.destroyConnection(connection);
        } catch (error) {
          this.emit('error', error);
        }
      }
    }

    // Try to create new connection if under max size
    if (this.activeConnections.size + this.pool.length < this.maxSize) {
      try {
        return await this.createConnection();
      } catch (error) {
        this.emit('error', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Release connection back to pool
   */
  async release(connection: T): Promise<void> {
    this.activeConnections.delete(connection);
    
    // Check if there are waiting requests
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()!;
      clearTimeout(waiter.timeout);
      
      if (this.validateConnection(connection)) {
        this.activeConnections.add(connection);
        waiter.resolve(connection);
        return;
      } else {
        try {
          await this.destroyConnection(connection);
        } catch (error) {
          this.emit('error', error);
        }
        waiter.reject(new Error('Connection became invalid'));
        return;
      }
    }
    
    // Return to pool if valid and not exceeding max size
    if (this.validateConnection(connection) && this.pool.length < this.maxSize) {
      this.pool.push(connection);
    } else {
      try {
        await this.destroyConnection(connection);
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Execute operation with automatic connection management
   */
  async execute<R>(operation: (connection: T) => Promise<R>): Promise<R> {
    const connection = await this.acquire();
    
    try {
      const result = await operation(connection);
      await this.release(connection);
      return result;
    } catch (error) {
      await this.release(connection);
      throw error;
    }
  }

  /**
   * Drain the pool (close all connections)
   */
  async drain(): Promise<void> {
    // Reject all waiting requests
    for (const waiter of this.waitQueue) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Connection pool is draining'));
    }
    this.waitQueue = [];
    
    // Close all pooled connections
    await Promise.all(this.pool.map(conn => this.destroyConnection(conn)));
    this.pool = [];
    
    // Close all active connections
    await Promise.all(
      Array.from(this.activeConnections).map(conn => this.destroyConnection(conn))
    );
    this.activeConnections.clear();
    
    this.emit('drained');
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    poolSize: number;
    activeConnections: number;
    waitingRequests: number;
    totalCapacity: number;
  } {
    return {
      poolSize: this.pool.length,
      activeConnections: this.activeConnections.size,
      waitingRequests: this.waitQueue.length,
      totalCapacity: this.maxSize
    };
  }

  /**
   * Health check for pool
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    poolSize: number;
    activeConnections: number;
    validConnections: number;
  }> {
    let validConnections = 0;
    
    // Check pool connections
    for (const connection of this.pool) {
      if (this.validateConnection(connection)) {
        validConnections++;
      }
    }
    
    // Check active connections
    for (const connection of this.activeConnections) {
      if (this.validateConnection(connection)) {
        validConnections++;
      }
    }
    
    const totalConnections = this.pool.length + this.activeConnections.size;
    const healthy = validConnections === totalConnections && totalConnections >= this.minSize;
    
    return {
      healthy,
      poolSize: this.pool.length,
      activeConnections: this.activeConnections.size,
      validConnections
    };
  }
}

// Real-time optimization utilities
export class RealtimeOptimizer {
  private messageBatcher: MessageBatcher;
  private compressionEnabled: boolean = true;
  private deltaCompressionEnabled: boolean = true;
  private lastStates: Map<string, any> = new Map();

  constructor(options: {
    batchSize?: number;
    batchTimeout?: number;
    compressionEnabled?: boolean;
    deltaCompressionEnabled?: boolean;
  } = {}) {
    this.messageBatcher = new MessageBatcher({
      maxBatchSize: options.batchSize || 10,
      maxWaitTime: options.batchTimeout || 100
    });
    
    this.compressionEnabled = options.compressionEnabled ?? true;
    this.deltaCompressionEnabled = options.deltaCompressionEnabled ?? true;
  }

  /**
   * Optimize message for real-time delivery
   */
  optimizeMessage(
    channel: string,
    message: any,
    options: {
      priority?: 'critical' | 'high' | 'normal' | 'low';
      compress?: boolean;
      useDelta?: boolean;
    } = {}
  ): any {
    let optimizedMessage = { ...message };
    
    // Apply delta compression if enabled
    if (options.useDelta && this.deltaCompressionEnabled) {
      optimizedMessage = this.applyDeltaCompression(channel, optimizedMessage);
    }
    
    // Apply compression if enabled
    if (options.compress && this.compressionEnabled) {
      optimizedMessage = this.compressMessage(optimizedMessage);
    }
    
    return {
      ...optimizedMessage,
      _metadata: {
        compressed: options.compress && this.compressionEnabled,
        delta: options.useDelta && this.deltaCompressionEnabled,
        timestamp: Date.now(),
        channel
      }
    };
  }

  /**
   * Apply delta compression
   */
  private applyDeltaCompression(channel: string, message: any): any {
    const lastState = this.lastStates.get(channel);
    
    if (!lastState) {
      this.lastStates.set(channel, message);
      return message;
    }
    
    const delta = this.calculateDelta(lastState, message);
    this.lastStates.set(channel, message);
    
    return {
      _delta: true,
      _changes: delta
    };
  }

  /**
   * Calculate delta between two objects
   */
  private calculateDelta(oldState: any, newState: any): any {
    const delta: any = {};
    
    for (const key in newState) {
      if (oldState[key] !== newState[key]) {
        if (typeof newState[key] === 'object' && typeof oldState[key] === 'object') {
          const nestedDelta = this.calculateDelta(oldState[key], newState[key]);
          if (Object.keys(nestedDelta).length > 0) {
            delta[key] = nestedDelta;
          }
        } else {
          delta[key] = newState[key];
        }
      }
    }
    
    return delta;
  }

  /**
   * Compress message (simple JSON compression simulation)
   */
  private compressMessage(message: any): any {
    // In a real implementation, you'd use actual compression algorithms
    const stringified = JSON.stringify(message);
    
    // Simple compression simulation - remove whitespace and common patterns
    const compressed = stringified
      .replace(/\s+/g, '')
      .replace(/":"/g, '":"')
      .replace(/,"/g, ',"');
    
    return {
      _compressed: true,
      _data: compressed,
      _originalSize: stringified.length,
      _compressedSize: compressed.length
    };
  }

  /**
   * Batch message for delivery
   */
  batchMessage(
    channel: string,
    message: any,
    priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'
  ): void {
    this.messageBatcher.addMessage(channel, message, priority);
  }

  /**
   * Subscribe to batched messages
   */
  onBatch(callback: (batch: any) => void): void {
    this.messageBatcher.on('batch', callback);
  }

  /**
   * Get optimization statistics
   */
  getStats(): {
    batcherStats: any;
    cacheSize: number;
    compressionEnabled: boolean;
    deltaCompressionEnabled: boolean;
  } {
    return {
      batcherStats: this.messageBatcher.getStats(),
      cacheSize: this.lastStates.size,
      compressionEnabled: this.compressionEnabled,
      deltaCompressionEnabled: this.deltaCompressionEnabled
    };
  }

  /**
   * Clear optimization cache
   */
  clearCache(channel?: string): void {
    if (channel) {
      this.lastStates.delete(channel);
    } else {
      this.lastStates.clear();
    }
  }
}