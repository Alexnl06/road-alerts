import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Map, List, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPrompt from './components/InstallPrompt';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isDark = user?.theme !== 'light';

  const navItems = [
    { name: 'Map', label: 'Kaart', icon: Map, path: createPageUrl('Map') },
    { name: 'List', label: 'Lijst', icon: List, path: createPageUrl('List') },
    { name: 'Settings', label: 'Instellingen', icon: Settings, path: createPageUrl('Settings') },
  ];

  return (
    <ErrorBoundary>
      <div className={isDark ? "min-h-screen bg-[#0A0A0A]" : "min-h-screen bg-gray-50"}>
        <Toaster position="top-center" theme={isDark ? "dark" : "light"} />
        <InstallPrompt />
        <main className="pb-16">{children}</main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-[900] safe-area-inset-bottom ${
        isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = currentPageName === item.name;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full relative group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-x-2 top-0 h-0.5 bg-[#2F80ED] rounded-full"
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
                <Icon
                  size={22}
                  className={`mb-1 transition-colors ${
                    isActive ? 'text-[#2F80ED]' : isDark ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-800'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-[#2F80ED]' : isDark ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-800'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`
        @supports (padding: max(0px)) {
          .safe-area-inset-bottom {
            padding-bottom: max(env(safe-area-inset-bottom), 0px);
          }
        }
      `}</style>
      </div>
    </ErrorBoundary>
  );
}