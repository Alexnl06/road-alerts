import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Mail, MessageCircle, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function SupportPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isDark = user?.theme !== 'light';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link 
          to={createPageUrl('Map')} 
          className={`inline-flex items-center gap-2 mb-6 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ArrowLeft size={20} />
          <span>Terug naar kaart</span>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Support & Help</h1>
        <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Hoe kunnen we je helpen?
        </p>
        
        <div className="space-y-4 mb-8">
          {/* Contact Card */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-[#1E1E1E] border border-[#2A2A2A]' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2F80ED]/20 flex items-center justify-center flex-shrink-0">
                <Mail size={24} className="text-[#2F80ED]" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Email Support</h2>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  We reageren meestal binnen 24 uur
                </p>
                <a 
                  href="mailto:support@roadalerts.nl"
                  className="inline-flex items-center gap-2 text-[#2F80ED] hover:text-[#2570D4] font-medium"
                >
                  support@roadalerts.nl
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-[#1E1E1E] border border-[#2A2A2A]' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#2F80ED]/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={24} className="text-[#2F80ED]" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Veelgestelde Vragen</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Antwoorden op veelvoorkomende vragen
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <details className={`group ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <summary className="cursor-pointer font-medium">
                  Hoe plaats ik een melding?
                </summary>
                <p className={`mt-2 text-sm pl-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tik op de "Melding" knop rechtsonder in de kaart en kies het type melding. 
                  Vul eventueel extra details in en bevestig.
                </p>
              </details>

              <details className={`group ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <summary className="cursor-pointer font-medium">
                  Waarom zie ik geen meldingen?
                </summary>
                <p className={`mt-2 text-sm pl-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Controleer of je locatievoorzieningen hebt ingeschakeld en of je internetverbinding werkt. 
                  Check ook je filters in het filtermenu rechtsboven.
                </p>
              </details>

              <details className={`group ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <summary className="cursor-pointer font-medium">
                  Hoe werkt navigatie?
                </summary>
                <p className={`mt-2 text-sm pl-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Zoek een bestemming via de zoekbalk bovenaan. Kies je gewenste route en tik op "Start navigatie" 
                  om realtime navigatie-instructies te ontvangen.
                </p>
              </details>

              <details className={`group ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <summary className="cursor-pointer font-medium">
                  Is de app gratis?
                </summary>
                <p className={`mt-2 text-sm pl-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ja, Road Alerts Nederland is volledig gratis te gebruiken. Premium features kunnen in de toekomst worden toegevoegd.
                </p>
              </details>

              <details className={`group ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <summary className="cursor-pointer font-medium">
                  Hoe installeer ik de app?
                </summary>
                <p className={`mt-2 text-sm pl-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Op Android: tik op "Installeren" in de browser. 
                  Op iOS: tik op het deel-icoon en kies "Zet op beginscherm".
                </p>
              </details>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <Link 
              to={createPageUrl('Privacy')}
              className={`rounded-2xl p-4 text-center ${isDark ? 'bg-[#1E1E1E] border border-[#2A2A2A] hover:bg-[#2A2A2A]' : 'bg-white border border-gray-200 hover:bg-gray-50'} transition-colors`}
            >
              <Shield size={24} className="text-[#2F80ED] mx-auto mb-2" />
              <div className="font-medium text-sm">Privacy Policy</div>
            </Link>

            <Link 
              to={createPageUrl('Terms')}
              className={`rounded-2xl p-4 text-center ${isDark ? 'bg-[#1E1E1E] border border-[#2A2A2A] hover:bg-[#2A2A2A]' : 'bg-white border border-gray-200 hover:bg-gray-50'} transition-colors`}
            >
              <FileText size={24} className="text-[#2F80ED] mx-auto mb-2" />
              <div className="font-medium text-sm">Voorwaarden</div>
            </Link>
          </div>
        </div>

        <div className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          <p>Road Alerts Nederland v1.0</p>
          <p className="mt-1">Powered by Base44</p>
        </div>
      </div>
    </div>
  );
}