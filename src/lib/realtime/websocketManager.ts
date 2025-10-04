import { EventEmitter } from 'events';

// WebSocket connection manager with pooling and reconnection logic
export class WebSocketManager extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private connectionPool: WebSocket[] = [];
  private maxPoolSize: number = 5;
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval: number = 30000;
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  
  private messageQueue: Map<string, Array<{ type: string; data: any; timestamp: number }>> = new Map();
  private batchSize: number = 10;
  private batchTimeout: number = 100;
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: {
    maxPoolSize?: number;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    heartbeatInterval?: number;
    batchSize?: number;
    batchTimeout?: number;
  } = {}) {
    super();
    
    this.maxPoolSize = options.maxPoolSize || 5;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 100;
  }

  /**
   * Get or create a WebSocket connection
   */
  async getConnection(url: string, protocols?: string[]): Promise<WebSocket> {
    const existingConnection = this.connections.get(url);
    
    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      return existingConnection;
    }

    // Try to get a connection from the pool
    const pooledConnection = this.getFromPool();
    if (pooledConnection) {
      this.connections.set(url, pooledConnection);
      return pooledConnection;
    }

    // Create new connection
    const ws = await this.createConnection(url, protocols);
    this.connections.set(url, ws);
    this.setupConnection(url, ws);
    
    return ws;
  }

  /**
   * Create a new WebSocket connection
   */
  private createConnection(url: string, protocols?: string[]): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, protocols);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        this.emit('connected', url);
        resolve(ws);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        this.emit('error', { url, error });
        reject(error);
      };
    });
  }

  /**
   * Setup connection event handlers
   */
  private setupConnection(url: string, ws: WebSocket): void {
    ws.onmessage = (event) => {
      this.handleMessage(url, event);
    };

    ws.onclose = (event) => {
      this.handleConnectionClose(url, event);
    };

    ws.onerror = (error) => {
      this.emit('error', { url, error });
    };

    // Start heartbeat
    this.startHeartbeat(url, ws);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(url: string, event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      // Handle heartbeat pong
      if (message.type === 'pong') {
        return;
      }

      this.emit('message', { url, message });
    } catch (error) {
      this.emit('error', { url, error: new Error('Invalid message format') });
    }
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(url: string, event: CloseEvent): void {
    this.connections.delete(url);
    this.stopHeartbeat(url);
    this.emit('disconnected', { url, code: event.code, reason: event.reason });

    // Attempt reconnection if not a normal close
    if (event.code !== 1000) {
      this.attemptReconnection(url);
    }
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnection(url: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(url) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      this.emit('reconnect-failed', url);
      return;
    }

    this.reconnectAttempts.set(url, attempts + 1);
    
    setTimeout(async () => {
      try {
        await this.getConnection(url);
        this.reconnectAttempts.delete(url);
        this.emit('reconnected', url);
      } catch (error) {
        this.attemptReconnection(url);
      }
    }, this.reconnectDelay * Math.pow(2, attempts)); // Exponential backoff
  }

  /**
   * Send message with batching
   */
  sendMessage(url: string, type: string, data: any): void {
    const message = { type, data, timestamp: Date.now() };
    
    if (!this.messageQueue.has(url)) {
      this.messageQueue.set(url, []);
    }
    
    const queue = this.messageQueue.get(url)!;
    queue.push(message);
    
    // Send immediately if batch size reached
    if (queue.length >= this.batchSize) {
      this.flushMessageBatch(url);
      return;
    }
    
    // Set timer to send batch after timeout
    if (!this.batchTimers.has(url)) {
      const timer = setTimeout(() => {
        this.flushMessageBatch(url);
      }, this.batchTimeout);
      
      this.batchTimers.set(url, timer);
    }
  }

  /**
   * Flush message batch
   */
  private flushMessageBatch(url: string): void {
    const queue = this.messageQueue.get(url);
    if (!queue || queue.length === 0) return;

    const connection = this.connections.get(url);
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      // Connection not ready, keep messages in queue
      return;
    }

    try {
      const batch = {
        type: 'batch',
        messages: queue.splice(0, this.batchSize),
        timestamp: Date.now()
      };
      
      connection.send(JSON.stringify(batch));
      
      // Clear batch timer
      const timer = this.batchTimers.get(url);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(url);
      }
    } catch (error) {
      this.emit('error', { url, error });
    }
  }

  /**
   * Send individual message (bypass batching)
   */
  sendImmediateMessage(url: string, message: any): void {
    const connection = this.connections.get(url);
    
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      this.emit('error', { url, error: new Error('Connection not available') });
      return;
    }

    try {
      connection.send(JSON.stringify(message));
    } catch (error) {
      this.emit('error', { url, error });
    }
  }

  /**
   * Start heartbeat for connection
   */
  private startHeartbeat(url: string, ws: WebSocket): void {
    const timer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          this.emit('error', { url, error });
        }
      }
    }, this.heartbeatInterval);
    
    this.heartbeatTimers.set(url, timer);
  }

  /**
   * Stop heartbeat for connection
   */
  private stopHeartbeat(url: string): void {
    const timer = this.heartbeatTimers.get(url);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(url);
    }
  }

  /**
   * Get connection from pool
   */
  private getFromPool(): WebSocket | null {
    for (let i = 0; i < this.connectionPool.length; i++) {
      const ws = this.connectionPool[i];
      if (ws.readyState === WebSocket.OPEN) {
        this.connectionPool.splice(i, 1);
        return ws;
      }
    }
    return null;
  }

  /**
   * Return connection to pool
   */
  private returnToPool(ws: WebSocket): void {
    if (this.connectionPool.length < this.maxPoolSize && ws.readyState === WebSocket.OPEN) {
      this.connectionPool.push(ws);
    } else {
      ws.close();
    }
  }

  /**
   * Close connection
   */
  closeConnection(url: string): void {
    const connection = this.connections.get(url);
    if (connection) {
      this.stopHeartbeat(url);
      this.connections.delete(url);
      this.returnToPool(connection);
    }
  }

  /**
   * Close all connections
   */
  closeAllConnections(): void {
    for (const [url, ws] of this.connections) {
      this.stopHeartbeat(url);
      ws.close();
    }
    
    this.connections.clear();
    this.heartbeatTimers.clear();
    this.messageQueue.clear();
    this.batchTimers.clear();
    
    // Clean up connection pool
    for (const ws of this.connectionPool) {
      ws.close();
    }
    this.connectionPool = [];
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    activeConnections: number;
    poolSize: number;
    queuedMessages: number;
    reconnectAttempts: number;
  } {
    const queuedMessages = Array.from(this.messageQueue.values())
      .reduce((total, queue) => total + queue.length, 0);
    
    const reconnectAttempts = Array.from(this.reconnectAttempts.values())
      .reduce((total, attempts) => total + attempts, 0);

    return {
      activeConnections: this.connections.size,
      poolSize: this.connectionPool.length,
      queuedMessages,
      reconnectAttempts
    };
  }

  /**
   * Health check for all connections
   */
  healthCheck(): { url: string; status: string; lastPing?: number }[] {
    const results: { url: string; status: string; lastPing?: number }[] = [];
    
    for (const [url, ws] of this.connections) {
      let status: string;
      
      switch (ws.readyState) {
        case WebSocket.CONNECTING:
          status = 'connecting';
          break;
        case WebSocket.OPEN:
          status = 'open';
          break;
        case WebSocket.CLOSING:
          status = 'closing';
          break;
        case WebSocket.CLOSED:
          status = 'closed';
          break;
        default:
          status = 'unknown';
      }
      
      results.push({ url, status });
    }
    
    return results;
  }
}

