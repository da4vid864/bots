import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create Bots Context
const BotsContext = createContext();

export const useBots = () => {
  const context = useContext(BotsContext);
  if (!context) {
    throw new Error('useBots must be used within a BotsProvider');
  }
  return context;
};

export const BotsProvider = ({ children }) => {
  const [bots, setBots] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadMessages, setLeadMessages] = useState({});
  const [sseConnected, setSseConnected] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Initialize SSE connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSSE();
    } else {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
        setSseConnected(false);
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isAuthenticated, user]);

  const initializeSSE = () => {
    if (eventSource) {
      eventSource.close();
    }

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
      
      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        if (isAuthenticated) {
          console.log('🔄 Attempting SSE reconnection...');
          initializeSSE();
        }
      }, 5000);
    };

    setEventSource(es);
  };

  const handleSSEEvent = (event) => {
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
  };

  // API functions for bot operations
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