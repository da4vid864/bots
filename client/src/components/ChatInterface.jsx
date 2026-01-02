import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useBots } from '../context/BotsContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

// ===== ICONS =====
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }) => (
  <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

// ===== HELPERS =====
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const formatMessageTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getScoreColor = (score) => {
  if (score >= 70) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 40) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-slate-700 text-slate-400 border-slate-600';
};

// ===== LEAD CARD COMPONENT =====
const LeadCard = ({ lead, isSelected, onClick, onAssign, user, t }) => {
  const displayName = lead.name || lead.whatsapp_number;
  const isAssignedToMe = lead.assigned_to === user?.email;
  const isAssigned = !!lead.assigned_to;

  return (
    <div
      onClick={onClick}
      className={`p-3 border-b border-slate-800 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-500/10 border-l-2 border-l-blue-500' 
          : 'hover:bg-slate-800/50 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
          lead.status === 'qualified' 
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            : lead.status === 'assigned'
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
            : 'bg-slate-700 text-slate-300'
        }`}>
          {getInitials(displayName)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-slate-100 truncate text-sm">
              {displayName}
            </h4>
            <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
              {formatRelativeTime(lead.last_message_at)}
            </span>
          </div>

          {/* Score & Tags */}
          <div className="flex items-center gap-2 mb-1.5">
            {lead.score > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded border ${getScoreColor(lead.score)}`}>
                {lead.score}%
              </span>
            )}
            {lead.tags?.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>

          {/* Status & Assign */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${
              isAssignedToMe ? 'text-emerald-400' : isAssigned ? 'text-amber-400' : 'text-slate-500'
            }`}>
              {isAssignedToMe 
                ? '✓ Asignado a ti' 
                : isAssigned 
                ? `→ ${lead.assigned_to.split('@')[0]}`
                : lead.status === 'qualified' ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    Calificado
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    En captura
                  </span>
                )
              }
            </span>

            {!isAssigned && lead.status === 'qualified' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(lead.id);
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                Asignar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COLLAPSIBLE SECTION =====
const LeadSection = ({ title, icon, leads, count, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium text-slate-200 text-sm">{title}</span>
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <ChevronDownIcon isOpen={isOpen} />
      </button>
      
      {isOpen && (
        <div className="max-h-[300px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
};

// ===== LEAD SCORE CARD =====
const LeadScoreCard = ({ lead }) => {
  if (!lead) return null;

  const completeness = [
    { label: 'Nombre', value: !!lead.name },
    { label: 'Email', value: !!lead.email },
    { label: 'Ubicación', value: !!lead.location },
    { label: 'Teléfono', value: !!lead.phone },
  ];

  const completedCount = completeness.filter(c => c.value).length;

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
            lead.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
            lead.score >= 40 ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {lead.score || 0}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Lead Score</p>
            <p className="text-xs text-slate-500">
              {lead.score >= 70 ? 'Alta probabilidad' : lead.score >= 40 ? 'Media' : 'Baja'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">Completitud</p>
          <p className="text-sm font-medium text-slate-300">{completedCount}/4</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-3">
        {completeness.map((item, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${item.value ? 'bg-emerald-500' : 'bg-slate-700'}`}
            title={item.label}
          />
        ))}
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lead.tags.map((tag, i) => (
            <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Contact Info */}
      <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs">
        {lead.email && (
          <div className="text-slate-400">
            <span className="text-slate-500">Email:</span> {lead.email}
          </div>
        )}
        {lead.location && (
          <div className="text-slate-400">
            <span className="text-slate-500">Ubicación:</span> {lead.location}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const ChatInterface = () => {
  const { leads, selectedLead, setSelectedLead, leadMessages, assignLead, sendMessage, getLeadMessages } = useBots();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, qualified, capturing, assigned
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [leadMessages, selectedLead]);

  // Filter and group leads
  const { qualifiedLeads, capturingLeads, assignedLeads, filteredLeads } = useMemo(() => {
    let filtered = leads;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(query) ||
        lead.whatsapp_number?.includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Group by status
    const qualified = filtered.filter(l => l.status === 'qualified' && !l.assigned_to);
    const capturing = filtered.filter(l => l.status === 'capturing');
    const assigned = filtered.filter(l => l.assigned_to);

    return {
      qualifiedLeads: qualified,
      capturingLeads: capturing,
      assignedLeads: assigned,
      filteredLeads: filtered
    };
  }, [leads, searchQuery, statusFilter]);

  // Handlers
  const handleAssignLead = async (leadId) => {
    setLoading(true);
    try {
      await assignLead(leadId);
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
        tone: 'professional'
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
    getLeadMessages(lead.id);
  };

  const handleBackToList = () => {
    setSelectedLead(null);
  };

  const currentMessages = selectedLead ? leadMessages[selectedLead.id] || [] : [];
  const canSendMessage = selectedLead?.assigned_to === user?.email;

  return (
    <div className="flex h-full bg-slate-900 text-slate-100">
      {/* ===== LEADS SIDEBAR ===== */}
      <div className={`${selectedLead ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-slate-800`}>
        {/* Search & Filters */}
        <div className="p-3 border-b border-slate-800 space-y-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar leads..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'qualified', label: 'Calificados' },
              { value: 'capturing', label: 'En captura' },
              { value: 'assigned', label: 'Asignados' },
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leads List */}
        <div className="flex-1 overflow-y-auto">
          {statusFilter === 'all' ? (
            <>
              {/* Qualified Section */}
              <LeadSection
                title="Calificados"
                icon="⭐"
                count={qualifiedLeads.length}
                defaultOpen={true}
              >
                {qualifiedLeads.length > 0 ? (
                  qualifiedLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isSelected={selectedLead?.id === lead.id}
                      onClick={() => handleSelectLead(lead)}
                      onAssign={handleAssignLead}
                      user={user}
                      t={t}
                    />
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-sm py-4">
                    No hay leads calificados
                  </p>
                )}
              </LeadSection>

              {/* Capturing Section */}
              <LeadSection
                title="En captura"
                icon="📝"
                count={capturingLeads.length}
                defaultOpen={true}
              >
                {capturingLeads.length > 0 ? (
                  capturingLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isSelected={selectedLead?.id === lead.id}
                      onClick={() => handleSelectLead(lead)}
                      onAssign={handleAssignLead}
                      user={user}
                      t={t}
                    />
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-sm py-4">
                    No hay leads en captura
                  </p>
                )}
              </LeadSection>

              {/* Assigned Section */}
              <LeadSection
                title="Asignados"
                icon="✅"
                count={assignedLeads.length}
                defaultOpen={false}
              >
                {assignedLeads.length > 0 ? (
                  assignedLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isSelected={selectedLead?.id === lead.id}
                      onClick={() => handleSelectLead(lead)}
                      onAssign={handleAssignLead}
                      user={user}
                      t={t}
                    />
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-sm py-4">
                    No hay leads asignados
                  </p>
                )}
              </LeadSection>
            </>
          ) : (
            // Filtered view (single list)
            <div>
              {filteredLeads.length > 0 ? (
                filteredLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedLead?.id === lead.id}
                    onClick={() => handleSelectLead(lead)}
                    onAssign={handleAssignLead}
                    user={user}
                    t={t}
                  />
                ))
              ) : (
                <p className="text-center text-slate-500 text-sm py-8">
                  No se encontraron leads
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Total: {leads.length}</span>
            <span>Calificados: {qualifiedLeads.length}</span>
            <span>Asignados: {assignedLeads.length}</span>
          </div>
        </div>
      </div>

      {/* ===== CHAT AREA ===== */}
      <div className={`${selectedLead ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedLead ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-4">
                {/* Back button (mobile) */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon />
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(selectedLead.name || selectedLead.whatsapp_number)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-100 truncate">
                    {selectedLead.name || 'Sin nombre'}
                  </h3>
                  <p className="text-sm text-slate-400 truncate">
                    {selectedLead.whatsapp_number}
                  </p>
                </div>

                {/* Status Badge */}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedLead.assigned_to === user?.email
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : selectedLead.assigned_to
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {selectedLead.assigned_to === user?.email
                    ? 'Asignado a ti'
                    : selectedLead.assigned_to
                    ? `→ ${selectedLead.assigned_to.split('@')[0]}`
                    : selectedLead.status === 'qualified' ? 'Calificado' : 'En captura'
                  }
                </span>

                {/* Assign Button */}
                {!selectedLead.assigned_to && selectedLead.status === 'qualified' && (
                  <button
                    onClick={() => handleAssignLead(selectedLead.id)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Asignar a mí
                  </button>
                )}
              </div>
            </div>

            {/* Lead Score Card */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/50">
              <LeadScoreCard lead={selectedLead} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
              {currentMessages.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Sin mensajes</p>
                  <p className="text-sm">El historial de conversación aparecerá aquí</p>
                </div>
              ) : (
                currentMessages.map((message, index) => {
                  const isBot = message.sender === 'bot';
                  const isUser = message.sender === 'user';
                  const isMe = message.sender === user?.email;

                  return (
                    <div
                      key={index}
                      className={`flex ${isMe || isBot ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : isBot
                            ? 'bg-purple-600/80 text-white rounded-br-md'
                            : 'bg-slate-800 text-slate-100 rounded-bl-md'
                        }`}
                      >
                        {isBot && (
                          <p className="text-xs text-purple-200 mb-1 font-medium">🤖 Bot</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          isMe || isBot ? 'text-white/60' : 'text-slate-500'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              {/* AI Suggest */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">
                  {suggesting && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3"/>
                        <path d="M12 2v4c2.21 0 4 1.79 4 4s-1.79 4-4 4V2z"/>
                      </svg>
                      Generando sugerencia...
                    </span>
                  )}
                </span>
                <button
                  onClick={handleAiSuggest}
                  disabled={suggesting || !canSendMessage}
                  className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-50 font-medium transition-colors"
                >
                  <SparklesIcon />
                  Smart Reply
                </button>
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={canSendMessage ? "Escribe un mensaje..." : "Asígnate este lead para responder"}
                  disabled={loading || !canSendMessage}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !messageInput.trim() || !canSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <SendIcon />
                </button>
              </div>

              {!canSendMessage && selectedLead.assigned_to && (
                <p className="text-xs text-amber-400 mt-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                    Este lead está asignado a {selectedLead.assigned_to.split('@')[0]}
                  </span>
                </p>
              )}
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Elige un lead de la lista para ver el historial de mensajes y continuar la conversación
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;