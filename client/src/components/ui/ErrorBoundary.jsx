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
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo }) {
  const { t } = useTranslation();
  
  return (
    <div className="error-fallback">
      <div className="error-icon">⚠️</div>
      <h2>{t('errors.somethingWentWrong')}</h2>
      <p className="error-message">
        {error?.message || t('errors.unknownError')}
      </p>
      <div className="error-actions">
        <button 
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          {t('errors.reloadPage')}
        </button>
        {this.props.onRetry && (
          <button 
            className="btn-secondary"
            onClick={this.props.onRetry}
          >
            {t('errors.tryAgain')}
          </button>
        )}
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="error-details">
          <summary>{t('errors.viewDetails')}</summary>
          <pre>{error?.stack}</pre>
          {errorInfo && <pre>{errorInfo.componentStack}</pre>}
        </details>
      )}
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
