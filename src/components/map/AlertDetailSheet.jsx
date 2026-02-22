import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown, Flag, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ALERT_CONFIG } from './AlertMarker';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AlertDetailSheet({ alert, isOpen, onClose, onVote, onFlag }) {
  const [voting, setVoting] = useState(false);
  const [flagging, setFlagging] = useState(false);

  if (!alert) return null;
  const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.unknown;

  // Calculate trust score
  const totalVotes = (alert.confirm_count || 0) + (alert.deny_count || 0);
  const trustScore = totalVotes > 0 
    ? Math.round(((alert.confirm_count || 0) / totalVotes) * 100)
    : 100;
  
  const getTrustLevel = (score) => {
    if (score >= 70) return { label: 'Hoog', color: '#10B981' };
    if (score >= 40) return { label: 'Normaal', color: '#F59E0B' };
    return { label: 'Laag', color: '#EF4444' };
  };
  
  const trustLevel = getTrustLevel(trustScore);

  const handleVote = async (vote) => {
    setVoting(true);
    await onVote(alert.id, vote);
    setVoting(false);
  };

  const handleFlag = async () => {
    setFlagging(true);
    await onFlag(alert.id);
    setFlagging(false);
  };

  const timeLeft = alert.expires_at
    ? Math.max(0, Math.round((new Date(alert.expires_at) - Date.now()) / 60000))
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[1000]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-[#1E1E1E] rounded-t-3xl"
          >
            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mt-3" />
            <div className="p-5 pb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${config.color}22` }}
                  >
                    {config.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-lg">{config.label}</h3>
                      <div 
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${trustLevel.color}20`, 
                          color: trustLevel.color 
                        }}
                      >
                        <Shield size={10} />
                        {trustLevel.label}
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs">
                      {format(new Date(alert.created_date), "HH:mm 'op' d MMM", { locale: nl })}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              {timeLeft !== null && (
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4 bg-[#2A2A2A] rounded-xl p-3">
                  <Clock size={14} />
                  <span>{timeLeft > 0 ? `Verloopt over ${timeLeft} min` : 'Verlopen'}</span>
                </div>
              )}

              {alert.direction_text && (
                <p className="text-gray-300 text-sm mb-2">📍 Richting: {alert.direction_text}</p>
              )}
              {alert.note && (
                <p className="text-gray-400 text-sm italic mb-4">"{alert.note}"</p>
              )}

              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-center gap-1.5 text-green-400 text-sm">
                  <ThumbsUp size={14} /> {alert.confirm_count || 0} bevestigd
                </div>
                <div className="flex items-center gap-1.5 text-red-400 text-sm">
                  <ThumbsDown size={14} /> {alert.deny_count || 0} ontkend
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-400 text-center">Is deze melding nog actueel?</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVote('confirm')}
                    disabled={voting}
                    className="flex-1 h-12 rounded-2xl bg-green-600/20 hover:bg-green-600/30 text-green-400 border-0"
                  >
                    <ThumbsUp size={18} className="mr-2" /> Ja
                  </Button>
                  <Button
                    onClick={() => handleVote('deny')}
                    disabled={voting}
                    className="flex-1 h-12 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border-0"
                  >
                    <ThumbsDown size={18} className="mr-2" /> Nee
                  </Button>
                  <Button
                    onClick={handleFlag}
                    disabled={flagging}
                    variant="ghost"
                    className="h-12 w-12 rounded-2xl text-gray-500 hover:text-orange-400 hover:bg-orange-500/10"
                  >
                    <Flag size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}