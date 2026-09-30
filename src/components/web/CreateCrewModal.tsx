import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { AppStore } from '../../services/store';

const EVENT_PRESETS = [
  'United Way of Baroda',
  'Shankus Dandiya, Ahmedabad',
  'Mirchi Rock N Dhol, SG Highway',
  'Surat Club Garba',
  'University Pavilion, Vadodara',
  'Race Course Ground, Rajkot',
];

const VIBE_TAGS = [
  '🔥 High Energy Dodhiya',
  '💃 Traditional 2-Taali',
  '✨ Freestyle Raas',
  '🌟 Beginners Welcome',
  '🎶 Authentic Folk Troupe',
  '👗 Color Coordinated Attire',
];

interface CreateCrewModalProps {
  onClose: () => void;
  onCreated: (crewId: string) => void;
}

export function CreateCrewModal({ onClose, onCreated }: CreateCrewModalProps) {
  const [eventName, setEventName] = useState(EVENT_PRESETS[0]);
  const [customEvent, setCustomEvent] = useState('');
  const [isCustomEvent, setIsCustomEvent] = useState(false);
  const [name, setName] = useState('');
  const [vibeTag, setVibeTag] = useState(VIBE_TAGS[0]);
  const [maxMembers, setMaxMembers] = useState(6);
  const [genderPreference, setGenderPreference] = useState<'any' | 'women_only'>('any');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalEvent = isCustomEvent ? customEvent.trim() : eventName;
    if (!finalEvent) {
      setError('Please choose or enter a Navratri event name');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a creative crew name');
      return;
    }

    try {
      const newCrew = AppStore.createCrew({
        eventId: 'event_' + Math.random().toString(36).substring(2, 7),
        eventName: finalEvent,
        name: name.trim(),
        vibeTag,
        maxMembers,
        genderPreference,
      });
      onCreated(newCrew.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create crew');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        <div className="sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-md px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-xl font-bold text-white">Create New Garba Crew</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#252525] hover:bg-[#333] text-[#B0B0B0] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
              Navratri Event / Ground
            </label>
            {!isCustomEvent ? (
              <div className="space-y-2">
                <select
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full h-12 bg-[#252525] border border-[#2A2A2A] rounded-xl px-4 text-white text-sm outline-none focus:border-[#FF6B35]"
                >
                  {EVENT_PRESETS.map((ep) => (
                    <option key={ep} value={ep} className="bg-[#1A1A1A] text-white">
                      {ep}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomEvent(true)}
                  className="text-xs text-[#FF6B35] hover:underline"
                >
                  + Enter other event name
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  placeholder="e.g. GMDC Ground, Ahmedabad"
                  className="w-full h-12 bg-[#252525] border border-[#2A2A2A] rounded-xl px-4 text-white text-sm outline-none focus:border-[#FF6B35]"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomEvent(false)}
                  className="text-xs text-[#B0B0B0] hover:text-white underline"
                >
                  ← Select from popular grounds
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
              Crew Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dodhiya Darlings, Raas Rangers"
              maxLength={40}
              className="w-full h-12 bg-[#252525] border border-[#2A2A2A] rounded-xl px-4 text-white text-sm outline-none focus:border-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
              Vibe Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setVibeTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    vibeTag === tag
                      ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/25'
                      : 'bg-[#252525] text-[#B0B0B0] hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
                Max Members
              </label>
              <select
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full h-12 bg-[#252525] border border-[#2A2A2A] rounded-xl px-4 text-white text-sm outline-none focus:border-[#FF6B35]"
              >
                {[4, 6, 8, 10, 12, 16].map((n) => (
                  <option key={n} value={n} className="bg-[#1A1A1A] text-white">
                    {n} Members
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
                Preference
              </label>
              <div className="flex h-12 bg-[#252525] p-1 rounded-xl border border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={() => setGenderPreference('any')}
                  className={`flex-1 rounded-lg text-xs font-medium transition-colors ${
                    genderPreference === 'any' ? 'bg-[#FF6B35] text-white' : 'text-[#B0B0B0]'
                  }`}
                >
                  Any
                </button>
                <button
                  type="button"
                  onClick={() => setGenderPreference('women_only')}
                  className={`flex-1 rounded-lg text-xs font-medium transition-colors ${
                    genderPreference === 'women_only' ? 'bg-pink-600 text-white' : 'text-[#B0B0B0]'
                  }`}
                >
                  Women Only
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 bg-[#FF6B35] hover:bg-[#ff7b4b] text-white font-semibold rounded-xl flex items-center justify-center transition-all shadow-lg shadow-[#FF6B35]/25"
            >
              Launch Crew & Invite Dancers
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
