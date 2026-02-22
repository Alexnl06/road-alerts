import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';

export default function RouteErrorCard({ onRetry, onNewDestination, error, isDark }) {
  const [retryDisabled, setRetryDisabled] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    // If rate limit error, disable retry for 10 seconds
    if (error && (error.includes('Te veel') || error.includes('wacht') || error.includes('429'))) {
      setRetryDisabled(true);
      setCountdown(10);

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setRetryDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [error]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className={`fixed bottom-0 left-0 right-0 z-[950] rounded-t-3xl ${
        isDark ? 'bg-[#1E1E1E]' : 'bg-white'
      } p-6 pb-8`}
    >
      <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6" />
      
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {(error?.includes('Te veel') || error?.includes('wacht') || error?.includes('429')) 
            ? 'Te veel route-aanvragen' 
            : 'Route kon niet worden berekend'}
        </h3>
        
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {error || 'Er is iets misgegaan bij het ophalen van de route. Probeer het opnieuw.'}
        </p>
        
        {(error?.includes('Te veel') || error?.includes('wacht') || error?.includes('429')) && (
          <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            ⏳ Wacht {countdown}s seconden en probeer opnieuw
          </p>
        )}

        {!(error?.includes('Te veel') || error?.includes('wacht') || error?.includes('429')) && error?.includes('seconden') && (
          <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            💡 Tip: Controleer je internetverbinding
          </p>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={onNewDestination}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              isDark 
                ? 'bg-[#2A2A2A] text-white hover:bg-[#333]' 
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            <Search size={18} className="inline mr-2" />
            Andere bestemming
          </button>
          <button
            onClick={onRetry}
            disabled={retryDisabled}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              retryDisabled
                ? isDark ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#2F80ED] hover:bg-[#2570D4] text-white'
            }`}
          >
            <RefreshCw size={18} className={`inline mr-2 ${retryDisabled ? 'opacity-50' : ''}`} />
            {retryDisabled ? `Wacht ${countdown}s` : 'Opnieuw proberen'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}