import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, subtitle, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4 text-[#FF6B35]">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
      {subtitle && <p className="text-xs text-[#B0B0B0] max-w-xs mb-5 leading-relaxed">{subtitle}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-semibold hover:bg-[#ff7b4b] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
