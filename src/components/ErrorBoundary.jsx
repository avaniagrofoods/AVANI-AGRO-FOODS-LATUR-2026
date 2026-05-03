import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '100px 24px',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc'
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444', marginBottom: '16px' }}>
            Something went wrong.
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '32px', maxWidth: '500px' }}>
            We've encountered an unexpected error. Don't worry, our team has been notified.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '14px 32px',
              background: '#22c55e',
              color: 'white',
              borderRadius: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Return to Homepage
          </button>
          {import.meta.env.DEV && (
            <pre style={{
              marginTop: '40px',
              padding: '20px',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '0.8rem',
              textAlign: 'left',
              maxWidth: '800px',
              overflow: 'auto'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
