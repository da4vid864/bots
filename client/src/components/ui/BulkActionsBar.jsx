import React from 'react';
import { useTranslation } from 'react-i18next';

export default function BulkActionsBar({ selectedCount, onStageChange, onClearSelection }) {
  const { t } = useTranslation();

  const stageOptions = [
    { id: 'new', label: t('stages.new') },
    { id: 'contacted', label: t('stages.contacted') },
    { id: 'scheduled', label: t('stages.scheduled') },
    { id: 'proposal', label: t('stages.proposal') },
    { id: 'negotiation', label: t('stages.negotiation') },
  ];

  return (
    <div className="bulk-actions-bar">
      <div className="actions-content">
        <span className="selected-count">
          {selectedCount} {t('sales.leads.selected')}
        </span>
        
        <div className="action-buttons">
          {/* Stage Change Dropdown */}
          <select 
            className="stage-select"
            onChange={(e) => {
              if (e.target.value) {
                onStageChange(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>{t('sales.bulk.moveToStage')}</option>
            {stageOptions.map(stage => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button className="action-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('sales.bulk.export')}
          </button>

          {/* Delete Button */}
          <button className="action-btn danger">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('sales.bulk.delete')}
          </button>

          {/* Clear Selection */}
          <button 
            className="action-btn secondary"
            onClick={onClearSelection}
          >
            {t('sales.bulk.clear')}
          </button>
        </div>
      </div>
    </div>
  );
}
