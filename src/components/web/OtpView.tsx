import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppStore } from '../../services/store';

interface OtpViewProps {
  phone: string;
  onBack: () => void;
  onVerified: () => void;
}

export function OtpView({ phone, onBack, onVerified }: OtpViewProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // In web fallback mode, create demo session for this phone number
      AppStore.createDemoSession(phone);
      setLoading(false);
      onVerified();
    }, 400);
  };

  const handleUseDemoCode = () => {
    setCode('123456');
    setError(null);
  };

  return (
    <div className="flex flex-col justify-center min-h-screen px-6 py-8 bg-[#0D0D0D]">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#B0B0B0] hover:text-white mb-6 self-start transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Verify your number</h2>
        <p className="text-sm text-[#B0B0B0] mb-6">
          Code sent to <span className="text-white font-mono">+91 {phone}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="······"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''));
              if (error) setError(null);
            }}
            className="w-full h-16 bg-[#252525] border border-[#2A2A2A] rounded-xl text-center text-3xl font-mono tracking-[0.5em] text-white focus:border-[#FF6B35] outline-none transition-colors"
            autoFocus
          />

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full h-14 bg-[#FF6B35] hover:bg-[#ff7b4b] disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center transition-all shadow-lg shadow-[#FF6B35]/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Verify'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleUseDemoCode}
            className="text-xs text-[#FF6B35] hover:underline bg-[#FF6B35]/10 px-3 py-1.5 rounded-full"
          >
            Click to autofill test code: 123456
          </button>
        </div>
      </div>
    </div>
  );
}
