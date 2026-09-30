import React, { useState, useEffect } from 'react';
import { Users, Sparkles, Heart, Plus, Search } from 'lucide-react';
import { Crew } from '../../types';
import { AppStore } from '../../services/store';
import { EmptyState } from './EmptyState';
import { CrewDetailModal } from './CrewDetailModal';
import { CreateCrewModal } from './CreateCrewModal';

export function CrewsView() {
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('explore');
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setVersion] = useState(0);

  useEffect(() => {
    return AppStore.subscribe(() => setVersion((v) => v + 1));
  }, []);

  const currentUser = AppStore.getUser();
  const allCrews = AppStore.getCrews();
  const myCrews = AppStore.getMyCrews(currentUser?.uid);

  // If user has crews, default to 'my', otherwise 'explore'
  useEffect(() => {
    if (myCrews.length > 0 && activeTab === 'explore' && allCrews.length === myCrews.length) {
      setActiveTab('my');
    }
  }, []);

  const displayedCrews = (activeTab === 'my' ? myCrews : allCrews).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.eventName.toLowerCase().includes(q) ||
      c.vibeTag.toLowerCase().includes(q) ||
      c.adminName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Top action header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Garba Crews</h1>
            <p className="text-xs text-[#B0B0B0]">Dance together this Navratri</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#ff7b4b] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-[#FF6B35]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Crew</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 mb-3">
          <Search className="w-4 h-4 text-[#666] mr-2" />
          <input
            type="text"
            placeholder="Search crews, venues, or vibes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-[#666] outline-none"
          />
        </div>

        {/* Segmented Tab Bar */}
        <div className="flex bg-[#1A1A1A] border border-[#2A2A2A] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'explore'
                ? 'bg-[#FF6B35] text-white shadow'
                : 'text-[#B0B0B0] hover:text-white'
            }`}
          >
            Explore Crews ({allCrews.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'my'
                ? 'bg-[#FF6B35] text-white shadow'
                : 'text-[#B0B0B0] hover:text-white'
            }`}
          >
            My Crews ({myCrews.length})
          </button>
        </div>
      </div>

      {/* Crews List */}
      <div className="px-5 space-y-3 mt-2">
        {displayedCrews.length === 0 ? (
          activeTab === 'my' ? (
            <EmptyState
              icon={Users}
              title="No crews yet"
              subtitle="Join a crew for your next Navratri night and dance with new friends."
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No matching crews found"
              subtitle="Try searching with different keywords or create your own crew!"
            />
          )
        ) : (
          displayedCrews.map((crew) => (
            <CrewCard
              key={crew.id}
              crew={crew}
              onPress={() => setSelectedCrew(crew)}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedCrew && (
        <CrewDetailModal
          crew={selectedCrew}
          onClose={() => {
            // refresh selected crew if still exists
            setSelectedCrew(null);
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCrewModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newCrewId) => {
            setShowCreateModal(false);
            const created = AppStore.getCrew(newCrewId);
            if (created) setSelectedCrew(created);
          }}
        />
      )}
    </div>
  );
}

function CrewCard({ crew, onPress }: { crew: Crew; onPress: () => void }) {
  return (
    <div
      onClick={onPress}
      className="bg-[#1A1A1A] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#FF6B35]/40 rounded-2xl p-4 transition-all cursor-pointer shadow-md"
    >
      <div className="flex items-center mb-3">
        <div className="w-11 h-11 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md shadow-[#FF6B35]/20 select-none">
          {crew.adminName[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base truncate">{crew.name}</h3>
          </div>
          <p className="text-xs text-[#B0B0B0] truncate">
            {crew.eventName} · By {crew.adminName}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#252525]">
        <div className="flex items-center gap-1.5 bg-[#252525] px-2.5 py-1 rounded-full text-xs font-medium text-[#B0B0B0]">
          <Users className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span>
            {crew.memberCount}/{crew.maxMembers}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#252525] px-2.5 py-1 rounded-full text-xs font-medium text-[#B0B0B0]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{crew.vibeTag}</span>
        </div>

        {crew.genderPreference === 'women_only' && (
          <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-full text-xs font-medium text-pink-300">
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            <span>Women only</span>
          </div>
        )}
      </div>
    </div>
  );
}
