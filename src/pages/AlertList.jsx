import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AlertListItem from '@/components/alerts/AlertListItem';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AlertList() {
  const [filter, setFilter] = useState('all');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts-list'],
    queryFn: () => base44.entities.Alert.filter({ status: 'active' }, '-created_date', 100),
    refetchInterval: 15000,
  });

  const activeAlerts = alerts.filter(a => {
    if (a.expires_at && new Date(a.expires_at) < Date.now()) return false;
    if (filter === 'emergency') return a.category === 'emergency';
    if (filter === 'speed') return a.category === 'speed';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#121212] pb-24">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-white text-2xl font-bold mb-1">Meldingen</h1>
        <p className="text-gray-500 text-sm">{activeAlerts.length} actieve meldingen</p>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-4 flex gap-2">
        {[
          { key: 'all', label: 'Alles' },
          { key: 'emergency', label: 'Hulpdiensten', icon: AlertTriangle, color: '#FF3B30' },
          { key: 'speed', label: 'Flitsers', icon: Camera, color: '#FF9500' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${filter === tab.key
                ? 'bg-[#2F80ED]/15 text-[#2F80ED] ring-1 ring-[#2F80ED]/30'
                : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#252525]'
              }`}
          >
            {tab.icon && <tab.icon size={14} style={{ color: filter === tab.key ? '#2F80ED' : tab.color }} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="px-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#2F80ED] animate-spin" />
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🛣️</div>
            <p className="text-gray-400 text-sm">Geen actieve meldingen</p>
            <p className="text-gray-600 text-xs mt-1">Ga naar de kaart om een melding te plaatsen</p>
          </div>
        ) : (
          activeAlerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={createPageUrl('MapView')}>
                <AlertListItem alert={alert} />
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}