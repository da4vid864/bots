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

    console.log('📥 SSE Event received:', type, data ? 'data present' : 'no data');

    switch (type) {
      case 'CONNECTED':
        console.log('✅ SSE Connected:', data);
        setSseConnected(true);
        break;

      case 'INIT':
        console.log('🚀 INIT received for bots initialization');
        // El sistema espera este evento para inicializar
        // Los bots se cargan por separado via API
        break;

      case 'INIT_LEADS':
        console.log('📥 INIT_LEADS received:', data.leads?.length, 'leads');
        setLeads(data.leads || []);
        break;

      // ✅ Eventos del sistema de bots EXISTENTE
      case 'UPDATE_BOT':
        console.log('🤖 UPDATE_BOT received:', data.id, data.status);
        setBots((prevBots) =>
          prevBots.map((bot) => (bot.id === data.id ? { ...bot, ...data } : bot))
        );
        break;

      case 'NEW_BOT':
        console.log('🤖 NEW_BOT received:', data.id);
        setBots((prevBots) => [...prevBots, data]);
        break;

      case 'BOT_DELETED':
        console.log('🤖 BOT_DELETED received:', data.id);
        setBots((prevBots) => prevBots.filter((bot) => bot.id !== data.id));
        break;

      case 'NEW_QUALIFIED_LEAD':
        console.log('🎯 NEW_QUALIFIED_LEAD received:', data);
        setLeads((prevLeads) => [...prevLeads, data]);
        break;

      case 'LEAD_ASSIGNED':
        console.log('🎯 LEAD_ASSIGNED received:', data);
        setLeads((prevLeads) =>
          prevLeads.map((lead) => (lead.id === data.id ? { ...lead, ...data } : lead))
        );
        break;

      case 'LEAD_UPDATED':
        console.log('🔄 LEAD_UPDATED received:', data.id);
        setLeads((prevLeads) =>
          prevLeads.map((lead) => (lead.id === data.id ? { ...lead, ...data } : lead))
        );
        // Update selected lead if it matches
        setSelectedLead((prevSelected) =>
          prevSelected?.id === data.id ? { ...prevSelected, ...data } : prevSelected
        );
        break;

      case 'NEW_MESSAGE_FOR_SALES':
        console.log('💬 NEW_MESSAGE_FOR_SALES received for lead:', data.leadId);
        setLeadMessages((prev) => ({
          ...prev,
          [data.leadId]: [...(prev[data.leadId] || []), data],
        }));
        break;

      case 'MESSAGE_SENT':
        console.log('💬 MESSAGE_SENT received for lead:', data.leadId);
        setLeadMessages((prev) => ({
          ...prev,
          [data.leadId]: [...(prev[data.leadId] || []), data],
        }));
        break;

      case 'LEAD_MESSAGES':
        console.log('💬 LEAD_MESSAGES received for lead:', data.leadId);
        setLeadMessages((prev) => ({
          ...prev,
          [data.leadId]: data.messages,
        }));
        break;

      // ✅ NUEVO: Inicialización de métricas
      case 'STATS_INIT':
        setDashboardStats(data?.stats || null);
        break;

      // ✅ NUEVO: Updates de métricas
      case 'STATS_UPDATE':
        setDashboardStats(data?.stats || null);
        break;

      default:
        console.log('⚠️ Unhandled SSE event:', type, data);
    }
  }, []);

  /**
   * Initializes SSE connection.
   */
  const initializeSSE = useCallback(() => {
    console.log('🔌 Initializing SSE connection...');
    
    const es = new EventSource('/api/events', { 
      withCredentials: true 
    });

    es.onopen = () => {
      console.log('🔗 SSE Connection established');
      setSseConnected(true);
      
      // ✅ SOLO si necesitas datos iniciales adicionales
      // Los bots se cargan por separado
    };

    es.onmessage = (event) => {
      try {
        // El evento 'heartbeat' no es JSON
        if (event.data.startsWith(': heartbeat')) {
          return;
        }
        
        const payload = JSON.parse(event.data);
        handleSSEEvent(payload);
      } catch (error) {
        console.error('Error parsing SSE event:', error, event.data);
      }
    };

    es.onerror = (error) => {
      console.error('❌ SSE Connection error:', error);
      setSseConnected(false);
      
      // Intentar reconectar después de 10 segundos
      setTimeout(() => {
        if (isAuthenticated && user) {
          console.log('🔄 Attempting SSE reconnection...');
          initializeSSE();
        }
      }, 10000);
      
      es.close();
    };

    setEventSource(es);
    return es;
  }, [handleSSEEvent, isAuthenticated, user]);

  /**
   * Load initial bots data (separado del SSE)
   */
  const loadInitialBots = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      console.log('📡 Loading initial bots...');
      const response = await fetch('/api/bots', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🤖 Bots loaded:', data.bots?.length);
        setBots(data.bots || []);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    }
  }, [isAuthenticated, user]);

  /**
   * Effect: init SSE when authenticated
   */
  useEffect(() => {
    let es = null;

    if (isAuthenticated && user) {
      console.log('🚀 Initializing SSE and loading bots for user:', user.email);
      
      // 1. Inicializar SSE
      es = initializeSSE();
      
      // 2. Cargar bots iniciales
      loadInitialBots();
      
      // 3. Cargar leads iniciales (si existe el endpoint)
      const loadInitialLeads = async () => {
        try {
          const response = await fetch('/api/leads', {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('📥 Initial leads loaded via API:', data.leads?.length);
            setLeads(data.leads || []);
          }
        } catch (error) {
          console.error('Error loading initial leads:', error);
        }
      };
      
      loadInitialLeads();
    }

    return () => {
      if (es) {
        console.log('🧹 Cleaning up SSE connection');
        es.close();
      } else if (eventSource) {
        eventSource.close();
      }

      setSseConnected(false);
      setDashboardStats(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, initializeSSE, loadInitialBots]);

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
    try {
      const response = await fetch(`/api/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
        
      if (!response.ok) throw new Error('Failed to assign lead');
      
      const data = await response.json();
      
      // Actualizar estado local
      setLeads((prevLeads) =>
        prevLeads.map((lead) => 
          lead.id === leadId ? { ...lead, assigned_to: user?.email } : lead
        )
      );
      
      return data;
    } catch (error) {
      console.error('Error assigning lead:', error);
      throw error;
    }
  };

  const updateLead = async (leadId, updates) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
        
      if (!response.ok) throw new Error('Failed to update lead');
      
      const data = await response.json();
      
      // Actualizar estado local
      setLeads((prevLeads) =>
        prevLeads.map((lead) => 
          lead.id === leadId ? { ...lead, ...updates } : lead
        )
      );
      
      return data;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
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

  // ✅ Refrescar leads manualmente
  const refreshLeads = async () => {
    console.log('🔄 Manually refreshing leads...');
    try {
      const response = await fetch('/api/leads', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
        
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        console.log('✅ Leads refreshed:', data.leads?.length);
      }
    } catch (error) {
      console.error('Error refreshing leads:', error);
    }
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

    // Operaciones
    createBot,
    editBot,
    deleteBot,
    enableBot,
    disableBot,
    assignLead,
    updateLead,
    sendMessage,
    getLeadMessages,
    refreshLeads,
  };

  return <BotsContext.Provider value={value}>{children}</BotsContext.Provider>;
};

export default BotsContext;

BotsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};