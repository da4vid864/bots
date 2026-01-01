import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const LeadCard = memo(function LeadCard({ lead, isDragging, onClick }) {
  const { t } = useTranslation();

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 70) return '#22C55E'; // Green
    if (score >= 30) return '#EAB308'; // Yellow
    return '#EF4444'; // Red
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div 
      className={`lead-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onClick={onClick}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Card Header */}
      <div className="card-header">
        <div className="contact-avatar">
          {lead.contactName?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="contact-info">
          <span className="contact-name">
            {lead.contactName || lead.contactPhone}
          </span>
          <span className="contact-time">
            {formatTimeAgo(lead.createdAt)}
          </span>
        </div>
      </div>

      {/* Lead Score */}
      <div className="score-section">
        <div className="score-bar">
          <div 
            className="score-fill"
            style={{ 
              width: `${lead.leadScore}%`,
              backgroundColor: getScoreColor(lead.leadScore)
            }}
          />
        </div>
        <span className="score-value" style={{ color: getScoreColor(lead.leadScore) }}>
          {lead.leadScore}
        </span>
      </div>

      {/* Intent Badge */}
      {lead.intentLevel && (
        <div className={`intent-badge ${lead.intentLevel}`}>
          {t(`sales.intent.${lead.intentLevel}`)}
        </div>
      )}

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="tags">
          {lead.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {lead.tags.length > 3 && (
            <span className="tag-more">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        {lead.assignedTo && (
          <div className="assignee">
            <span className="assignee-avatar">
              {lead.assignedTo.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {lead.messagesCount > 0 && (
          <div className="message-count">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {lead.messagesCount}
          </div>
        )}
      </div>
    </div>
  );
});

export default LeadCard;
