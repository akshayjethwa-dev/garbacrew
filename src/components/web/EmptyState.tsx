import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <AlertCircle className="w-12 h-12 text-[#F44336] mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
      <p className="text-sm text-[#B0B0B0] max-w-xs mb-6">
        {message ?? 'Check your connection and try again.'}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-xl border border-[#FF6B35] text-[#FF6B35] font-semibold hover:bg-[#FF6B35]/10 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
