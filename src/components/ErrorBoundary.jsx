import React from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const isDark = true; // Default to dark for error screen

      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'
        }`}>
          <div className={`max-w-md w-full rounded-2xl p-6 text-center ${
            isDark ? 'bg-[#1E1E1E] border border-[#2A2A2A]' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <h1 className={`text-2xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Er ging iets mis
            </h1>
            
            <p className={`text-sm mb-6 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Het scherm is gecrasht. Ga terug naar de kaart en probeer opnieuw.
            </p>

            {this.state.error && (
              <details className={`text-left text-xs mb-4 p-3 rounded-lg ${
                isDark ? 'bg-[#2A2A2A] text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                <summary className="cursor-pointer font-semibold mb-2">
                  Technische details
                </summary>
                <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.href = '/Map';
                }}
                className={`flex-1 px-4 py-3 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-[#2A2A2A] text-white hover:bg-[#333]' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                <Home size={18} />
                Terug naar kaart
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 rounded-2xl bg-[#2F80ED] text-white font-semibold hover:bg-[#2570D4] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Opnieuw laden
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;