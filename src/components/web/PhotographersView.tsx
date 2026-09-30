import React, { useState } from 'react';
import { Star, CheckCircle, ChevronRight, Camera } from 'lucide-react';
import { Photographer } from '../../types';
import { AppStore } from '../../services/store';
import { EmptyState } from './EmptyState';
import { PhotographerDetailModal } from './PhotographerDetailModal';

const CITIES = ['All Cities', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];

export function PhotographersView() {
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedPhotographer, setSelectedPhotographer] = useState<Photographer | null>(null);

  const photographers = AppStore.getPhotographers(selectedCity);

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">Photographers</h1>
        <p className="text-xs text-[#B0B0B0]">Book verified Garba night candid photographers</p>

        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCity === city
                  ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/25'
                  : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#B0B0B0] hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-5 space-y-3 mt-1">
        {photographers.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No photographers yet"
            subtitle="We're onboarding photographers in this city. Check back soon."
          />
        ) : (
          photographers.map((p) => (
            <PhotographerCard
              key={p.id}
              p={p}
              onPress={() => setSelectedPhotographer(p)}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedPhotographer && (
        <PhotographerDetailModal
          photographer={selectedPhotographer}
          onClose={() => setSelectedPhotographer(null)}
        />
      )}
    </div>
  );
}

function PhotographerCard({ p, onPress }: { p: Photographer; onPress: () => void }) {
  return (
    <div
      onClick={onPress}
      className="flex items-center bg-[#1A1A1A] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#FF6B35]/40 rounded-2xl p-3 transition-all cursor-pointer shadow-md"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#252525] mr-3.5 flex-shrink-0 border border-[#333]">
        {p.photoUrl ? (
          <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#666]">
            <Camera className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-white font-bold text-sm truncate">{p.name}</h3>
          {p.isVerified && (
            <CheckCircle className="w-4 h-4 text-amber-400 fill-amber-400/20 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1 text-xs mt-1">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-[#B0B0B0]">
            {p.rating.toFixed(1)} · {p.totalBookings} bookings
          </span>
        </div>

        <p className="text-xs text-[#888] mt-1">{p.city}</p>

        {p.startingPrice > 0 && (
          <p className="text-xs text-[#FF6B35] font-semibold mt-1.5">
            From ₹{p.startingPrice.toLocaleString()}
          </p>
        )}
      </div>

      <ChevronRight className="w-5 h-5 text-[#666] flex-shrink-0" />
    </div>
  );
}
