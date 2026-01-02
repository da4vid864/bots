import React from 'react';
import PropTypes from 'prop-types';

/**
 * ProgressBar - Barra de progreso para operaciones largas
 * Accesible y animada
 */
export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  label = 'Progreso',
  showPercentage = true,
  size = 'md',
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className="flex items-center justify-between mb-1">
        {label && (
          <span className="text-sm font-medium text-slate-300">{label}</span>
        )}
        {showPercentage && (
          <span className="text-sm text-slate-400">{Math.round(percentage)}%</span>
        )}
      </div>
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  label: PropTypes.string,
  showPercentage: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default ProgressBar;

