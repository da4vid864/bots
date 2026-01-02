import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card - Componente de tarjeta reutilizable
 * Consistente con el tema oscuro
 */
export const Card = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  hover = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-xl border border-slate-800';
  const hoverStyles = hover || onClick ? 'hover:border-slate-700 transition-all duration-200 cursor-pointer hover-lift' : '';
  const interactiveStyles = onClick ? '' : '';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-800">
          {title && (
            <h3 className="text-lg font-bold text-white">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  footer: PropTypes.node,
  className: PropTypes.string,
  hover: PropTypes.bool,
  onClick: PropTypes.func
};

export default Card;

