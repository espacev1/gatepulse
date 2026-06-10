import React from 'react';
import logo from '/logo_refined.png';

export default function Loader({ message = "PLEASE WAIT...", fullScreen = false }) {
    const content = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-6)',
        }}>
            <img
                src={logo}
                alt="VIT-PULSE Logo"
                style={{
                    width: '120px',
                    height: 'auto',
                    animation: 'pulse 1.5s ease-in-out infinite'
                }}
            />
            <div style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                color: 'var(--text-dim)',
                letterSpacing: '0.1em'
            }}>
                {message}
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'var(--bg-deepest)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {content}
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '200px'
        }}>
            {content}
        </div>
    );
}
