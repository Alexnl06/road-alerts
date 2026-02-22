import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Users, Lock, Check, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const STEPS = [
  {
    icon: ShieldAlert,
    title: 'Veiligheid Voorop',
    description: 'Gebruik deze app NOOIT tijdens het rijden. Laat de passagier bedienen of stop veilig.',
    color: '#EF4444'
  },
  {
    icon: Users,
    title: 'Community Regels',
    description: 'Plaats alleen correcte meldingen. Misleidende of spam meldingen worden verwijderd.',
    color: '#F59E0B'
  },
  {
    icon: Lock,
    title: 'Privacy',
    description: 'We verzamelen locatiedata voor real-time verkeersinformatie. Data wordt geanonimiseerd.',
    color: '#10B981'
  }
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else if (agreed) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await base44.auth.updateMe({
        onboarding_completed: true,
        privacy_accepted: true,
      });
      navigate(createPageUrl('Map'));
    } catch (error) {
      console.error('Onboarding error:', error);
    }
  };

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${currentStep.color}20` }}
              >
                <Icon size={48} style={{ color: currentStep.color }} />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-white">
                {currentStep.title}
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Agreement Checkbox (last step) */}
            {isLastStep && (
              <motion.label
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-4 bg-[#1E1E1E] rounded-xl cursor-pointer border border-[#2A2A2A]"
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-300">
                  Ik ga akkoord met de regels en begrijp dat deze app niet bedoeld is voor gebruik tijdens het rijden.
                </span>
              </motion.label>
            )}

            {/* Progress */}
            <div className="flex gap-2 justify-center">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === step ? 'w-8 bg-[#2F80ED]' : 'w-1.5 bg-[#2A2A2A]'
                  }`}
                />
              ))}
            </div>

            {/* Button */}
            <button
              onClick={handleNext}
              disabled={isLastStep && !agreed}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                isLastStep && !agreed
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-[#2F80ED] hover:bg-[#2570D4]'
              }`}
            >
              {isLastStep ? (
                <>
                  <Check size={20} />
                  Start de app
                </>
              ) : (
                <>
                  Volgende
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}