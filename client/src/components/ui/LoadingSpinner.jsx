import React from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingSpinner - Componente reutilizable para estados de carga
 * Accesible y consistente con el tema oscuro
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  label = 'Cargando...',
  fullScreen = false 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const spinner = (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <div
        className={`${sizes[size]} border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-slate-300 text-sm font-medium">{label}</p>
        </div>
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  label: PropTypes.string,
  fullScreen: PropTypes.bool
};

export default LoadingSpinner;

