import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Volume2, MapPin, Wifi, Zap, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const FEATURES = [
  { icon: Volume2, title: 'Voice Alerts', description: 'Gesproken waarschuwingen tijdens het rijden' },
  { icon: MapPin, title: '10km Radius', description: 'Zie alle meldingen tot 10km verderop' },
  { icon: Wifi, title: 'Offline Kaarten', description: 'Download kaarten voor offline gebruik' },
  { icon: Zap, title: 'AI Route Optimalisatie', description: 'Slimme routes met real-time verkeer' },
];

export default function PremiumPage() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleSubscribe = () => {
    // TODO: Integrate payment provider
    alert('Betaling komt binnenkort beschikbaar!');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(createPageUrl('Settings'))}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Crown size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Upgrade naar Premium
          </h1>
          <p className="text-gray-400 text-lg">
            Krijg toegang tot geavanceerde functies
          </p>
        </motion.div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#1E1E1E] rounded-xl p-4 flex items-start gap-4 border border-[#2A2A2A]"
              >
                <div className="w-12 h-12 rounded-lg bg-[#2F80ED]/10 flex items-center justify-center shrink-0">
                  <Icon size={24} className="text-[#2F80ED]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#2F80ED] to-[#1E5BB8] rounded-2xl p-6 mb-6"
        >
          <div className="text-center text-white">
            <p className="text-sm mb-2">Jaarlijks</p>
            <p className="text-5xl font-bold mb-1">€29,99</p>
            <p className="text-sm opacity-80">€2,50 per maand</p>
          </div>
          
          <div className="mt-6 space-y-2">
            {['Geen advertenties', 'Alle premium features', 'Annuleer altijd'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white text-sm">
                <Check size={16} />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          className="w-full py-4 rounded-xl bg-white text-[#0A0A0A] font-bold text-lg hover:bg-gray-100 transition-colors"
        >
          Start Premium
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Automatische verlenging. Annuleer altijd.
        </p>
      </div>
    </div>
  );
}