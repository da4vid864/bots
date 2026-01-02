import React from 'react';
import PropTypes from 'prop-types';

/**
 * Skeleton - Componente de carga esqueleto
 * Mejora la percepción de velocidad de carga
 */
export const Skeleton = ({ 
  variant = 'text',
  width,
  height,
  className = '',
  lines = 1,
  rounded = true
}) => {
  const baseStyles = 'animate-pulse bg-slate-800';
  const roundedStyles = rounded ? 'rounded' : '';

  if (variant === 'text') {
    return (
      <div className={`${baseStyles} ${roundedStyles} ${className}`} role="status" aria-label="Cargando">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} ${roundedStyles} h-4 mb-2 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            style={width ? { width } : {}}
          />
        ))}
        <span className="sr-only">Cargando contenido...</span>
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`${baseStyles} rounded-full ${className}`}
        style={{ width: width || height || 40, height: height || width || 40 }}
        role="status"
        aria-label="Cargando"
      >
        <span className="sr-only">Cargando...</span>
      </div>
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={`${baseStyles} ${roundedStyles} ${className}`}
        style={{ width: width || '100%', height: height || 200 }}
        role="status"
        aria-label="Cargando"
      >
        <span className="sr-only">Cargando contenido...</span>
      </div>
    );
  }

  return null;
};

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'circular', 'rectangular']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  lines: PropTypes.number,
  rounded: PropTypes.bool
};

export default Skeleton;

