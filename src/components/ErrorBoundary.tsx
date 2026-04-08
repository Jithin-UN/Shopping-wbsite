import * as React from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if ((this as any).state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isFirestoreError = false;

      try {
        if ((this as any).state.error?.message) {
          const parsed = JSON.parse((this as any).state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore Error (${parsed.operationType}): ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        errorMessage = (this as any).state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
            <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left">
              <p className="text-sm font-mono text-gray-600 break-words">
                {errorMessage}
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100"
              >
                <RefreshCcw size={20} />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
              >
                <Home size={20} />
                <span>Back to Home</span>
              </button>
            </div>
            {isFirestoreError && (
              <p className="mt-6 text-xs text-gray-400 italic">
                This error has been logged for our administrators to investigate.
              </p>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