// Global WebSocket manager instance
export const wsManager = new WebSocketManager({
  maxPoolSize: 5,
  maxReconnectAttempts: 3,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  batchSize: 10,
  batchTimeout: 100
});

// Hook for React components
export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    let mounted = true;
    
    const connect = async () => {
      try {
        await wsManager.getConnection(url);
        if (mounted) setIsConnected(true);
      } catch (err) {
        if (mounted) setError(err as Error);
      }
    };
    
    const handleConnected = (connectedUrl: string) => {
      if (connectedUrl === url && mounted) {
        setIsConnected(true);
        setError(null);
      }
    };
    
    const handleDisconnected = (data: { url: string }) => {
      if (data.url === url && mounted) {
        setIsConnected(false);
      }
    };
    
    const handleError = (data: { url: string; error: Error }) => {
      if (data.url === url && mounted) {
        setError(data.error);
      }
    };
    
    wsManager.on('connected', handleConnected);
    wsManager.on('disconnected', handleDisconnected);
    wsManager.on('error', handleError);
    
    connect();
    
    return () => {
      mounted = false;
      wsManager.off('connected', handleConnected);
      wsManager.off('disconnected', handleDisconnected);
      wsManager.off('error', handleError);
    };
  }, [url]);
  
  const sendMessage = React.useCallback((type: string, data: any) => {
    wsManager.sendMessage(url, type, data);
  }, [url]);
  
  const sendImmediateMessage = React.useCallback((message: any) => {
    wsManager.sendImmediateMessage(url, message);
  }, [url]);
  
  return {
    isConnected,
    error,
    sendMessage,
    sendImmediateMessage
  };
}

// React import for the hook
import React from 'react';