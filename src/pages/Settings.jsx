import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  User, Bell, Crown, Shield, LogOut, Trash2, 
  AlertTriangle, Camera, Moon, Volume2, Map, MessageSquare, Info 
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [feedbackType, setFeedbackType] = React.useState('bug');
  const [feedbackMessage, setFeedbackMessage] = React.useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = React.useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings) => base44.auth.updateMe(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Instellingen opgeslagen');
    },
  });

  const handleToggle = (key, value) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) {
      toast.error('Vul een bericht in');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'roadalertsnl@gmail.com',
        from_name: 'Road Alerts Feedback',
        subject: `[${feedbackType.toUpperCase()}] Feedback van ${user?.email || 'gebruiker'}`,
        body: `
Type: ${feedbackType === 'bug' ? 'Bug Report' : feedbackType === 'complaint' ? 'Klacht' : 'Vraag'}
Van: ${user?.full_name || 'Onbekend'} (${user?.email || 'geen email'})
User ID: ${user?.id || 'n/a'}

Bericht:
${feedbackMessage}

---
Verzonden via Road Alerts Nederland app
        `,
      });
      toast.success('Feedback verzonden! We nemen zo snel mogelijk contact op.');
      setFeedbackMessage('');
    } catch (error) {
      console.error('Feedback error:', error);
      toast.error(`Er ging iets mis: ${error.message || 'Probeer het later opnieuw'}`);
    }
    setFeedbackSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center pb-20">
        <div className="w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPremium = user?.is_premium || false;
  const isDark = user?.theme !== 'light';

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="p-4 space-y-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Instellingen</h1>

        {/* Profile Section */}
        <div className={`rounded-2xl p-4 border ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#2F80ED]/20 flex items-center justify-center">
              <User size={24} className="text-[#2F80ED]" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.full_name || 'Gebruiker'}</p>
              <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Trust Score</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.trust_score || 50}/100</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Meldingen geplaatst</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.alert_count || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Totaal gereden</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{Math.round(user?.total_km_driven || 0)} km</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>0-100 sprint</span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.sprint_0_100 ? `${user.sprint_0_100.toFixed(2)}s` : '-'}
              </span>
              {user?.sprint_0_100 && (
                <button
                  onClick={() => updateSettingsMutation.mutate({ sprint_0_100: null })}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Dagen gereden</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.days_driven || 0}</span>
          </div>
        </div>

        {/* Premium Section */}
        {!isPremium && (
          <button
            onClick={() => navigate(createPageUrl('Premium'))}
            className="w-full bg-gradient-to-br from-[#2F80ED] to-[#1E60C4] rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={24} className="text-yellow-300" />
                <h3 className="text-white font-bold text-lg">Upgrade naar Premium</h3>
              </div>
              <p className="text-white/90 text-sm">
                Voice alerts • 10km radius • Offline kaarten • AI routes
              </p>
            </div>
          </button>
        )}

        {user?.is_premium && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Crown size={24} className="text-yellow-500" />
              <div>
                <p className="text-white font-bold">Premium Actief</p>
                <p className="text-gray-400 text-sm">
                  Geldig tot {user.premium_expires_at ? new Date(user.premium_expires_at).toLocaleDateString('nl-NL') : 'onbepaalde tijd'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className={`rounded-2xl p-4 border space-y-4 ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Bell size={20} className="text-[#2F80ED]" />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notificaties</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Push notificaties</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Ontvang nieuwe meldingen</p>
            </div>
            <Switch
              checked={user?.push_enabled ?? true}
              onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Volume2 size={14} /> Spraakmeldingen
                {!isPremium && <Crown size={12} className="text-yellow-500" />}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Hoor meldingen tijdens rijden</p>
            </div>
            <Switch
              checked={user?.voice_alerts ?? false}
              onCheckedChange={(checked) => handleToggle('voice_alerts', checked)}
              disabled={!isPremium}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <AlertTriangle size={14} /> Hulpdiensten
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Ambulance, brandweer, politie</p>
            </div>
            <Switch
              checked={user?.category_emergency ?? true}
              onCheckedChange={(checked) => handleToggle('category_emergency', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Camera size={14} /> Flitsers
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Vaste, mobiele en trajectcontrole</p>
            </div>
            <Switch
              checked={user?.category_speed ?? true}
              onCheckedChange={(checked) => handleToggle('category_speed', checked)}
            />
          </div>
        </div>

        {/* Appearance */}
        <div className={`rounded-2xl p-4 border space-y-4 ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Moon size={20} className="text-[#2F80ED]" />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Uiterlijk</h3>
          </div>

          <div>
            <p className={`text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Thema</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggle('theme', 'dark')}
                className={`p-3 rounded-xl text-sm transition-all ${
                  isDark
                    ? 'bg-[#2F80ED] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🌙 Donker
              </button>
              <button
                onClick={() => handleToggle('theme', 'light')}
                className={`p-3 rounded-xl text-sm transition-all ${
                  !isDark
                    ? 'bg-[#2F80ED] text-white'
                    : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]'
                }`}
              >
                ☀️ Licht
              </button>
            </div>
          </div>

          <div className={`pt-3 border-t ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'}`}>
            <p className={`text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Voorkeur routetype</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggle('preferred_route_type', 'fastest')}
                className={`p-3 rounded-xl text-sm transition-all ${
                  (user?.preferred_route_type || 'fastest') === 'fastest'
                    ? 'bg-[#2F80ED] text-white'
                    : isDark ? 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🚀 Snelste
              </button>
              <button
                onClick={() => handleToggle('preferred_route_type', 'safest')}
                className={`p-3 rounded-xl text-sm transition-all ${
                  user?.preferred_route_type === 'safest'
                    ? 'bg-[#2F80ED] text-white'
                    : isDark ? 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🛡️ Veiligste
              </button>
            </div>
          </div>

          <div className={`pt-3 border-t ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between py-3 mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-[#2A2A2A]' : 'bg-gray-200'
                }`}>
                  🚗
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Live verkeersinformatie
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Real-time verkeersstroom en vertragingen (TomTom)
                  </p>
                </div>
              </div>
              <Switch
                checked={user?.show_traffic_overlay !== false}
                onCheckedChange={async (checked) => {
                  await handleToggle('show_traffic_overlay', checked);
                  toast.success(checked ? 'Verkeersinformatie ingeschakeld' : 'Verkeersinformatie uitgeschakeld');
                }}
              />
            </div>
          </div>

          <div className={`pt-3 border-t ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'}`}>
            <p className={`text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Kaartlaag</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleToggle('map_layer', 'dark')}
                className={`p-3 rounded-xl text-sm transition-all ${
                  (user?.map_layer || 'dark') === 'dark'
                    ? 'bg-[#2F80ED] text-white'
                    : isDark ? 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Kaart
              </button>
              <button
                onClick={() => handleToggle('map_layer', 'terrain')}
                className={`p-3 rounded-xl text-sm transition-all ${
                  user?.map_layer === 'terrain'
                    ? 'bg-[#2F80ED] text-white'
                    : isDark ? 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Terrein
              </button>
              <button
                onClick={() => handleToggle('map_layer', 'satellite')}
                className={`p-3 rounded-xl text-sm transition-all ${
                  user?.map_layer === 'satellite'
                    ? 'bg-[#2F80ED] text-white'
                    : isDark ? 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Satelliet
              </button>
            </div>
          </div>

        </div>

        {/* Feedback Section */}
        <div className={`rounded-2xl p-4 border ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={20} className="text-[#2F80ED]" />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Feedback</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className={`text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Type</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFeedbackType('bug')}
                  className={`p-2 rounded-xl text-xs transition-all ${
                    feedbackType === 'bug'
                      ? 'bg-[#2F80ED] text-white'
                      : isDark ? 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🐛 Bug
                </button>
                <button
                  onClick={() => setFeedbackType('complaint')}
                  className={`p-2 rounded-xl text-xs transition-all ${
                    feedbackType === 'complaint'
                      ? 'bg-[#2F80ED] text-white'
                      : isDark ? 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  😠 Klacht
                </button>
                <button
                  onClick={() => setFeedbackType('question')}
                  className={`p-2 rounded-xl text-xs transition-all ${
                    feedbackType === 'question'
                      ? 'bg-[#2F80ED] text-white'
                      : isDark ? 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ❓ Vraag
                </button>
              </div>
            </div>

            <div>
              <p className={`text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Bericht</p>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Beschrijf je bug, klacht of vraag..."
                rows={4}
                className={`w-full p-3 rounded-xl text-sm resize-none ${
                  isDark 
                    ? 'bg-[#2A2A2A] border-0 text-white placeholder:text-gray-600' 
                    : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500'
                }`}
              />
            </div>

            <Button
              onClick={handleFeedbackSubmit}
              disabled={feedbackSubmitting || !feedbackMessage.trim()}
              className="w-full h-11 bg-[#2F80ED] hover:bg-[#2570D4] text-white"
            >
              {feedbackSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verzenden...
                </span>
              ) : (
                'Verstuur feedback'
              )}
            </Button>
          </div>
        </div>

        {/* About */}
        <Button
          variant="outline"
          className={`w-full h-12 border justify-start gap-3 ${
            isDark ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white hover:bg-[#2A2A2A]' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => navigate(createPageUrl('About'))}
        >
          <Info size={18} />
          Over & Veiligheid
        </Button>

        {/* Account Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className={`w-full h-12 border justify-start gap-3 ${
              isDark ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white hover:bg-[#2A2A2A]' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => base44.auth.logout()}
          >
            <LogOut size={18} />
            Uitloggen
          </Button>

          <Button
            variant="outline"
            className={`w-full h-12 border justify-start gap-3 ${
              isDark ? 'bg-[#1E1E1E] border-red-500/30 text-red-400 hover:bg-red-500/10' : 'bg-white border-red-300 text-red-600 hover:bg-red-50'
            }`}
            onClick={() => {
              if (confirm('Weet je zeker dat je je account wilt verwijderen?')) {
                toast.error('Account verwijderen wordt binnenkort toegevoegd');
              }
            }}
          >
            <Trash2 size={18} />
            Account verwijderen
          </Button>
        </div>

        {/* Safety Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-200 text-xs text-center">
            ⚠️ Gebruik deze app niet tijdens het rijden. Verkeersveiligheid eerst.
          </p>
        </div>

        {/* Map Credits */}
        <div className={`rounded-2xl p-4 border ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Map size={20} className="text-[#2F80ED]" />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kaartgegevens</h3>
          </div>
          <div className={`text-xs space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>© OpenStreetMap contributors</p>
            <p>© CARTO (standaard kaartlaag)</p>
            <p>© OpenTopoMap (terrein laag)</p>
            <p>© Esri (satelliet laag)</p>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center text-xs space-y-1 pt-4 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
          <p>Road Alerts Nederland v1.0.0</p>
          <p>Niet gelieerd aan hulpdiensten of overheid</p>
          <p>Gericht op verkeersveiligheid en bewust rijden</p>
        </div>
      </div>
    </div>
  );
}