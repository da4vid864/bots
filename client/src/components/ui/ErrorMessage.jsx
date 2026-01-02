import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorMessage - Componente consistente para mostrar errores
 * Accesible y con buen contraste
 */
export const ErrorMessage = ({ 
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  className = ''
}) => {
  return (
    <div 
      className={`bg-red-900/20 border border-red-500/50 rounded-lg p-4 ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-100">
            {title}
          </h3>
          {message && (
            <p className="mt-1 text-sm text-red-200">
              {message}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm font-medium text-red-100 hover:text-red-50 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-900/20 rounded"
              >
                Reintentar
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm font-medium text-red-100 hover:text-red-50 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-900/20 rounded"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
  className: PropTypes.string
};

export default ErrorMessage;

