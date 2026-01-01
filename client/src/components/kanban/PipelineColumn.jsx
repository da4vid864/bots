import React, { memo } from 'react';
import LeadCard from './LeadCard';

const PipelineColumn = memo(function PipelineColumn({
  stage,
  leads,
  isDragOver,
  draggedLead,
  onDragOver,
  onDragLeave,
  onDrop,
  onLeadSelect,
  onBulkSelect,
}) {
  // Calculate stage value (sum of lead scores)
  const stageValue = leads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0);

  // Get stage color based on type
  const getStageColor = () => {
    const colors = {
      new: '#3B82F6',        // Blue
      contacted: '#8B5CF6',  // Purple
      scheduled: '#F59E0B',  // Yellow
      proposal: '#EC4899',   // Pink
      negotiation: '#10B981', // Green
      won: '#22C55E',        // Green
      lost: '#EF4444',       // Red
    };
    return colors[stage.stageType] || '#6B7280';
  };

  return (
    <div 
      className={`pipeline-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="column-header" style={{ borderTopColor: getStageColor() }}>
        <div className="column-title">
          <span className="stage-name">{stage.displayName}</span>
          <span className="lead-count">{leads.length}</span>
        </div>
        <div className="column-value">
          {stageValue.toLocaleString()}
        </div>
      </div>

      {/* Leads List */}
      <div className="leads-list">
        {leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            isDragging={draggedLead?.id === lead.id}
            onClick={() => onLeadSelect(lead.id)}
          />
        ))}
        
        {leads.length === 0 && (
          <div className="empty-column">
            <p>No leads</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PipelineColumn;
