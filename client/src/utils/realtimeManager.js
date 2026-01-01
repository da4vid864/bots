import { leadsApi } from './salesApi';

/**
 * RealtimeManager - WebSocket manager with SSE fallback for real-time sales updates
 * Supports automatic reconnection with exponential backoff
 */
class RealtimeManager {
  constructor() {
    this.connection = null;
    this.sseSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.userId = null;
    this.eventQueue = [];
    this.salesEventsHandler = null;
  }

  /**
   * Set the sales events handler for server-side event emission
   * @param {Object} handler - Sales events handler with emit methods
   */
  setSalesEventsHandler(handler) {
    this.salesEventsHandler = handler;
  }

  /**
   * Connect to real-time server
   * @param {string} userId - User ID for authentication
   * @param {Object} options - Connection options
   */
  async connect(userId, options = {}) {
    this.userId = userId;
    const { onConnect, onDisconnect, onError, onMessage } = options;

    try {
      // Try WebSocket first if available
      if (this.supportsWebSocket()) {
        await this.connectWebSocket(userId, options);
      } else {
        // Fallback to SSE
        await this.connectSSE(userId, options);
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;

      if (onConnect) onConnect();

      // Process queued events
      this.processEventQueue();

    } catch (error) {
      console.error('[RealtimeManager] Failed to connect:', error);
      if (onError) onError(error);
      this.handleReconnect(userId, options);
    }
  }

  /**
   * Check if WebSocket is supported
   */
  supportsWebSocket() {
    return typeof WebSocket !== 'undefined' && 
           window.location.protocol !== 'http:';
  }

  /**
   * Connect via WebSocket
   */
  async connectWebSocket(userId, options) {
    return new Promise((resolve, reject) => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/events`;
      
      this.connection = new WebSocket(wsUrl);

      this.connection.onopen = () => {
        // Authenticate
        this.connection.send(JSON.stringify({
          type: 'AUTH',
          userId,
          token: this.getAuthToken(),
        }));
        resolve();
      };

      this.connection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data, options.onMessage);
        } catch (error) {
          console.error('[RealtimeManager] Failed to parse WebSocket message:', error);
        }
      };

      this.connection.onclose = () => {
        this.isConnected = false;
        if (options.onDisconnect) options.onDisconnect();
        this.handleReconnect(userId, options);
      };

      this.connection.onerror = (error) => {
        reject(error);
      };
    });
  }

  /**
   * Connect via Server-Sent Events (fallback)
   */
  async connectSSE(userId, options) {
    return new Promise((resolve, reject) => {
      const url = new URL('/api/sales/events', window.location.origin);
      url.searchParams.append('userId', userId);

      this.sseSource = new EventSource(url.toString());

      this.sseSource.onopen = () => {
        resolve();
      };

      this.sseSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data, options.onMessage);
        } catch (error) {
          console.error('[RealtimeManager] Failed to parse SSE message:', error);
        }
      };

      this.sseSource.onerror = (error) => {
        if (this.sseSource.readyState === EventSource.CLOSED) {
          this.isConnected = false;
          if (options.onDisconnect) options.onDisconnect();
          this.handleReconnect(userId, options);
        }
        reject(error);
      };

      // Handle specific event types
      this.sseSource.addEventListener('CONNECTED', (event) => {
        const data = JSON.parse(event.data);
        console.log('[RealtimeManager] SSE Connected:', data);
      });

      this.sseSource.addEventListener('INIT', (event) => {
        const data = JSON.parse(event.data);
        console.log('[RealtimeManager] SSE Initialized:', data);
      });

      this.sseSource.addEventListener('LEAD_CREATED', (event) => {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage('LEAD_CREATED', data);
        this.emit('LEAD_CREATED', data);
      });

      this.sseSource.addEventListener('LEAD_UPDATED', (event) => {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage('LEAD_UPDATED', data);
        this.emit('LEAD_UPDATED', data);
      });

      this.sseSource.addEventListener('STAGE_CHANGED', (event) => {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage('STAGE_CHANGED', data);
        this.emit('STAGE_CHANGED', data);
      });

      this.sseSource.addEventListener('LEAD_ASSIGNED', (event) => {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage('LEAD_ASSIGNED', data);
        this.emit('LEAD_ASSIGNED', data);
      });

      this.sseSource.addEventListener('NEW_MESSAGE', (event) => {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage('NEW_MESSAGE', data);
        this.emit('NEW_MESSAGE', data);
      });

      this.sseSource.addEventListener('METRICS_UPDATE', (event) => {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage('METRICS_UPDATE', data);
        this.emit('METRICS_UPDATE', data);
      });

      // Legacy event handlers for backward compatibility
      this.sseSource.addEventListener('UPDATE_BOT', (event) => {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage('UPDATE_BOT', data);
        this.emit('UPDATE_BOT', data);
      });

      this.sseSource.addEventListener('NEW_MESSAGE_FOR_SALES', (event) => {
        const data = JSON.parse(event.data);
        if (options.onMessage) options.onMessage('NEW_MESSAGE_FOR_SALES', data);
        this.emit('NEW_MESSAGE_FOR_SALES', data);
      });
    });
  }

  /**
   * Handle incoming message
   */
  handleMessage(data, callback) {
    const { type, payload, data: eventData } = data;

    // Handle both {type, payload} and {type, data} formats
    const payloadData = payload || eventData;

    // Emit to registered listeners
    this.emit(type, payloadData);

    // Call callback if provided
    if (callback) callback(type, payloadData);
  }

  /**
   * Handle reconnection with exponential backoff
   */
  handleReconnect(userId, options) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[RealtimeManager] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[RealtimeManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(userId, options);
    }, delay);
  }

  /**
   * Subscribe to event type
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Emit event to subscribers
   */
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Queue event for later processing
   */
  queueEvent(type, data) {
    this.eventQueue.push({ type, data, timestamp: Date.now() });
    
    // Keep only last 100 events
    if (this.eventQueue.length > 100) {
      this.eventQueue.shift();
    }
  }

  /**
   * Process queued events
   */
  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      this.emit(event.type, event.data);
    }
  }

  /**
   * Send message via WebSocket
   */
  send(type, payload) {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[RealtimeManager] WebSocket not connected, message not sent');
    }
  }

  /**
   * Get auth token from cookies
   */
  getAuthToken() {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }

    this.isConnected = false;
    this.listeners.clear();
    this.eventQueue = [];
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionType: this.connection ? 'websocket' : this.sseSource ? 'sse' : 'none',
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton instance
const realtimeManager = new RealtimeManager();

export default realtimeManager;
