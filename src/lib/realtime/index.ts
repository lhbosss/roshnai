export { WebSocketManager, wsManager, useWebSocket } from './websocketManager';
export { MessageBatcher, ConnectionPool, RealtimeOptimizer } from './messageOptimizer';

// Re-export commonly used types and utilities
export type WebSocketConnectionStatus = 'connecting' | 'open' | 'closing' | 'closed';

// Real-time optimization configuration
export const realtimeConfig = {
  websocket: {
    maxPoolSize: 5,
    maxReconnectAttempts: 3,
    reconnectDelay: 1000,
    heartbeatInterval: 30000
  },
  
  messaging: {
    batchSize: 10,
    batchTimeout: 100,
    compressionThreshold: 1024, // bytes
    deltaCompressionEnabled: true
  },
  
  performance: {
    maxConnectionAge: 300000, // 5 minutes
    idleTimeout: 60000, // 1 minute
    messageQueueLimit: 1000
  }
};