import { useEffect, useCallback, useRef } from 'react';
import realtimeManager from '../utils/realtimeManager';
import { useSales } from '../context/SalesContext';
import { useAuth } from '../context/AuthContext';

/**
 * React hook for real-time sales updates
 * Handles connection management and event subscriptions
 */
export function useRealtime(options = {}) {
  const { user } = useAuth();
  const { actions } = useSales();
  const previousLeadsRef = useRef(new Map());
  const optionsRef = useRef(options);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Handle incoming messages
  const handleMessage = useCallback((type, data) => {
    const { onLeadUpdate, onLeadCreate, onStageChange, onMetricsUpdate, onMessage } = optionsRef.current;

    switch (type) {
      case 'LEAD_CREATED':
        console.log('[useRealtime] New lead created:', data);
        if (onLeadCreate) {
          onLeadCreate(data);
        } else {
          // Default behavior: refresh pipeline leads
          actions.fetchPipelineLeads();
        }
        break;

      case 'LEAD_UPDATED':
        console.log('[useRealtime] Lead updated:', data);
        if (onLeadUpdate) {
          onLeadUpdate(data);
        } else {
          // Default behavior: refresh pipeline leads
          actions.fetchPipelineLeads();
        }
        break;

      case 'STAGE_CHANGED':
        console.log('[useRealtime] Stage changed:', data);
        if (onStageChange) {
          onStageChange(data);
        } else {
          // Default behavior: refresh pipeline leads
          actions.fetchPipelineLeads();
        }
        break;

      case 'LEAD_ASSIGNED':
        console.log('[useRealtime] Lead assigned:', data);
        // Refresh to show updated assignment
        actions.fetchPipelineLeads();
        break;

      case 'NEW_MESSAGE':
        console.log('[useRealtime] New message:', data);
        // If viewing the lead with new message, refresh conversations
        if (actions.selectLead) {
          const currentLead = actions.selectLead.leadId;
          if (currentLead === data.leadId || currentLead === data.payload?.leadId) {
            actions.selectLead(currentLead);
          }
        }
        break;

      case 'NEW_MESSAGE_FOR_SALES':
        console.log('[useRealtime] New message for sales:', data);
        // Handle legacy event format
        if (data.leadId && actions.selectLead) {
          const currentLead = actions.selectLead.leadId;
          if (currentLead === data.leadId) {
            actions.selectLead(currentLead);
          }
        }
        break;

      case 'METRICS_UPDATE':
        console.log('[useRealtime] Metrics update:', data);
        if (onMetricsUpdate) {
          onMetricsUpdate(data);
        } else {
          // Default behavior: refresh metrics
          actions.fetchMetrics({ days: 7 });
        }
        break;

      case 'UPDATE_BOT':
        console.log('[useRealtime] Bot update:', data);
        break;

      default:
        if (onMessage) {
          onMessage(type, data);
        } else {
          console.log('[useRealtime] Unknown event type:', type, data);
        }
    }
  }, [actions]);

  // Handle connection status changes
  const handleConnect = useCallback(() => {
    console.log('[useRealtime] Real-time connected');
    if (optionsRef.current.onConnect) {
      optionsRef.current.onConnect();
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('[useRealtime] Real-time disconnected');
    if (optionsRef.current.onDisconnect) {
      optionsRef.current.onDisconnect();
    }
  }, []);

  const handleError = useCallback((error) => {
    console.error('[useRealtime] Real-time error:', error);
    if (optionsRef.current.onError) {
      optionsRef.current.onError(error);
    }
  }, []);

  // Connect on mount if user is authenticated
  useEffect(() => {
    if (user?.id) {
      realtimeManager.connect(user.id, {
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleError,
        onMessage: handleMessage,
      });
    }

    return () => {
      // Only disconnect if the user changes, not on every render
    };
  }, [user?.id, handleConnect, handleDisconnect, handleError, handleMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: disconnect when component unmounts
      // realtimeManager.disconnect();
    };
  }, []);

  /**
   * Subscribe to specific events
   * @param {string} eventType - Event type to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  const subscribe = useCallback((eventType, callback) => {
    return realtimeManager.subscribe(eventType, callback);
  }, []);

  /**
   * Send message via WebSocket
   * @param {string} type - Event type
   * @param {Object} payload - Event payload
   */
  const send = useCallback((type, payload) => {
    realtimeManager.send(type, payload);
  }, []);

  /**
   * Get connection status
   */
  const status = realtimeManager.getStatus();

  return {
    subscribe,
    send,
    isConnected: status.isConnected,
    connectionType: status.connectionType,
    reconnectAttempts: status.reconnectAttempts,
  };
}

export default useRealtime;
