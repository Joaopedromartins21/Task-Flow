import React, { useEffect, useState } from 'react';

interface XPAnimationProps {
  xp: number;
  position: { x: number; y: number };
  onComplete: () => void;
}

export function XPAnimation({ xp, position, onComplete }: XPAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 flex items-center justify-center"
      style={{ 
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="animate-[float-up_1.5s_ease-out] flex items-center bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg">
        <span className="text-sm font-semibold">+{xp} XP</span>
      </div>
    </div>
  );
}