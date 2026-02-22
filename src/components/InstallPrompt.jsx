import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('installPromptDismissed')) {
      setDismissed(true);
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Android Chrome install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = window.navigator.standalone === true;
    
    if (isIOS && !isInStandaloneMode) {
      // Show iOS prompt after 3 seconds
      setTimeout(() => {
        setShowIOSPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
    setShowAndroidPrompt(false);
  };

  const handleDismiss = () => {
    setShowAndroidPrompt(false);
    setShowIOSPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <>
      {/* Android Install Prompt */}
      <AnimatePresence>
        {showAndroidPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-[1000] backdrop-blur-xl bg-[#1E1E1E]/95 border border-[#2A2A2A] rounded-2xl p-4 shadow-2xl"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-[#2F80ED]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Download size={24} className="text-[#2F80ED]" />
              </div>
              
              <div className="flex-1 pr-6">
                <h3 className="text-white font-semibold mb-1">
                  Installeer Road Alerts
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Voeg de app toe aan je startscherm voor snelle toegang
                </p>
                
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-[#2F80ED] hover:bg-[#2570D4] text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Installeren
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Install Instructions */}
      <AnimatePresence>
        {showIOSPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-[1000] backdrop-blur-xl bg-[#1E1E1E]/95 border border-[#2A2A2A] rounded-2xl p-4 shadow-2xl"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-[#2F80ED]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Share size={24} className="text-[#2F80ED]" />
              </div>
              
              <div className="flex-1 pr-6">
                <h3 className="text-white font-semibold mb-1">
                  Installeer Road Alerts
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  Tik op <Share size={14} className="inline mx-1" /> en kies "Zet op beginscherm"
                </p>
                
                <div className="bg-[#2A2A2A]/50 rounded-lg p-3 space-y-1.5 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2F80ED] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Tik op <Share size={12} className="inline" /> onderaan je scherm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2F80ED] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Scroll en kies "Zet op beginscherm"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2F80ED] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Tik op "Voeg toe"</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}