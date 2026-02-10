import React from 'react';

export const CompanyLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg" fill="none">
             <path d="M100 25 L175 165 H25 L100 25 Z" stroke="#7f1d1d" strokeWidth="16" strokeLinejoin="round" fill="none" opacity="0.15" />
            <g strokeLinejoin="round" strokeLinecap="round">
                <path d="M100 180 L150 155 L100 130 L50 155 Z" fill="#7f1d1d" stroke="#7f1d1d" strokeWidth="8" />
                <path d="M100 145 L140 120 L100 95 L60 120 Z" fill="#991b1b" stroke="#991b1b" strokeWidth="8" />
                <path d="M100 110 L130 90 L100 70 L70 90 Z" fill="#b91c1c" stroke="#b91c1c" strokeWidth="8" />
            </g>
            <circle cx="100" cy="40" r="8" fill="#7f1d1d" />
        </svg>
    </div>
  );
};

export const AnimatedCompanyLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ perspective: '1000px' }}>
      <style>{`
        @keyframes assemble-in {
          from { transform: translateY(40px) scale(0.8); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes logo-breathe-3d {
          0% {
            transform: rotateY(-20deg) rotateX(4deg) translateZ(0) scale(0.98);
          }
          25% {
            transform: rotateY(-8deg) rotateX(2deg) translateZ(4px) scale(1);
          }
          50% {
            transform: rotateY(20deg) rotateX(4deg) translateZ(0) scale(0.98);
          }
          75% {
            transform: rotateY(8deg) rotateX(2deg) translateZ(4px) scale(1);
          }
          100% {
            transform: rotateY(-20deg) rotateX(4deg) translateZ(0) scale(0.98);
          }
        }
        .logo-group {
          transform-style: preserve-3d;
          transform-origin: 50% 50%;
          backface-visibility: visible;
          will-change: transform;
          animation: logo-breathe-3d 2.6s ease-in-out infinite 0.9s;
        }
        .logo-part {
          opacity: 0;
          animation-fill-mode: forwards;
          animation-name: assemble-in;
          animation-duration: 0.6s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .logo-bottom { animation-delay: 0s; }
        .logo-middle { animation-delay: 0.2s; }
        .logo-top { animation-delay: 0.4s; }
        .logo-dot { animation-delay: 0.6s; }
      `}</style>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg" fill="none">
        <g className="logo-group">
          <g strokeLinejoin="round" strokeLinecap="round">
            <path className="logo-part logo-bottom" d="M100 180 L150 155 L100 130 L50 155 Z" fill="#7f1d1d" stroke="#7f1d1d" strokeWidth="8" />
            <path className="logo-part logo-middle" d="M100 145 L140 120 L100 95 L60 120 Z" fill="#991b1b" stroke="#991b1b" strokeWidth="8" />
            <path className="logo-part logo-top" d="M100 110 L130 90 L100 70 L70 90 Z" fill="#b91c1c" stroke="#b91c1c" strokeWidth="8" />
          </g>
          <circle className="logo-part logo-dot" cx="100" cy="40" r="8" fill="#7f1d1d" />
        </g>
      </svg>
    </div>
  );
};