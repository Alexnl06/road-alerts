import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, MapPin, Navigation, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ALERT_TYPES = [
  { type: 'ambulance', category: 'emergency', label: 'Ambulance', emoji: '🚑', color: '#00C853', bg: 'rgba(0,200,83,0.12)' },
  { type: 'fire', category: 'emergency', label: 'Brandweer', emoji: '🚒', color: '#FF3B30', bg: 'rgba(255,59,48,0.12)' },
  { type: 'police', category: 'emergency', label: 'Politie', emoji: '🚔', color: '#2979FF', bg: 'rgba(41,121,255,0.12)' },
  { type: 'undercover', category: 'emergency', label: 'Undercover', emoji: '🕵️', color: '#1A1A1A', bg: 'rgba(26,26,26,0.12)' },
  { type: 'other', category: 'emergency', label: 'Overig', emoji: '⚠️', color: '#FFC107', bg: 'rgba(255,193,7,0.12)' },
  { type: 'mobile_check', category: 'speed', label: 'Mobiele flitser', emoji: '📸', color: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
  { type: 'fixed_camera', category: 'speed', label: 'Vaste flitser', emoji: '📷', color: '#9C27B0', bg: 'rgba(156,39,176,0.12)' },
  { type: 'average_speed_zone', category: 'speed', label: 'Trajectcontrole', emoji: '🛣️', color: '#00BCD4', bg: 'rgba(0,188,212,0.12)' },
  { type: 'accident', category: 'hazard', label: 'Ongeval', emoji: '💥', color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' },
  { type: 'roadworks', category: 'hazard', label: 'Wegwerkzaamheden', emoji: '🚧', color: '#FFA500', bg: 'rgba(255,165,0,0.12)' },
  { type: 'stationary_vehicle', category: 'hazard', label: 'Stilstaand voertuig', emoji: '🚗', color: '#9E9E9E', bg: 'rgba(158,158,158,0.12)' },
  { type: 'animal', category: 'hazard', label: 'Dier op de weg', emoji: '🦌', color: '#8BC34A', bg: 'rgba(139,195,74,0.12)' },
  { type: 'object', category: 'hazard', label: 'Object op de weg', emoji: '📦', color: '#795548', bg: 'rgba(121,85,72,0.12)' },
];

export default function ReportSheet({ isOpen, onClose, onSubmit, userLocation }) {
  const [step, setStep] = useState('select'); // select | details
  const [selectedType, setSelectedType] = useState(null);
  const [direction, setDirection] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (alertType) => {
    setSelectedType(alertType);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedType || !userLocation) return;
    setSubmitting(true);

    const expiresMinutes = selectedType.category === 'emergency' ? 15 :
      selectedType.category === 'hazard' ? 45 :
      selectedType.type === 'mobile_check' ? 30 :
      selectedType.type === 'average_speed_zone' ? 60 : null;

    const expiresAt = expiresMinutes
      ? new Date(Date.now() + expiresMinutes * 60000).toISOString()
      : null;

    await onSubmit({
      category: selectedType.category,
      type: selectedType.type,
      lat: userLocation[0],
      lng: userLocation[1],
      status: 'active',
      confirm_count: 1,
      deny_count: 0,
      direction_text: direction || undefined,
      note: note || undefined,
      expires_at: expiresAt,
    });

    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep('select');
    setSelectedType(null);
    setDirection('');
    setNote('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[1000]"
            onClick={resetAndClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-[#1E1E1E] rounded-t-3xl max-h-[85vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mt-3" />

            <div className="p-5 pb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white text-xl font-bold">
                  {step === 'select' ? 'Wat wil je melden?' : 'Details'}
                </h2>
                <button onClick={resetAndClose} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {step === 'select' && (
                <div className="space-y-3">
                  <p className="text-gray-400 text-xs mb-4 uppercase tracking-wider font-medium">Hulpdiensten</p>
                  <div className="grid grid-cols-2 gap-3">
                    {ALERT_TYPES.filter(a => a.category === 'emergency').map(alertType => (
                      <button
                        key={alertType.type}
                        onClick={() => handleSelect(alertType)}
                        className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 hover:brightness-110"
                        style={{ background: alertType.bg, border: `1px solid ${alertType.color}22` }}
                      >
                        <span className="text-2xl">{alertType.emoji}</span>
                        <span className="text-white text-sm font-medium">{alertType.label}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-gray-400 text-xs mt-6 mb-4 uppercase tracking-wider font-medium">Snelheidscontroles</p>
                  <div className="grid grid-cols-2 gap-3">
                    {ALERT_TYPES.filter(a => a.category === 'speed').map(alertType => (
                      <button
                        key={alertType.type}
                        onClick={() => handleSelect(alertType)}
                        className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 hover:brightness-110"
                        style={{ background: alertType.bg, border: `1px solid ${alertType.color}22` }}
                      >
                        <span className="text-2xl">{alertType.emoji}</span>
                        <span className="text-white text-sm font-medium">{alertType.label}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-gray-400 text-xs mt-6 mb-4 uppercase tracking-wider font-medium">Gevaren</p>
                  <div className="grid grid-cols-2 gap-3">
                    {ALERT_TYPES.filter(a => a.category === 'hazard').map(alertType => (
                      <button
                        key={alertType.type}
                        onClick={() => handleSelect(alertType)}
                        className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 hover:brightness-110"
                        style={{ background: alertType.bg, border: `1px solid ${alertType.color}22` }}
                      >
                        <span className="text-2xl">{alertType.emoji}</span>
                        <span className="text-white text-sm font-medium">{alertType.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 'details' && selectedType && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: selectedType.bg }}>
                    <span className="text-3xl">{selectedType.emoji}</span>
                    <div>
                      <p className="text-white font-semibold">{selectedType.label}</p>
                      <p className="text-gray-400 text-xs">Wordt gemeld op je huidige locatie</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[#2A2A2A] rounded-xl">
                    <MapPin size={18} className="text-[#2F80ED] shrink-0" />
                    <span className="text-gray-300 text-sm">
                      {userLocation ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : 'Locatie wordt bepaald...'}
                    </span>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Richting (optioneel)</label>
                    <div className="relative">
                      <Navigation size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <Input
                        value={direction}
                        onChange={(e) => setDirection(e.target.value)}
                        placeholder="bijv. richting Amsterdam"
                        className="bg-[#2A2A2A] border-0 text-white pl-10 h-12 rounded-xl placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Notitie (optioneel, max 120 tekens)</label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value.slice(0, 120))}
                      placeholder="Extra details..."
                      maxLength={120}
                      className="bg-[#2A2A2A] border-0 text-white rounded-xl placeholder:text-gray-600 resize-none h-20"
                    />
                    <span className="text-gray-600 text-xs mt-1 block text-right">{note.length}/120</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep('select')}
                      className="flex-1 h-14 rounded-2xl bg-[#2A2A2A] border-0 text-white hover:bg-[#333] text-base"
                    >
                      Terug
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-[2] h-14 rounded-2xl bg-[#2F80ED] hover:bg-[#2570D4] text-white text-base font-semibold"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Melden...
                        </span>
                      ) : 'Bevestig melding'}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-gray-600 text-[10px] text-center mt-6">
                ⚠️ Gebruik deze app niet tijdens het rijden. Verkeersveiligheid eerst.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}