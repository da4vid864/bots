import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';

/**
 * Context for managing bots and leads data.
 * @type {React.Context}
 */
const BotsContext = createContext();

/**
 * Custom hook to use the BotsContext.
 * @returns {object} The context value containing bots, leads, and associated methods.
 * @throws {Error} If used outside of a BotsProvider.
 */
export const useBots = () => {
  const context = useContext(BotsContext);
  if (!context) {
    throw new Error('useBots must be used within a BotsProvider');
  }
  return context;
};

/**
 * Provider component for BotsContext.
 * Manages state for bots, leads, and real-time updates via SSE.
 */
export const BotsProvider = ({ children }) => {
  const [bots, setBots] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadMessages, setLeadMessages] = useState({});
  const [sseConnected, setSseConnected] = useState(false);
  const [eventSource, setEventSource] = useState(null);

  // ✅ NUEVO: stats del dashboard (SSE)
  const [dashboardStats, setDashboardStats] = useState(null);

  const { user, isAuthenticated } = useAuth();

  /**
   * Handles incoming SSE events and updates state accordingly.
   */
  const handleSSEEvent = useCallback((event) => {
    const { type, data } = event;

    switch (type) {
      case 'CONNECTED':
        console.log('✅ SSE Connected:', data);
        break;

      case 'INIT':
        setBots(data.bots || []);
        break;

      case 'INIT_LEADS':
        setLeads(data.leads || []);
        break;

      // ✅ NUEVO: Inicialización de métricas
      case 'STATS_INIT':
        setDashboardStats(data?.stats || null);
        break;

      // ✅ NUEVO: Updates de métricas
      case 'STATS_UPDATE':
        setDashboardStats(data?.stats || null);
        break;

      case 'UPDATE_BOT':
        setBots((prevBots) =>
          prevBots.map((bot) => (bot.id === data.id ? { ...bot, ...data } : bot))
        );
        break;

      case 'NEW_BOT':
        setBots((prevBots) => [...prevBots, data]);
        break;

      case 'BOT_DELETED':
        setBots((prevBots) => prevBots.filter((bot) => bot.id !== data.id));
        break;

      case 'NEW_QUALIFIED_LEAD':
        setLeads((prevLeads) => [...prevLeads, data]);
        break;

      case 'LEAD_ASSIGNED':
        setLeads((prevLeads) =>
          prevLeads.map((lead) => (lead.id === data.id ? { ...lead, ...data } : lead))
        );
        break;

      case 'NEW_MESSAGE_FOR_SALES':
        setLeadMessages((prev) => ({
          ...prev,
          [data.leadId]: [...(prev[data.leadId] || []), data],
        }));
        break;

      case 'MESSAGE_SENT':
        setLeadMessages((prev) => ({
          ...prev,
          [data.leadId]: [...(prev[data.leadId] || []), data],
        }));
        break;

      case 'LEAD_MESSAGES':
        setLeadMessages((prev) => ({
          ...prev,
          [data.leadId]: data.messages,
        }));
        break;

      default:
        console.log('Unhandled SSE event:', type, data);
    }
  }, []);

  /**
   * Initializes SSE connection.
   */
  const initializeSSE = useCallback(() => {
    const es = new EventSource('/api/events', { withCredentials: true });

    es.onopen = () => {
      console.log('🔗 SSE Connection established');
      setSseConnected(true);

      // Request initial data after connection
      fetch('/api/initial-data', { credentials: 'include' }).catch(console.error);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleSSEEvent(payload);
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    es.onerror = (error) => {
      console.error('❌ SSE Connection error:', error);
      setSseConnected(false);
      es.close();
    };

    setEventSource(es);
    return es;
  }, [handleSSEEvent]);

  /**
   * Effect: init SSE when authenticated
   */
  useEffect(() => {
    let es = null;

    if (isAuthenticated && user) {
      es = initializeSSE();
    }

    return () => {
      if (es) es.close();
      else if (eventSource) eventSource.close();

      setSseConnected(false);
      setDashboardStats(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, initializeSSE]);

  // ===== Bot operations =====
  const createBot = async (botData) => {
    const response = await fetch('/api/create-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(botData),
    });
    if (!response.ok) throw new Error('Failed to create bot');
    return await response.json();
  };

  const editBot = async (botId, prompt) => {
    const response = await fetch(`/api/edit-bot/${botId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error('Failed to edit bot');
    return await response.json();
  };

  const deleteBot = async (botId) => {
    const response = await fetch(`/api/delete-bot/${botId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete bot');
    return await response.json();
  };

  const enableBot = async (botId) => {
    const response = await fetch(`/api/enable-bot/${botId}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to enable bot');
    return await response.json();
  };

  const disableBot = async (botId) => {
    const response = await fetch(`/api/disable-bot/${botId}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to disable bot');
    return await response.json();
  };

  // ===== Lead operations =====
  const assignLead = async (leadId) => {
    const response = await fetch('/api/assign-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ leadId }),
    });
    if (!response.ok) throw new Error('Failed to assign lead');
    return await response.json();
  };

  const sendMessage = async (leadId, message) => {
    const response = await fetch('/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ leadId, message }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return await response.json();
  };

  const getLeadMessages = async (leadId) => {
    const response = await fetch(`/api/lead-messages/${leadId}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get lead messages');
    return await response.json();
  };

  const value = {
    bots,
    leads,
    selectedLead,
    setSelectedLead,
    leadMessages,
    sseConnected,

    // ✅ NUEVO
    dashboardStats,

    createBot,
    editBot,
    deleteBot,
    enableBot,
    disableBot,
    assignLead,
    sendMessage,
    getLeadMessages,
  };

  return <BotsContext.Provider value={value}>{children}</BotsContext.Provider>;
};

export default BotsContext;

BotsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};