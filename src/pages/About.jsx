import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(createPageUrl('Settings'))}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Over deze app</h1>
        </div>

        <div className="space-y-6">
          {/* Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          >
            <div className="flex gap-3">
              <AlertCircle size={24} className="text-red-500 shrink-0" />
              <div>
                <h3 className="text-white font-semibold mb-2">Veiligheidswaarschuwing</h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Gebruik deze app NOOIT tijdens het rijden. Laat een passagier de app bedienen of stop veilig langs de weg. De bestuurder is verantwoordelijk voor veilig rijgedrag.
                </p>
              </div>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6"
          >
            <h3 className="text-white font-semibold mb-3">Over Road Alerts</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Road Alerts Nederland is een community-driven app voor real-time verkeersmeldingen. Gebruikers delen waarschuwingen over snelheidscontroles, ongevallen en wegwerkzaamheden.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Deze app is niet gelieerd aan Nederlandse overheidsinstanties en is gemaakt voor informatieve doeleinden.
            </p>
          </motion.div>

          {/* Data Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={20} className="text-[#2F80ED]" />
              <h3 className="text-white font-semibold">Data Bronnen</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <p className="font-medium text-white mb-1">Kaartdata</p>
                <p>© OpenStreetMap contributors</p>
                <a 
                  href="https://www.openstreetmap.org/copyright" 
                  target="_blank"
                  className="text-[#2F80ED] hover:underline"
                >
                  openstreetmap.org/copyright
                </a>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Verkeersinformatie</p>
                <p>OpenRouteService API</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Flitspaaldata</p>
                <p>OpenStreetMap - speed_camera tags</p>
              </div>
            </div>
          </motion.div>

          {/* Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-[#10B981]" />
              <h3 className="text-white font-semibold">Privacy</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              We verzamelen locatiedata voor real-time verkeersinformatie. Deze data wordt geanonimiseerd en niet gedeeld met derde partijen. Meldingen zijn openbaar zichtbaar maar niet gekoppeld aan persoonlijke gegevens.
            </p>
          </motion.div>

          {/* Version */}
          <div className="text-center text-gray-500 text-sm pt-4">
            Road Alerts Nederland v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}