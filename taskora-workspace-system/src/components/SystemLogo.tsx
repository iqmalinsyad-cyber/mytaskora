import React from 'react';

interface SystemLogoProps {
  className?: string;
  size?: number;
}

export const SystemLogo: React.FC<SystemLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Blue Gradient for Arrow Swoosh & Face Silhouette */}
        <linearGradient id="blueGradient" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00A8E8" />
          <stop offset="40%" stopColor="#0066CC" />
          <stop offset="100%" stopColor="#003399" />
        </linearGradient>

        {/* Orange Gradient for Checkmark and Accents */}
        <linearGradient id="orangeGradient" x1="30" y1="120" x2="180" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5500" />
          <stop offset="50%" stopColor="#FF8800" />
          <stop offset="100%" stopColor="#FFBB00" />
        </linearGradient>

        <linearGradient id="orangeAccent" x1="100" y1="160" x2="160" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF6A00" />
          <stop offset="100%" stopColor="#FFAA00" />
        </linearGradient>

        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Main Outer Blue Curved Arrow */}
      <path
        d="M 117 12 C 70 20 20 50 10 110 C 2 160 30 190 70 190 C 100 190 125 170 145 130 C 130 150 105 170 75 168 C 45 166 28 142 32 110 C 38 65 80 38 120 28 L 95 48 L 117 12 Z"
        fill="url(#blueGradient)"
        filter="url(#shadow)"
      />

      {/* Top Arrow Head */}
      <path
        d="M 45 30 L 118 12 L 88 88 L 72 60 L 45 30 Z"
        fill="url(#blueGradient)"
      />

      {/* Orange Checkmark */}
      <path
        d="M 33 120 L 68 152 C 72 156 78 156 82 150 L 190 15 C 160 35 120 75 75 130 L 48 105 L 33 120 Z"
        fill="url(#orangeGradient)"
        filter="url(#shadow)"
      />

      {/* Face Silhouette on the Right */}
      <path
        d="M 155 42 C 162 48 170 60 162 70 C 158 75 145 82 158 85 C 168 87 185 88 180 102 C 176 112 165 118 172 128 C 178 136 170 148 155 158 C 140 168 122 178 120 190 C 135 180 162 162 172 145 C 182 128 190 118 185 105 C 180 92 170 85 175 78 C 180 72 188 62 182 48 C 175 32 160 22 155 42 Z"
        fill="url(#blueGradient)"
      />

      {/* Orange Accent Curve Bottom Right */}
      <path
        d="M 120 190 C 135 180 155 170 168 165 C 155 172 135 182 120 190 Z"
        fill="url(#orangeAccent)"
      />
    </svg>
  );
};
