import React, { useState, useCallback, useMemo } from 'react';
import PipelineColumn from './PipelineColumn';
import LeadCard from './LeadCard';
import { useSales } from '../../context/SalesContext';

export default function KanbanBoard({
  stages,
  leadsByStage,
  selectedLeadIds,
  onLeadSelect,
  onStageChange,
  onBulkSelect,
}) {
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Handle drag start
  const handleDragStart = useCallback((e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
  }, []);

  // Handle drag over column
  const handleDragOver = useCallback((e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(stageId);
  }, []);

  // Handle drag leave column
  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  // Handle drop on column
  const handleDrop = useCallback(async (e, targetStageId) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedLead && draggedLead.pipelineStageId !== targetStageId) {
      await onStageChange(draggedLead.id, targetStageId);
    }
    
    setDraggedLead(null);
  }, [draggedLead, onStageChange]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedLead(null);
    setDragOverColumn(null);
  }, []);

  // Sort stages by display order
  const sortedStages = useMemo(() => {
    return [...stages].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [stages]);

  // Calculate column totals
  const columnTotals = useMemo(() => {
    const totals = {};
    stages.forEach(stage => {
      totals[stage.id] = leadsByStage[stage.id]?.length || 0;
    });
    return totals;
  }, [stages, leadsByStage]);

  return (
    <div className="kanban-board">
      <div className="kanban-container">
        {sortedStages.map(stage => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage[stage.id] || []}
            isDragOver={dragOverColumn === stage.id}
            draggedLead={draggedLead}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
            onLeadSelect={onLeadSelect}
            onBulkSelect={onBulkSelect}
          />
        ))}
      </div>
      
      {/* Column Totals Footer */}
      <div className="kanban-footer">
        <div className="total-label">{'Total:'}</div>
        {stages.map(stage => (
          <div key={stage.id} className="column-total">
            {columnTotals[stage.id]}
          </div>
        ))}
      </div>
    </div>
  );
}
