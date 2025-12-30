import React, { useState, useEffect, useRef } from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';
import api from '../utils/api'; // Import API helper
import LeadScoreCard from './LeadScoreCard';

const ChatInterface = () => {
  const { leads, selectedLead, setSelectedLead, leadMessages, assignLead, sendMessage, getLeadMessages } = useBots();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false); // AI State
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [leadMessages, selectedLead]);

  const handleAssignLead = async (leadId) => {
    setLoading(true);
    try {
      await assignLead(leadId);
      // The SSE event will update the lead status automatically
    } catch (error) {
      console.error('Error assigning lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedLead) return;

    setLoading(true);
    try {
      await sendMessage(selectedLead.id, messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!selectedLead) return;
    setSuggesting(true);
    try {
       const res = await api.post('/api/ai/suggest-reply', {
          leadId: selectedLead.id,
          tone: 'professional' // Default
       });
       if (res.data.suggestion) {
           setMessageInput(res.data.suggestion);
       }
    } catch (error) {
       console.error("AI Error:", error);
    } finally {
       setSuggesting(false);
    }
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    // Load messages for this lead
    getLeadMessages(lead.id);
  };

  const getLeadStatusColor = (lead) => {
    if (lead.assigned_to === user?.email) return 'bg-green-100 border-green-500';
    if (lead.assigned_to) return 'bg-yellow-100 border-yellow-500';
    return 'bg-blue-100 border-blue-500';
  };

  const getLeadStatusText = (lead) => {
    if (lead.assigned_to === user?.email) return t('chat.status.assigned_to_you');
    if (lead.assigned_to) return t('chat.status.assigned_to_other', { name: lead.assigned_to });
    return t('chat.status.unassigned');
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentLeadMessages = selectedLead ? leadMessages[selectedLead.id] || [] : [];

  return (
    <div className="flex h-full bg-white rounded-lg shadow-md">
      {/* Leads Sidebar */}
      <div className="w-1/3 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{t('chat.qualified_leads')}</h2>
          <p className="text-sm text-gray-600">{t('chat.leads_count', { count: leads.length })}</p>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-200px)]">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedLead?.id === lead.id ? 'bg-blue-50' : ''
              } ${getLeadStatusColor(lead)} border-l-4`}
              onClick={() => handleSelectLead(lead)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800">{lead.name || t('chat.unknown')}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                  {lead.lead_score || 0}%
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                📱 {lead.whatsapp_number}
              </p>
              
              <p className="text-xs text-gray-500 mb-2">
                {t('chat.bot_label', { name: lead.bot_name || lead.bot_id })}
              </p>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {getLeadStatusText(lead)}
                </span>
                
                {!lead.assigned_to && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignLead(lead.id);
                    }}
                    disabled={loading}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    {t('chat.assign_to_me')}
                  </button>
                )}
              </div>
              
              {lead.last_message && (
                <p className="text-xs text-gray-500 mt-2 truncate">
                  {t('chat.last_message', { message: lead.last_message })}
                </p>
              )}
            </div>
          ))}
          
          {leads.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>{t('chat.no_leads')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedLead ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedLead.name || t('chat.unknown')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📱 {selectedLead.whatsapp_number}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedLead.assigned_to === user?.email
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getLeadStatusText(selectedLead)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lead Score Card (Visible in Chat Header/Top Area) */}
            <div className="px-4 pt-4 bg-gray-50">
               <LeadScoreCard
                  score={selectedLead.score || 0}
                  tags={selectedLead.tags || []}
               />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {currentLeadMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>{t('chat.no_messages')}</p>
                  <p className="text-sm">{t('chat.start_conversation')}</p>
                </div>
              ) : (
                currentLeadMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.sender === user?.email ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === user?.email
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === user?.email
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.timestamp)}
                        {message.sender === user?.email && t('chat.you')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* AI Suggestion Button */}
              <div className="flex justify-between items-center mb-2">
                   <div className="text-xs text-gray-400">
                       {suggesting ? '✨ AI thinking...' : ''}
                   </div>
                   <button
                      onClick={handleAiSuggest}
                      disabled={suggesting || selectedLead.assigned_to !== user?.email}
                      className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 disabled:opacity-50 font-medium"
                   >
                       <span>✨</span>
                       {t('chat.ai_suggest', 'Smart Reply')}
                   </button>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t('chat.type_message')}
                  disabled={loading || selectedLead.assigned_to !== user?.email}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !messageInput.trim() || selectedLead.assigned_to !== user?.email}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {t('chat.send')}
                </button>
              </div>
              {selectedLead.assigned_to !== user?.email && (
                <p className="text-xs text-yellow-600 mt-2">
                  {t('chat.assigned_error', { name: selectedLead.assigned_to })}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">{t('chat.select_lead_title')}</p>
              <p className="text-sm">{t('chat.select_lead_subtitle')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;