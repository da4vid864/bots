import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ScoreBreakdown({ breakdown, total }) {
  const { t } = useTranslation();

  if (!breakdown || Object.keys(breakdown).length === 0) {
    return (
      <div className="score-breakdown">
        <div className="score-total">
          <span className="total-label">Total Score</span>
          <span className="total-value">{total || 0}</span>
        </div>
        <p className="text-gray-500">No breakdown available</p>
      </div>
    );
  }

  const categories = [
    { key: 'engagement', label: t('scoring.engagement') },
    { key: 'intent', label: t('scoring.intent') },
    { key: 'demographics', label: t('scoring.demographics') },
    { key: 'behavior', label: t('scoring.behavior') },
    { key: 'history', label: t('scoring.history') },
  ];

  const maxCategoryScore = 100;

  return (
    <div className="score-breakdown">
      {/* Total Score */}
      <div className="score-total">
        <span className="total-label">Total Score</span>
        <span className="total-value">{total || 0}</span>
      </div>

      {/* Category Breakdown */}
      <div className="breakdown-categories">
        {categories.map(cat => {
          const value = breakdown[cat.key] || 0;
          const percentage = (value / maxCategoryScore) * 100;
          
          return (
            <div key={cat.key} className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-label">{cat.label}</span>
                <span className="breakdown-value">{value}</span>
              </div>
              <div className="breakdown-bar">
                <div 
                  className="breakdown-fill"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: getScoreColor(value, maxCategoryScore)
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getScoreColor(value, max) {
  const percentage = (value / max) * 100;
  if (percentage >= 70) return '#22C55E';
  if (percentage >= 30) return '#EAB308';
  return '#EF4444';
}
