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
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} The provider component.
 */
export const BotsProvider = ({ children }) => {
  const [bots, setBots] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadMessages, setLeadMessages] = useState({});
  const [sseConnected, setSseConnected] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const { user, isAuthenticated } = useAuth();

  /**
   * Handles incoming SSE events and updates state accordingly.
   * Wrapped in useCallback to be a stable dependency.
   *
   * @param {object} event - The SSE event object.
   * @param {string} event.type - The type of event (e.g., 'INIT', 'UPDATE_BOT').
   * @param {any} event.data - The payload data associated with the event.
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

      case 'UPDATE_BOT':
        setBots(prevBots => 
          prevBots.map(bot => 
            bot.id === data.id ? { ...bot, ...data } : bot
          )
        );
        break;

      case 'NEW_BOT':
        setBots(prevBots => [...prevBots, data]);
        break;

      case 'BOT_DELETED':
        setBots(prevBots => prevBots.filter(bot => bot.id !== data.id));
        break;

      case 'NEW_QUALIFIED_LEAD':
        setLeads(prevLeads => [...prevLeads, data]);
        break;

      case 'LEAD_ASSIGNED':
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === data.id ? { ...lead, ...data } : lead
          )
        );
        break;

      case 'NEW_MESSAGE_FOR_SALES':
        setLeadMessages(prev => ({
          ...prev,
          [data.leadId]: [...(prev[data.leadId] || []), data]
        }));
        break;

      case 'MESSAGE_SENT':
        setLeadMessages(prev => ({
          ...prev,
          [data.leadId]: [...(prev[data.leadId] || []), data]
        }));
        break;

      case 'LEAD_MESSAGES':
        setLeadMessages(prev => ({
          ...prev,
          [data.leadId]: data.messages
        }));
        break;

      default:
        console.log('Unhandled SSE event:', type, data);
    }
  }, []);

  /**
   * Initializes Server-Sent Events (SSE) connection for real-time updates.
   * Handles connection events, messages, and errors.
   */
  const initializeSSE = useCallback(() => {
    const es = new EventSource('/api/events', {
      withCredentials: true,
    });

    es.onopen = () => {
      console.log('🔗 SSE Connection established');
      setSseConnected(true);

      // Request initial data after connection
      fetch('/api/initial-data', {
        credentials: 'include',
      }).catch(console.error);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSSEEvent(data);
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    es.onerror = (error) => {
      console.error('❌ SSE Connection error:', error);
      setSseConnected(false);
      es.close();
      // Auto-reconnection is handled by browser for simple drops, 
      // or we rely on useEffect to re-establish if auth state changes or on mount.
    };

    setEventSource(es);
    return es;
  }, [handleSSEEvent]);

  /**
   * Effect hook to initialize SSE connection when user is authenticated.
   * Cleans up connection on unmount or logout.
   */
  useEffect(() => {
    let es = null;

    if (isAuthenticated && user) {
      es = initializeSSE();
    }

    return () => {
      if (es) {
        es.close();
      } else if (eventSource) {
        eventSource.close();
      }
      setSseConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, initializeSSE]);

  /**
   * Creates a new bot.
   * @param {object} botData - The data for the new bot.
   * @returns {Promise<object>} The created bot object.
   * @throws {Error} If creation fails.
   */
  const createBot = async (botData) => {
    try {
      const response = await fetch('/api/create-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(botData),
      });

      if (!response.ok) throw new Error('Failed to create bot');
      return await response.json();
    } catch (error) {
      console.error('Error creating bot:', error);
      throw error;
    }
  };

  /**
   * Edits an existing bot's prompt.
   * @param {string|number} botId - The ID of the bot to edit.
   * @param {string} prompt - The new prompt for the bot.
   * @returns {Promise<object>} The updated bot object.
   * @throws {Error} If update fails.
   */
  const editBot = async (botId, prompt) => {
    try {
      const response = await fetch(`/api/edit-bot/${botId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Failed to edit bot');
      return await response.json();
    } catch (error) {
      console.error('Error editing bot:', error);
      throw error;
    }
  };

  /**
   * Deletes a bot.
   * @param {string|number} botId - The ID of the bot to delete.
   * @returns {Promise<object>} Response from the server.
   * @throws {Error} If deletion fails.
   */
  const deleteBot = async (botId) => {
    try {
      const response = await fetch(`/api/delete-bot/${botId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete bot');
      return await response.json();
    } catch (error) {
      console.error('Error deleting bot:', error);
      throw error;
    }
  };

  /**
   * Enables a bot.
   * @param {string|number} botId - The ID of the bot to enable.
   * @returns {Promise<object>} The enabled bot object.
   * @throws {Error} If enabling fails.
   */
  const enableBot = async (botId) => {
    try {
      const response = await fetch(`/api/enable-bot/${botId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to enable bot');
      return await response.json();
    } catch (error) {
      console.error('Error enabling bot:', error);
      throw error;
    }
  };

  /**
   * Disables a bot.
   * @param {string|number} botId - The ID of the bot to disable.
   * @returns {Promise<object>} The disabled bot object.
   * @throws {Error} If disabling fails.
   */
  const disableBot = async (botId) => {
    try {
      const response = await fetch(`/api/disable-bot/${botId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to disable bot');
      return await response.json();
    } catch (error) {
      console.error('Error disabling bot:', error);
      throw error;
    }
  };

  // Lead operations

  /**
   * Assigns a lead to the current user.
   * @param {string|number} leadId - The ID of the lead to assign.
   * @returns {Promise<object>} The updated lead object.
   * @throws {Error} If assignment fails.
   */
  const assignLead = async (leadId) => {
    try {
      const response = await fetch('/api/assign-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ leadId }),
      });

      if (!response.ok) throw new Error('Failed to assign lead');
      return await response.json();
    } catch (error) {
      console.error('Error assigning lead:', error);
      throw error;
    }
  };

  /**
   * Sends a message to a lead.
   * @param {string|number} leadId - The ID of the lead to send message to.
   * @param {string} message - The message content.
   * @returns {Promise<object>} The sent message object.
   * @throws {Error} If sending fails.
   */
  const sendMessage = async (leadId, message) => {
    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ leadId, message }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  /**
   * Retrieves messages for a specific lead.
   * @param {string|number} leadId - The ID of the lead.
   * @returns {Promise<Array>} Array of message objects.
   * @throws {Error} If retrieval fails.
   */
  const getLeadMessages = async (leadId) => {
    try {
      const response = await fetch(`/api/lead-messages/${leadId}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to get lead messages');
      return await response.json();
    } catch (error) {
      console.error('Error getting lead messages:', error);
      throw error;
    }
  };

  const value = {
    bots,
    leads,
    selectedLead,
    setSelectedLead,
    leadMessages,
    sseConnected,
    createBot,
    editBot,
    deleteBot,
    enableBot,
    disableBot,
    assignLead,
    sendMessage,
    getLeadMessages,
  };

  return (
    <BotsContext.Provider value={value}>
      {children}
    </BotsContext.Provider>
  );
};

export default BotsContext;

BotsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};