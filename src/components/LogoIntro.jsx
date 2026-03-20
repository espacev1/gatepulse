import React, { useEffect, useState } from 'react';
import './LogoIntro.css';

export default function LogoIntro({ onComplete, onStamping }) {
    const [animationStage, setAnimationStage] = useState('entering');

    useEffect(() => {
        const stage1 = setTimeout(() => setAnimationStage('settling'), 500);
        const finish = setTimeout(() => {
            setAnimationStage('completing');
            if (onComplete) onComplete();
        }, 3500);

        return () => {
            clearTimeout(stage1);
            clearTimeout(finish);
        };
    }, [onComplete]);

    return (
        <div className={`logo-intro-container ${animationStage}`}>
            <div className="intro-canvas">
                <div className="logo-3d-wrapper">
                    <div className="logo-3d-card">
                        <img src="/vishnu logo.webp" alt="Logo" className="logo-img" />
                    </div>
                </div>
                <h1 className="logo-text-intro">
                    VIT <span className="text-gradient">PULSE</span>
                </h1>
            </div>
        </div>
    );
}
