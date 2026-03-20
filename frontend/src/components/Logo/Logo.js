import React from 'react';

const Logo = () => {
  return (
    <svg 
      width="160" 
      height="160" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer audio waves */}
      <circle cx="10" cy="50" r="1.5" fill="#a4bbf0" />
      <rect x="14" y="44" width="3" height="12" rx="1.5" fill="#a4bbf0" />
      <rect x="20" y="40" width="3" height="20" rx="1.5" fill="#a4bbf0" />
      
      <circle cx="90" cy="50" r="1.5" fill="#a4bbf0" />
      <rect x="83" y="44" width="3" height="12" rx="1.5" fill="#a4bbf0" />
      <rect x="77" y="40" width="3" height="20" rx="1.5" fill="#a4bbf0" />

      {/* Outer broken ring */}
      <path 
        d="M 28 32 A 32 32 0 0 1 72 32" 
        stroke="#c4d4f3" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      <path 
        d="M 28 68 A 32 32 0 0 0 72 68" 
        stroke="#c4d4f3" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />

      {/* Inner ring */}
      <circle cx="50" cy="50" r="22" stroke="#c4d4f3" strokeWidth="3" />

      {/* Center circle */}
      <circle cx="50" cy="50" r="14" fill="#a4bbf0" />

      {/* Play Icon */}
      <path 
        d="M 46 43 L 57 50 L 46 57 Z" 
        fill="#0b0f24" 
        stroke="#0b0f24" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

export default Logo;
