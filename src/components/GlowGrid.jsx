import React, { useEffect, useState } from 'react';

const GlowGrid = () => {

    useEffect(() => {
        const handleMouseMove = (e) => {
            document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                pointerEvents: 'none',
                background: '#000000',
                overflow: 'hidden'
            }}
        >
            {/* The Grid Pattern */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
            linear-gradient(rgba(231, 170, 81, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(231, 170, 81, 0.05) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* The Glow Spot */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(231, 170, 81, 0.1), transparent 40%)`,
                    transition: 'background 0.05s ease'
                }}
            />

            {/* Secondary Ambient Glow */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(1200px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(231, 170, 81, 0.03), transparent 70%)`,
                }}
            />
        </div>
    );
};

export default GlowGrid;
