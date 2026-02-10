
import React from 'react';

export const SnowEffect: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="snow-container pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
        {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="snowflake">
                ❄
            </div>
        ))}
        <style>{`
            .snowflake {
                position: absolute;
                top: -10%;
                color: #cbd5e1; /* Light Slate */
                opacity: 0.4; /* More transparent */
                font-size: 0.5em; /* Smaller */
                user-select: none;
                animation-name: fall;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
            }

            .dark .snowflake {
                color: #fff;
                opacity: 0.3;
            }
            
            ${Array.from({ length: 50 }).map((_, i) => {
                const left = Math.random() * 100;
                const animDuration = 10 + Math.random() * 15; // Slower (10-25s)
                const delay = Math.random() * 10;
                const size = 0.3 + Math.random() * 0.4; // Smaller scale
                return `
                    .snowflake:nth-child(${i + 1}) {
                        left: ${left}%;
                        animation-duration: ${animDuration}s;
                        animation-delay: -${delay}s;
                        transform: scale(${size});
                    }
                `;
            }).join('')}

            @keyframes fall {
                0% { top: -10%; transform: translateX(0) rotate(0deg); }
                100% { top: 110%; transform: translateX(20px) rotate(360deg); }
            }
        `}</style>
    </div>
  );
};
