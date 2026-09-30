import React from 'react';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <div className="w-10 h-10 border-4 border-[#2A2A2A] border-t-[#FF6B35] rounded-full animate-spin"></div>
    </div>
  );
}
