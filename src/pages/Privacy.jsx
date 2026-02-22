import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Gegevens die we verzamelen</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Road Alerts Nederland verzamelt alleen de gegevens die nodig zijn om de app te laten functioneren:
            </p>
            <ul className={`list-disc list-inside mt-2 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Locatiegegevens (alleen tijdens gebruik)</li>
              <li>Email en naam (voor account)</li>
              <li>Geplaatste meldingen en stemmen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Hoe we je gegevens gebruiken</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Je gegevens worden uitsluitend gebruikt voor:
            </p>
            <ul className={`list-disc list-inside mt-2 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Het tonen van relevante verkeersmeldingen in je buurt</li>
              <li>Het berekenen van routes en navigatie</li>
              <li>Het modereren van meldingen</li>
              <li>Het verbeteren van de dienstverlening</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Delen van gegevens</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              We delen je persoonlijke gegevens niet met derden, behalve:
            </p>
            <ul className={`list-disc list-inside mt-2 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>TomTom en OpenRouteService voor routeberekening (geanonimiseerd)</li>
              <li>Als we wettelijk verplicht zijn</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Je rechten</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Je hebt het recht om:
            </p>
            <ul className={`list-disc list-inside mt-2 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Je gegevens in te zien</li>
              <li>Je gegevens te laten verwijderen</li>
              <li>Bezwaar te maken tegen verwerking</li>
            </ul>
            <p className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Neem contact op via support@roadalerts.nl
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Cookies</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              We gebruiken alleen technisch noodzakelijke cookies voor het functioneren van de app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Wijzigingen</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              We kunnen deze privacy policy aanpassen. Check deze pagina regelmatig voor updates.
            </p>
          </section>

          <p className={`text-sm mt-8 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Laatst bijgewerkt: 22 februari 2026
          </p>
        </div>
      </div>
    </div>
  );
}