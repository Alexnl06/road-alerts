import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ALERT_CONFIG } from '../components/map/AlertMarker';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, ThumbsUp, ThumbsDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ListPage() {
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isDark = user?.theme !== 'light';

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const allAlerts = await base44.entities.Alert.list('-created_date', 500);
      const now = new Date();
      return allAlerts.filter(alert => {
        if (alert.status !== 'active') return false;
        if (alert.expires_at && new Date(alert.expires_at) < now) return false;
        return true;
      });
    },
    refetchInterval: 30000,
  });

  const filteredAlerts = alerts.filter(alert => {
    if (category !== 'all' && alert.category !== category) return false;
    if (searchQuery) {
      const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.unknown;
      return config.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.note?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="p-4 space-y-4">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Meldingen</h1>

        <div className="relative">
          <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek meldingen..."
            className={`border-0 pl-10 h-12 rounded-xl ${
              isDark ? 'bg-[#1E1E1E] text-white placeholder:text-gray-600' : 'bg-white text-gray-900 placeholder:text-gray-400'
            }`}
          />
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className={`w-full ${isDark ? 'bg-[#1E1E1E]' : 'bg-white border border-gray-200'}`}>
            <TabsTrigger value="all" className="flex-1">Alles</TabsTrigger>
            <TabsTrigger value="emergency" className="flex-1">Hulpdiensten</TabsTrigger>
            <TabsTrigger value="speed" className="flex-1">Flitsers</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {filteredAlerts.length} actieve {filteredAlerts.length === 1 ? 'melding' : 'meldingen'}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const config = ALERT_CONFIG[alert.type] || { label: 'Onbekend', emoji: '⚠️', color: '#FFC107' };
              const timeLeft = alert.expires_at
                ? Math.max(0, Math.round((new Date(alert.expires_at) - Date.now()) / 60000))
                : null;

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl p-4 border transition-colors ${
                    isDark 
                      ? 'bg-[#1E1E1E] border-[#2A2A2A] hover:border-[#3A3A3A]' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: `${config.color}22` }}
                    >
                      {config.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{config.label}</h3>
                        {timeLeft !== null && (
                          <div className={`flex items-center gap-1 text-xs shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Clock size={12} />
                            {timeLeft > 0 ? `${timeLeft}m` : 'Verlopen'}
                          </div>
                        )}
                      </div>
                      <div className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {format(new Date(alert.created_date), "HH:mm 'op' d MMM", { locale: nl })}
                      </div>
                      {alert.direction_text && (
                        <div className={`flex items-center gap-1 text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <MapPin size={12} />
                          {alert.direction_text}
                        </div>
                      )}
                      {alert.note && (
                        <p className={`text-xs italic mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>"{alert.note}"</p>
                      )}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-green-400">
                          <ThumbsUp size={12} /> {alert.confirm_count || 0}
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <ThumbsDown size={12} /> {alert.deny_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAlerts.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                <p className="text-4xl mb-3">🔍</p>
                <p>Geen meldingen gevonden</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}