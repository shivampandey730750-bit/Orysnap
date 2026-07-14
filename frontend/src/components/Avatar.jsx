import React, { useState, useEffect } from 'react';

const Avatar = ({ src, alt = 'User', className = 'w-10 h-10', textClassName = 'text-xs font-bold' }) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = alt ? alt.charAt(0).toUpperCase() : 'U';

  const getGradient = (char) => {
    const code = char.charCodeAt(0) % 5;
    switch (code) {
      case 0: return 'from-purple-500 to-pink-500';
      case 1: return 'from-blue-500 to-teal-400';
      case 2: return 'from-orange-400 to-red-500';
      case 3: return 'from-green-400 to-emerald-600';
      default: return 'from-indigo-500 to-purple-600';
    }
  };

  if (hasError || !src || src.includes('default') || src.trim() === '') {
    return (
      <div className={`rounded-full bg-gradient-to-tr ${getGradient(initial)} flex items-center justify-center text-white uppercase select-none flex-shrink-0 shadow-inner border border-black/5 ${className}`}>
        <span className={textClassName}>{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`rounded-full object-cover flex-shrink-0 border border-black/5 ${className}`}
    />
  );
};

export default Avatar;
