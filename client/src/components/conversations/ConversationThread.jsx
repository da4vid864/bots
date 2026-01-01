import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ConversationThread({ leadId, conversations }) {
  const { t } = useTranslation();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  // Handle send message
  const handleSend = () => {
    if (!newMessage.trim()) return;
    // API call to send message
    setNewMessage('');
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!conversations) return {};
    
    return conversations.reduce((groups, msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    }, {});
  }, [conversations]);

  return (
    <div className="conversation-thread">
      {/* Messages Container */}
      <div className="messages-container">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="message-group">
            <div className="group-date">{date}</div>
            {msgs.map(msg => (
              <div 
                key={msg.id} 
                className={`message ${msg.isFromCustomer ? 'incoming' : 'outgoing'}`}
              >
                <div className="message-content">
                  <p className="message-text">{msg.content}</p>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('sales.conversations.typeMessage')}
          rows={1}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button 
          className="send-btn"
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
