import React, { useEffect, useState, useRef } from 'react';
import './Impressive3DIntro.css';

export default function Impressive3DIntro({ onComplete }) {
  const [animationStage, setAnimationStage] = useState('phase1');
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Attempt to play intro music
    if (audioRef.current) {
      audioRef.current.volume = 0.6;
      audioRef.current.play().catch(e => console.log("Autoplay blocked by browser:", e));
    }

    // Extended timeline: 8 seconds total
    // Phase 1: Grid emerges (0-2s)
    const phase1 = setTimeout(() => setAnimationStage('phase2'), 2000);
    // Phase 2: Logo cube intensifies (2-4s)
    const phase2 = setTimeout(() => setAnimationStage('phase3'), 4000);
    // Phase 3: Text reveals (4-6s)
    const phase3 = setTimeout(() => setAnimationStage('phase4'), 6000);
    
    // Audio Fade out starts at 6s
    const fadeOut = setTimeout(() => {
      if (audioRef.current) {
        let vol = 0.6;
        const fadeInterval = setInterval(() => {
          vol -= 0.06;
          if (vol <= 0) {
            vol = 0;
            clearInterval(fadeInterval);
          }
          if (audioRef.current) {
            audioRef.current.volume = vol;
          }
        }, 200);
      }
    }, 6000);

    // Phase 4: Finalize and exit (6-8s)
    const phase4 = setTimeout(() => {
      setAnimationStage('complete');
      if (onComplete) onComplete();
    }, 8000);

    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
      clearTimeout(fadeOut);
      clearTimeout(phase4);
    };
  }, [onComplete]);

  return (
    <div className={`impressive-3d-intro ${animationStage}`}>
      <canvas ref={canvasRef} className="particle-canvas"></canvas>

      <div className="intro-content">
        {/* 3D Cube Container */}
        <div className="logo-3d-container">
          <div className="logo-cube-wrapper">
            <div className="logo-cube">
              <div className="cube-face front">
                <div className="cube-logo">EP</div>
              </div>
              <div className="cube-face back">
                <div className="logo-text-back">EVENT PULSE</div>
              </div>
              <div className="cube-face right">
                <div className="cube-letter">V</div>
              </div>
              <div className="cube-face left">
                <div className="cube-letter">I</div>
              </div>
              <div className="cube-face top">
                <div className="cube-letter-side">2024</div>
              </div>
              <div className="cube-face bottom">
                <div className="cube-letter-side">VIT</div>
              </div>
            </div>
          </div>
          {/* Subtle glow rings */}
          <div className="glow-ring"></div>
          <div className="glow-ring ring-2"></div>
        </div>

        {/* Text Reveal */}
        <div className="text-reveal-container">
          <div className="institution-badge">Vellore Institute of Technology</div>
          <h1 className="main-title">
            <span className="title-vit">Event</span>
            <span className="title-pulse">Pulse</span>
          </h1>
          <p className="tagline">Professional Event Management System</p>
          <div className="underline-accent"></div>
        </div>

        {/* Status indicator */}
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">Initializing System</span>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="loading-indicator">
        <div className="loading-bar"></div>
      </div>
      
      {/* Cinematic Intro Music */}
      <audio ref={audioRef} src="/intro-music.mp3" preload="auto" />
    </div>
  );
}
