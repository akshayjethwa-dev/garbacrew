import React, { useState } from 'react';
import { AppStore } from '../../services/store';

const CITIES = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];

interface ProfileSetupViewProps {
  onComplete: () => void;
  isEditing?: boolean;
}

export function ProfileSetupView({ onComplete, isEditing = false }: ProfileSetupViewProps) {
  const currentUser = AppStore.getUser();

  const [name, setName] = useState(currentUser?.name || '');
  const [age, setAge] = useState(currentUser?.age ? String(currentUser.age) : '22');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(currentUser?.gender || 'male');
  const [city, setCity] = useState(currentUser?.city || CITIES[0]);
  const [area, setArea] = useState(currentUser?.area || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 14 || ageNum > 90) {
      setError('Please enter a valid age (14-90)');
      return;
    }
    if (!area.trim()) {
      setError('Please specify your area/neighborhood (e.g. Satellite, Vesu)');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      AppStore.updateProfile({
        name: name.trim(),
        age: ageNum,
        gender,
        city,
        area: area.trim(),
        bio: bio.trim(),
      });
      setSaving(false);
      onComplete();
    }, 300);
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-10 bg-[#0D0D0D]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isEditing ? 'Edit Profile' : 'Set up your profile'}
        </h2>
        <p className="text-sm text-[#B0B0B0]">
          Tell us about yourself so we can match you with the right Garba crews.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Parth Patel"
            className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 text-white placeholder-[#666] focus:border-[#FF6B35] outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
            Age
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="18"
            min={14}
            max={99}
            className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 text-white placeholder-[#666] focus:border-[#FF6B35] outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
            Gender
          </label>
          <div className="flex flex-wrap gap-2">
            {(['male', 'female', 'other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  gender === g
                    ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/25'
                    : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#B0B0B0] hover:text-white'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
            City
          </label>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  city === c
                    ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/25'
                    : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#B0B0B0] hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
            Area / Locality
          </label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Satellite, SG Highway, Vesu"
            className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 text-white placeholder-[#666] focus:border-[#FF6B35] outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
            Garba Bio & Style (optional)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell crews about your favorite steps (Dodhiya, 3-Taali, Popat, Hinch)..."
            rows={3}
            maxLength={150}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-white placeholder-[#666] focus:border-[#FF6B35] outline-none transition-colors resize-none text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-14 bg-[#FF6B35] hover:bg-[#ff7b4b] text-white font-semibold rounded-xl flex items-center justify-center transition-all shadow-lg shadow-[#FF6B35]/25 mt-8"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isEditing ? (
            'Save Changes'
          ) : (
            'Finish & Start Dancing'
          )}
        </button>
      </form>
    </div>
  );
}
