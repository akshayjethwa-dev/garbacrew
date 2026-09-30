import React, { useState } from 'react';
import { X, Users, Sparkles, Heart, Shield, Copy, Check, LogOut, UserPlus } from 'lucide-react';
import { Crew, JoinRequest } from '../../types';
import { AppStore } from '../../services/store';

interface CrewDetailModalProps {
  crew: Crew;
  onClose: () => void;
}

export function CrewDetailModal({ crew, onClose }: CrewDetailModalProps) {
  const currentUser = AppStore.getUser();
  const members = AppStore.getCrewMembers(crew.id);
  const requests = AppStore.getJoinRequests(crew.id);

  const [copiedCode, setCopiedCode] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isAdmin = currentUser?.uid === crew.adminUid;
  const isMember = currentUser ? crew.memberUids.includes(currentUser.uid) : false;
  const hasRequested = currentUser ? requests.some((r) => r.uid === currentUser.uid) : false;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(crew.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendJoinRequest = () => {
    setActionError(null);
    try {
      AppStore.sendJoinRequest(crew.id, joinMessage.trim());
      setActionSuccess('Join request sent to crew admin!');
      setShowJoinForm(false);
    } catch (e: any) {
      setActionError(e.message || 'Failed to send request');
    }
  };

  const handleApprove = (req: JoinRequest) => {
    try {
      AppStore.approveJoinRequest(crew.id, req);
    } catch (e: any) {
      setActionError(e.message || 'Failed to approve');
    }
  };

  const handleDecline = (uid: string) => {
    AppStore.declineJoinRequest(crew.id, uid);
  };

  const handleLeaveCrew = () => {
    if (!currentUser) return;
    if (confirm('Are you sure you want to leave this crew?')) {
      AppStore.leaveCrew(crew.id, currentUser.uid);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-md px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between z-10">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#FF6B35] font-semibold">
              {crew.eventName}
            </span>
            <h2 className="text-xl font-bold text-white leading-tight">{crew.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#252525] hover:bg-[#333] text-[#B0B0B0] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {actionError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs">
              {actionSuccess}
            </div>
          )}

          {/* Vibe and Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-[#252525] px-3 py-1.5 rounded-full text-xs font-medium text-[#B0B0B0]">
              <Users className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>{crew.memberCount} / {crew.maxMembers} Members</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#252525] px-3 py-1.5 rounded-full text-xs font-medium text-[#B0B0B0]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{crew.vibeTag}</span>
            </div>
            {crew.genderPreference === 'women_only' && (
              <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-pink-300">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                <span>Women only</span>
              </div>
            )}
          </div>

          {/* Admin & Invite Code */}
          <div className="bg-[#252525] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center font-bold text-white">
                {crew.adminName[0]?.toUpperCase() ?? 'A'}
              </div>
              <div>
                <p className="text-xs text-[#B0B0B0]">Crew Admin</p>
                <p className="text-sm font-semibold text-white">{crew.adminName}</p>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 bg-[#1A1A1A] hover:bg-[#333] border border-[#2A2A2A] px-3 py-1.5 rounded-lg text-xs font-mono text-white transition-colors"
              title="Copy Invite Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#B0B0B0]" />}
              <span>{crew.inviteCode}</span>
            </button>
          </div>

          {/* Members List */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-3">
              Members ({members.length})
            </h4>
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.uid}
                  className="flex items-center justify-between bg-[#252525]/60 border border-[#2A2A2A] rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#333] text-white flex items-center justify-center text-xs font-bold">
                      {m.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm text-white font-medium">{m.name}</span>
                  </div>
                  {m.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-[11px] bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30 px-2.5 py-0.5 rounded-full font-semibold">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="text-xs text-[#888]">Dancer</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Admin Pending Requests */}
          {isAdmin && requests.length > 0 && (
            <div className="pt-2 border-t border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">
                  Pending Join Requests ({requests.length})
                </h4>
              </div>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.uid}
                    className="bg-[#252525] border border-[#FF6B35]/30 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{req.name}</span>
                      {req.age && <span className="text-xs text-[#B0B0B0]">{req.age} yrs</span>}
                    </div>
                    {req.bio && <p className="text-xs text-[#888] italic">"{req.bio}"</p>}
                    {req.message && (
                      <p className="text-xs text-[#B0B0B0] bg-[#1A1A1A] p-2 rounded-lg">
                        {req.message}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(req)}
                        className="flex-1 py-1.5 bg-[#FF6B35] hover:bg-[#ff7b4b] text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(req.uid)}
                        className="flex-1 py-1.5 bg-[#1A1A1A] hover:bg-[#333] border border-[#2A2A2A] text-[#B0B0B0] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Join / Leave Actions */}
          <div className="pt-4 border-t border-[#2A2A2A]">
            {isMember ? (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-center text-green-400 font-medium py-1">
                  ✓ You are a member of this crew
                </div>
                {!isAdmin && (
                  <button
                    onClick={handleLeaveCrew}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Leave Crew
                  </button>
                )}
              </div>
            ) : hasRequested ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs text-center font-medium">
                ⏳ Join request submitted — waiting for crew admin approval.
              </div>
            ) : showJoinForm ? (
              <div className="space-y-3 bg-[#252525] p-4 rounded-xl border border-[#2A2A2A]">
                <label className="block text-xs font-semibold text-[#B0B0B0]">
                  Message to Crew Admin (optional)
                </label>
                <textarea
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Hey, I'd love to join your crew for this Navratri night!"
                  rows={2}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-2.5 text-white text-xs placeholder-[#666] outline-none focus:border-[#FF6B35]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSendJoinRequest}
                    className="flex-1 py-2.5 bg-[#FF6B35] hover:bg-[#ff7b4b] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#FF6B35]/20"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={() => setShowJoinForm(false)}
                    className="px-4 py-2.5 bg-[#1A1A1A] text-[#B0B0B0] hover:text-white text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (crew.memberCount >= crew.maxMembers) {
                    setActionError('This crew is currently full');
                    return;
                  }
                  if (crew.genderPreference === 'women_only' && currentUser?.gender === 'male') {
                    setActionError('This is a women-only crew');
                    return;
                  }
                  setShowJoinForm(true);
                }}
                disabled={crew.memberCount >= crew.maxMembers}
                className="w-full h-12 bg-[#FF6B35] hover:bg-[#ff7b4b] disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF6B35]/25"
              >
                <UserPlus className="w-4 h-4" />
                {crew.memberCount >= crew.maxMembers ? 'Crew is Full' : 'Request to Join Crew'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
