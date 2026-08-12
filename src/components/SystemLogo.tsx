import React from 'react';

interface SystemLogoProps {
  className?: string;
  size?: number;
}

export const SystemLogo: React.FC<SystemLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <img
      src="https://lh3.googleusercontent.com/d/1owYQ0qe7CyHj6TSPxD4dTkjXIZ4Pjgr7"
      alt="ROAMDESK WORKSPACE Logo"
      style={{ width: size, height: size }}
      className={`object-contain shrink-0 ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
