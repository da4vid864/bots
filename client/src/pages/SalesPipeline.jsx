import React, { useState, useEffect, useCallback } from 'react';
import { useSales } from '../context/SalesContext';
import KanbanBoard from '../components/kanban/KanbanBoard';
import ConversationList from '../components/conversations/ConversationList';
import MetricsDashboard from '../components/metrics/MetricsDashboard';
import LeadDetailsPanel from '../components/leads/LeadDetailsPanel';
import BulkActionsBar from '../components/ui/BulkActionsBar';
import FilterPanel from '../components/ui/FilterPanel';
import { useTranslation } from 'react-i18next';

const TABS = {
  PIPELINE: 'pipeline',
  CONVERSATIONS: 'conversations',
  METRICS: 'metrics',
};

export default function SalesPipeline() {
  const { t } = useTranslation();
  const { state, actions } = useSales();
  const [activeTab, setActiveTab] = useState(TABS.PIPELINE);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    actions.fetchPipelineLeads();
    actions.fetchMetrics({ days: 7 });
  }, [actions]);

  // Handle lead selection
  const handleLeadSelect = useCallback((leadId) => {
    actions.selectLead(leadId);
    setShowLeadDetails(true);
  }, [actions]);

  // Handle lead stage change
  const handleStageChange = useCallback(async (leadId, newStageId) => {
    try {
      await actions.updateLeadStage(leadId, newStageId);
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  }, [actions]);

  // Handle bulk selection
  const handleBulkSelect = useCallback((leadId) => {
    setSelectedLeadIds(prev => 
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  }, []);

  // Handle bulk stage change
  const handleBulkStageChange = useCallback(async (stageId) => {
    // Implementation for bulk stage change
    console.log('Bulk move to stage:', stageId, selectedLeadIds);
  }, [selectedLeadIds]);

  return (
    <div className="sales-pipeline-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <h1>{t('sales.pipeline.title')}</h1>
          <span className="lead-count">
            {state.pipelineLeads.totalLeads || 0} {t('sales.leads')}
          </span>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-icon"
            onClick={() => setShowFilters(!showFilters)}
            title={t('common.filters')}
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          
          <button 
            className="btn-primary"
            onClick={() => {/* Open create lead modal */}}
          >
            {t('sales.leads.add')}
          </button>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <FilterPanel
          filters={state.filters}
          onFilterChange={actions.setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Bulk Actions Bar */}
      {selectedLeadIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedLeadIds.length}
          onStageChange={handleBulkStageChange}
          onClearSelection={() => setSelectedLeadIds([])}
        />
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === TABS.PIPELINE ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.PIPELINE)}
        >
          {t('sales.pipeline.kanban')}
        </button>
        <button 
          className={`tab ${activeTab === TABS.CONVERSATIONS ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.CONVERSATIONS)}
        >
          {t('sales.conversations.title')}
        </button>
        <button 
          className={`tab ${activeTab === TABS.METRICS ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.METRICS)}
        >
          {t('sales.metrics.title')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {state.loading && activeTab === TABS.PIPELINE ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            {activeTab === TABS.PIPELINE && (
              <KanbanBoard
                stages={state.stages}
                leadsByStage={state.pipelineLeads}
                selectedLeadIds={selectedLeadIds}
                onLeadSelect={handleLeadSelect}
                onStageChange={handleStageChange}
                onBulkSelect={handleBulkSelect}
              />
            )}
            
            {activeTab === TABS.CONVERSATIONS && (
              <ConversationList
                leads={state.leads}
                onLeadSelect={handleLeadSelect}
              />
            )}
            
            {activeTab === TABS.METRICS && (
              <MetricsDashboard
                metrics={state.metrics}
                stages={state.stages}
              />
            )}
          </>
        )}
      </div>

      {/* Lead Details Side Panel */}
      {showLeadDetails && state.selectedLead && (
        <LeadDetailsPanel
          lead={state.selectedLead}
          conversations={state.conversations}
          onClose={() => {
            setShowLeadDetails(false);
            actions.selectLead(null);
          }}
          onStageChange={handleStageChange}
        />
      )}
    </div>
  );
}
