import React, { Component } from 'react';
import { useTranslation } from 'react-i18next';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send to error tracking service (Sentry, Datadog, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} onRetry={this.props.onRetry} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo, onRetry }) {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" role="alert">
      <div className="max-w-2xl w-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-red-500/50 p-8 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('errors.somethingWentWrong') || 'Algo salió mal'}
        </h2>
        <p className="text-slate-400 mb-6">
          {error?.message || t('errors.unknownError') || 'Ha ocurrido un error inesperado'}
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            onClick={() => window.location.reload()}
          >
            {t('errors.reloadPage') || 'Recargar página'}
          </button>
          {onRetry && (
            <button 
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              onClick={onRetry}
            >
              {t('errors.tryAgain') || 'Intentar de nuevo'}
            </button>
          )}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
              {t('errors.viewDetails') || 'Ver detalles'}
            </summary>
            <div className="mt-4 p-4 bg-slate-900 rounded-lg overflow-auto">
              <pre className="text-xs text-red-300 whitespace-pre-wrap">{error?.stack}</pre>
              {errorInfo && <pre className="text-xs text-slate-400 mt-4 whitespace-pre-wrap">{errorInfo.componentStack}</pre>}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// Higher-order component wrapper for functional components
export function withErrorBoundary(WrappedComponent, errorBoundaryProps = {}) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook-based error boundary alternative for functional components
export function useErrorHandler(errorBoundaryProps = {}) {
  const [error, setError] = React.useState(null);

  if (error) {
    throw error;
  }

  return setError;
}

export default ErrorBoundary;
