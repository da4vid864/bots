import React from 'react';
import { useTranslation } from 'react-i18next';

export default function FilterPanel({ filters, onFilterChange, onClose }) {
  const { t } = useTranslation();

  // Handle filter change
  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  // Clear all filters
  const handleClearAll = () => {
    onFilterChange({
      search: '',
      stage: '',
      intentLevel: '',
      assignedTo: '',
      dateRange: 'all',
      scoreRange: 'all',
      tags: [],
    });
  };

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>{t('common.filters')}</h3>
        <div className="filter-actions">
          <button 
            className="clear-btn"
            onClick={handleClearAll}
          >
            {t('common.clearAll')}
          </button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="filter-content">
        {/* Search */}
        <div className="filter-group">
          <label>{t('sales.filters.search')}</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder={t('sales.filters.searchPlaceholder')}
          />
        </div>

        {/* Stage Filter */}
        <div className="filter-group">
          <label>{t('sales.filters.pipelineStage')}</label>
          <select
            value={filters.stage || ''}
            onChange={(e) => handleFilterChange('stage', e.target.value)}
          >
            <option value="">{t('common.all')}</option>
            <option value="new">{t('stages.new')}</option>
            <option value="contacted">{t('stages.contacted')}</option>
            <option value="scheduled">{t('stages.scheduled')}</option>
            <option value="proposal">{t('stages.proposal')}</option>
            <option value="negotiation">{t('stages.negotiation')}</option>
            <option value="won">{t('stages.won')}</option>
            <option value="lost">{t('stages.lost')}</option>
          </select>
        </div>

        {/* Intent Level Filter */}
        <div className="filter-group">
          <label>{t('sales.filters.intentLevel')}</label>
          <select
            value={filters.intentLevel || ''}
            onChange={(e) => handleFilterChange('intentLevel', e.target.value)}
          >
            <option value="">{t('common.all')}</option>
            <option value="hot">{t('sales.intent.hot')}</option>
            <option value="warm">{t('sales.intent.warm')}</option>
            <option value="cold">{t('sales.intent.cold')}</option>
          </select>
        </div>

        {/* Score Range Filter */}
        <div className="filter-group">
          <label>{t('sales.filters.leadScore')}</label>
          <select
            value={filters.scoreRange || 'all'}
            onChange={(e) => handleFilterChange('scoreRange', e.target.value)}
          >
            <option value="all">{t('common.all')}</option>
            <option value="high">{t('sales.filters.scoreHigh')}</option>
            <option value="medium">{t('sales.filters.scoreMedium')}</option>
            <option value="low">{t('sales.filters.scoreLow')}</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="filter-group">
          <label>{t('sales.filters.dateRange')}</label>
          <select
            value={filters.dateRange || 'all'}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="all">{t('common.all')}</option>
            <option value="today">{t('sales.filters.today')}</option>
            <option value="yesterday">{t('sales.filters.yesterday')}</option>
            <option value="week">{t('sales.filters.thisWeek')}</option>
            <option value="month">{t('sales.filters.thisMonth')}</option>
          </select>
        </div>

        {/* Assigned To Filter */}
        <div className="filter-group">
          <label>{t('sales.filters.assignedTo')}</label>
          <select
            value={filters.assignedTo || ''}
            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
          >
            <option value="">{t('common.all')}</option>
            <option value="me">{t('sales.filters.assignedToMe')}</option>
            <option value="unassigned">{t('sales.filters.unassigned')}</option>
            {/* Additional users would be populated from state */}
          </select>
        </div>
      </div>

      {/* Apply Button */}
      <div className="filter-footer">
        <button className="apply-btn" onClick={onClose}>
          {t('common.applyFilters')}
        </button>
      </div>
    </div>
  );
}
