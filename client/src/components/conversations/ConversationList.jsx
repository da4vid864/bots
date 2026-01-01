import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ConversationItem from './ConversationItem';

export default function ConversationList({ leads, onLeadSelect }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead => 
        lead.contactName?.toLowerCase().includes(query) ||
        lead.contactPhone?.includes(query) ||
        lead.lastMessage?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        break;
      case 'unread':
        result.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
        break;
      case 'score':
        result.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));
        break;
      default:
        break;
    }

    return result;
  }, [leads, searchQuery, sortBy]);

  return (
    <div className="conversation-list">
      {/* Search and Sort */}
      <div className="list-header">
        <div className="search-box">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('sales.conversations.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="recent">{t('sales.conversations.sort.recent')}</option>
          <option value="unread">{t('sales.conversations.sort.unread')}</option>
          <option value="score">{t('sales.conversations.sort.score')}</option>
        </select>
      </div>

      {/* Conversation Items */}
      <div className="conversations-container">
        {filteredLeads.length > 0 ? (
          filteredLeads.map(lead => (
            <ConversationItem
              key={lead.id}
              lead={lead}
              onClick={() => onLeadSelect(lead.id)}
            />
          ))
        ) : (
          <div className="no-conversations">
            <p>{t('sales.conversations.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
