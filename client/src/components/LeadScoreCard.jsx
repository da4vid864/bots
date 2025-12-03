import React from 'react';
import { useTranslation } from 'react-i18next';

const LeadScoreCard = ({ score = 0, tags = [] }) => {
  const { t } = useTranslation();

  const getScoreColor = (score) => {
    if (score < 30) return 'bg-red-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getScoreTextColor = (score) => {
    if (score < 30) return 'text-red-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
        {t('lead_score.title', 'Lead Score')}
      </h3>
      
      <div className="flex items-center mb-4">
        <div className="flex-1 mr-4">
          <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getScoreColor(score)} transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
            ></div>
          </div>
        </div>
        <span className={`text-2xl font-bold ${getScoreTextColor(score)}`}>
          {score}
        </span>
      </div>

      {tags && tags.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">
            {t('lead_score.tags', 'Tags')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadScoreCard;