/**
 * CyberCard Component
 * Implements hardware-accelerated 3D perspective tilt physics with
 * dynamic cursor glare spotlight and glowing glassmorphic cyber borders.
 */

import React, { useState, useRef, useCallback } from 'react';

interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'crimson' | 'neutral';
  glow?: boolean;
  tilt?: boolean;
  className?: string;
}

export const CyberCard: React.FC<CyberCardProps> = ({
  children,
  variant = 'cyan',
  glow = false,
  tilt = true,
  className = '',
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tilt || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Max tilt angle 6 degrees
      const maxTilt = 6;
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      setStyle({
        transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.008, 1.008, 1.008)`,
        transition: 'transform 0.1s ease-out',
      });

      setGlare({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.18,
      });
    },
    [tilt]
  );

  const handleMouseLeave = useCallback(() => {
    if (!tilt) return;
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s ease-out',
    });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  }, [tilt]);

  // Variant color definitions
  const borderStyles = {
    cyan: 'border-cyan-500/20 hover:border-cyan-400/40 hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]',
    violet: 'border-purple-500/20 hover:border-purple-400/40 hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.25)]',
    emerald: 'border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]',
    amber: 'border-amber-500/20 hover:border-amber-400/40 hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]',
    crimson: 'border-rose-500/30 hover:border-rose-400/50 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.35)]',
    neutral: 'border-slate-800 hover:border-slate-700 hover:shadow-[0_0_20px_-5px_rgba(30,41,59,0.5)]',
  };

  const glareGradients = {
    cyan: 'rgba(6, 182, 212, 0.22)',
    violet: 'rgba(168, 85, 247, 0.22)',
    emerald: 'rgba(16, 185, 129, 0.22)',
    amber: 'rgba(245, 158, 11, 0.22)',
    crimson: 'rgba(244, 63, 94, 0.26)',
    neutral: 'rgba(255, 255, 255, 0.10)',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={`relative overflow-hidden rounded-xl bg-[#080e1e]/85 backdrop-blur-xl border transition-all duration-200 ${borderStyles[variant]} ${
        glow ? 'shadow-[0_0_25px_-5px_rgba(6,182,212,0.18)]' : ''
      } ${className}`}
      {...rest}
    >
      {/* Dynamic Cursor Glare Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(400px circle at ${glare.x}% ${glare.y}%, ${glareGradients[variant]}, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Cyber Corner Accents */}
      <div className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-400/30" />
      <div className="pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-400/30" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-cyan-400/30" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-cyan-400/30" />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
