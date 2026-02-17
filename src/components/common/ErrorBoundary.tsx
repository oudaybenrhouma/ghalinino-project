/**
 * Error Boundary Component
 * Ghalinino - Tunisia E-commerce
 * 
 * PURPOSE:
 * ========
 * Catches JavaScript errors anywhere in the component tree and displays
 * a fallback UI instead of crashing the entire app.
 * 
 * FEATURES:
 * =========
 * - Graceful error handling
 * - User-friendly error messages
 * - Development mode: shows error details
 * - Production mode: hides technical details
 * - Reset functionality to retry
 * - Navigation to safety (home page)
 * 
 * USAGE:
 * ======
 * Wrap your App component:
 * 
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * Or wrap specific routes:
 * 
 * <ErrorBoundary fallback={<CustomError />}>
 *   <CheckoutPage />
 * </ErrorBoundary>
 */

import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from './Button';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  /** Custom fallback UI to show on error */
  fallback?: ReactNode;
  /** Callback when error occurs (for logging) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show error details in UI (default: only in dev) */
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error, errorInfo);

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const isDevelopment = process.env.NODE_ENV === 'development';
      const showDetails = this.props.showDetails ?? isDevelopment;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Something went wrong
                  </h1>
                  <p className="text-red-100 text-sm mt-1">
                    We encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                We're sorry for the inconvenience. The error has been logged and
                we'll look into it. In the meantime, you can try the following:
              </p>

              {/* Actions */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Try refreshing the page</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Clear your browser cache</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Return to the home page</span>
                </div>
              </div>

              {/* Error Details (Development/Debug) */}
              {showDetails && this.state.error && (
                <details className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <summary className="cursor-pointer font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Technical Details
                  </summary>

                  <div className="space-y-3">
                    {/* Error Message */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Error:</p>
                      <pre className="text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>

                    {/* Stack Trace */}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          Component Stack:
                        </p>
                        <pre className="text-xs text-slate-600 bg-slate-100 p-3 rounded overflow-auto max-h-48">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="secondary" fullWidth>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} fullWidth>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Go Home
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                If this problem persists, please contact support with the error details above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

/**
 * Lightweight error boundary for specific sections
 */
export function SectionErrorBoundary({
  children,
  title = 'Section Error',
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-medium text-red-900">{title}</h3>
              <p className="text-sm text-red-700 mt-1">
                This section failed to load. Please try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}