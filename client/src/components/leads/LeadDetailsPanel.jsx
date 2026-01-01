import React, { useState } from 'react';
import { useSales } from '../../context/SalesContext';
import { useTranslation } from 'react-i18next';
import ConversationThread from '../conversations/ConversationThread';
import ScoreBreakdown from './ScoreBreakdown';

export default function LeadDetailsPanel({ 
  lead, 
  conversations, 
  onClose, 
  onStageChange 
}) {
  const { t } = useTranslation();
  const { actions } = useSales();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(lead.notes || '');

  // Handle save notes
  const handleSaveNotes = async () => {
    // API call to save notes
    setIsEditing(false);
  };

  // Get stage color
  const getStageColor = (stageType) => {
    const colors = {
      new: '#3B82F6',
      contacted: '#8B5CF6',
      scheduled: '#F59E0B',
      proposal: '#EC4899',
      negotiation: '#10B981',
      won: '#22C55E',
      lost: '#EF4444',
    };
    return colors[stageType] || '#6B7280';
  };

  return (
    <div className="lead-details-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="header-content">
          <h2>{lead.contactName || lead.contactPhone}</h2>
          <div className="stage-badge" style={{ backgroundColor: getStageColor(lead.pipelineStageType) }}>
            {lead.pipelineStageName}
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          {t('sales.lead.details')}
        </button>
        <button 
          className={`tab ${activeTab === 'conversations' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversations')}
        >
          {t('sales.lead.conversations')}
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          {t('sales.lead.activity')}
        </button>
      </div>

      {/* Panel Content */}
      <div className="panel-content">
        {activeTab === 'details' && (
          <>
            {/* Contact Info */}
            <section className="info-section">
              <h3>{t('sales.lead.contactInfo')}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>{t('sales.lead.phone')}</label>
                  <span>{lead.contactPhone}</span>
                </div>
                {lead.contactEmail && (
                  <div className="info-item">
                    <label>{t('sales.lead.email')}</label>
                    <span>{lead.contactEmail}</span>
                  </div>
                )}
                <div className="info-item">
                  <label>{t('sales.lead.createdAt')}</label>
                  <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </section>

            {/* Lead Score */}
            <section className="score-section">
              <h3>{t('sales.lead.score')}</h3>
              <ScoreBreakdown breakdown={lead.scoreBreakdown} total={lead.leadScore} />
            </section>

            {/* Stage Selector */}
            <section className="stage-section">
              <h3>{t('sales.lead.pipelineStage')}</h3>
              <select 
                value={lead.pipelineStageId}
                onChange={(e) => onStageChange(lead.id, e.target.value)}
                className="stage-select"
              >
                {/* Options populated from stages */}
              </select>
            </section>

            {/* Notes */}
            <section className="notes-section">
              <h3>{t('sales.lead.notes')}</h3>
              {isEditing ? (
                <div className="notes-edit">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                  <div className="edit-actions">
                    <button onClick={handleSaveNotes}>{t('common.save')}</button>
                    <button onClick={() => setIsEditing(false)}>{t('common.cancel')}</button>
                  </div>
                </div>
              ) : (
                <div className="notes-view">
                  <p>{lead.notes || t('common.noNotes')}</p>
                  <button onClick={() => setIsEditing(true)}>
                    {t('common.edit')}
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'conversations' && (
          <ConversationThread
            leadId={lead.id}
            conversations={conversations}
          />
        )}

        {activeTab === 'activity' && (
          <div className="activity-feed">
            <p>Activity feed coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
