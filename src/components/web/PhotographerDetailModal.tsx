import React, { useState } from 'react';
import { X, Star, CheckCircle, MapPin, Camera, Clock, Check, Sparkles } from 'lucide-react';
import { Photographer, PhotographerPackage } from '../../types';
import { AppStore } from '../../services/store';

interface PhotographerDetailModalProps {
  photographer: Photographer;
  onClose: () => void;
}

export function PhotographerDetailModal({ photographer, onClose }: PhotographerDetailModalProps) {
  const packages = AppStore.getPackages(photographer.id);
  const [selectedPkg, setSelectedPkg] = useState<PhotographerPackage | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDate, setBookingDate] = useState('2026-10-15');
  const [notes, setNotes] = useState('');

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedPkg(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-md px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white">Photographer Profile</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#252525] hover:bg-[#333] text-[#B0B0B0] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Profile Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#252525] border-2 border-[#FF6B35] mb-3 shadow-lg shadow-[#FF6B35]/20">
              {photographer.photoUrl ? (
                <img
                  src={photographer.photoUrl}
                  alt={photographer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#666]">
                  <Camera className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 justify-center mb-1">
              <h3 className="text-xl font-bold text-white">{photographer.name}</h3>
              {photographer.isVerified && (
                <CheckCircle className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#B0B0B0] mb-2">
              <span className="flex items-center text-amber-400 font-semibold gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {photographer.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span>{photographer.totalBookings} Garba bookings</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#B0B0B0]">
                <MapPin className="w-3 h-3 text-[#FF6B35]" />
                {photographer.city}
              </span>
            </div>

            {/* Service Areas */}
            {photographer.serviceAreas.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                {photographer.serviceAreas.map((area) => (
                  <span
                    key={area}
                    className="text-[11px] bg-[#252525] text-[#999] px-2.5 py-0.5 rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* About */}
          {photographer.bio && (
            <div className="bg-[#252525]/60 border border-[#2A2A2A] rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#B0B0B0] mb-2">
                About & Navratri Experience
              </h4>
              <p className="text-sm text-[#DDD] leading-relaxed">{photographer.bio}</p>
            </div>
          )}

          {/* Packages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">
                Available Shoot Packages ({packages.length})
              </h4>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-white">Booking Request Confirmed!</h5>
                <p className="text-xs text-[#B0B0B0]">
                  {photographer.name} will contact you via phone to coordinate passes & venue gate details.
                </p>
              </div>
            ) : selectedPkg ? (
              <form onSubmit={handleConfirmBooking} className="bg-[#252525] border border-[#FF6B35]/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#FF6B35] font-semibold uppercase">Booking {selectedPkg.name}</span>
                  <span className="text-sm font-bold text-white">₹{selectedPkg.price.toLocaleString()}</span>
                </div>

                <div>
                  <label className="block text-[11px] text-[#B0B0B0] mb-1">Navratri Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#B0B0B0] mb-1">Crew / Venue Details</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. United Way Gate 3, 6 dancers"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#FF6B35] hover:bg-[#ff7b4b] text-white rounded-lg text-xs font-semibold shadow-md shadow-[#FF6B35]/20"
                  >
                    Confirm Shoot Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPkg(null)}
                    className="px-3 py-2 bg-[#1A1A1A] text-[#B0B0B0] hover:text-white rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {packages.length === 0 ? (
                  <p className="text-xs text-[#888] py-4 text-center">No packages configured yet.</p>
                ) : (
                  packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="bg-[#252525]/70 hover:bg-[#252525] border border-[#2A2A2A] hover:border-[#FF6B35]/40 rounded-xl p-4 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="text-sm font-bold text-white">{pkg.name}</h5>
                          <div className="flex items-center gap-1.5 text-xs text-[#B0B0B0] mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                            <span>{pkg.durationHours} Hours Coverage</span>
                          </div>
                        </div>
                        <span className="text-base font-bold text-[#FF6B35]">
                          ₹{pkg.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {Object.entries(pkg.deliverables).map(([key, val]) => (
                          <span
                            key={key}
                            className="text-[11px] bg-[#1A1A1A] border border-[#333] text-[#B0B0B0] px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            {val} {key}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => setSelectedPkg(pkg)}
                        className="w-full py-2 bg-[#1A1A1A] hover:bg-[#FF6B35] text-[#FF6B35] hover:text-white border border-[#FF6B35]/40 hover:border-[#FF6B35] text-xs font-semibold rounded-lg transition-all"
                      >
                        Book Package
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
