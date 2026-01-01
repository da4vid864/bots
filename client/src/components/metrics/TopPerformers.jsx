import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TopPerformers({ performers }) {
  const { t } = useTranslation();

  if (!performers || performers.length === 0) {
    return (
      <div className="top-performers">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...performers.map(p => p.value));

  return (
    <div className="top-performers">
      {performers.map((performer, index) => {
        const width = maxValue > 0 ? (performer.value / maxValue) * 100 : 0;
        
        return (
          <div key={index} className="performer-item">
            <div className="performer-rank">#{index + 1}</div>
            <div className="performer-info">
              <div className="performer-header">
                <span className="performer-name">{performer.name}</span>
                <span className="performer-value">{performer.value}</span>
              </div>
              <div className="performer-bar">
                <div 
                  className="performer-fill"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
