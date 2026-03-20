import React, { useState, useEffect } from 'react';
import './FreshIntro.css';

export default function FreshIntro({ onComplete }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start the zoom-through exit animation after the main sequence
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2800);

    // Call onComplete fully unmounting this overlay
    const unmountTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3600); // 2800 + 800ms transition

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fresh-intro-container ${isExiting ? 'exit' : ''}`}>
      <div className="fresh-logo-wrapper">
        <div className="fresh-logo-glow"></div>
        <img src="/logo_refined.png" alt="Logo" className="fresh-logo-image" />
      </div>

      <div className="fresh-text-container">
        <span className="fresh-text-word fresh-text-vit">VIT</span>
        <span className="fresh-text-word fresh-text-pulse">PULSE</span>
      </div>
    </div>
  );
}
