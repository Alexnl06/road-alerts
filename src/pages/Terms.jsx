import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold mb-6">Algemene Voorwaarden</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Gebruik van de dienst</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Door Road Alerts Nederland te gebruiken, ga je akkoord met deze voorwaarden. 
              De app is bedoeld voor persoonlijk gebruik en het delen van verkeersinformatie.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Gebruikersverantwoordelijkheden</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Als gebruiker ben je verantwoordelijk voor:
            </p>
            <ul className={`list-disc list-inside mt-2 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Het plaatsen van accurate en relevante meldingen</li>
              <li>Geen spam, misbruik of ongepaste content</li>
              <li>Het respecteren van andere gebruikers</li>
              <li>Het gebruik van de app op een veilige manier (niet tijdens het rijden)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Disclaimer</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Road Alerts Nederland:
            </p>
            <ul className={`list-disc list-inside mt-2 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Geeft geen garantie op de juistheid van meldingen</li>
              <li>Is niet aansprakelijk voor verkeersboetes of schade</li>
              <li>Kan zonder voorafgaande kennisgeving meldingen verwijderen</li>
              <li>Behoudt zich het recht voor accounts te blokkeren bij misbruik</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Intellectueel eigendom</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Alle rechten op de app, design en content behoren toe aan Road Alerts Nederland, 
              tenzij anders vermeld. Je mag de app niet kopiëren, wijzigen of commercieel exploiteren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Wijzigingen</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              We kunnen deze voorwaarden wijzigen. Belangrijke wijzigingen worden gecommuniceerd via de app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Beëindiging</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Je kunt je account op elk moment verwijderen via de instellingen. 
              Wij kunnen accounts opschorten of verwijderen bij schending van deze voorwaarden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Toepasselijk recht</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Op deze voorwaarden is Nederlands recht van toepassing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Voor vragen over deze voorwaarden kun je contact opnemen via support@roadalerts.nl
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