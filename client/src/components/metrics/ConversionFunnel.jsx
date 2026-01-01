import React from 'react';

export default function ConversionFunnel({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="conversion-funnel">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="conversion-funnel">
      {data.map((stage, index) => {
        const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const conversionRate = index > 0 
          ? ((stage.count / data[index - 1].count) * 100).toFixed(1)
          : 100;

        return (
          <div key={index} className="funnel-stage">
            <div className="funnel-bar-container">
              <div 
                className="funnel-bar"
                style={{ 
                  width: `${width}%`,
                  backgroundColor: stage.color || '#3B82F6'
                }}
              >
                <span className="funnel-count">{stage.count}</span>
              </div>
            </div>
            <div className="funnel-info">
              <span className="funnel-name">{stage.name}</span>
              {index > 0 && (
                <span className="funnel-conversion">{conversionRate}%</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
