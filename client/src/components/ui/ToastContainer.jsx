import React from 'react';
import PropTypes from 'prop-types';
import Toast from './Toast';

/**
 * ToastContainer - Contenedor para múltiples toasts
 */
export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    title: PropTypes.string,
    message: PropTypes.string,
    duration: PropTypes.number
  })),
  onRemove: PropTypes.func.isRequired
};

export default ToastContainer;

