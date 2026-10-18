import React from 'react';

interface FlowingWavesBackgroundProps {
  className?: string;
  variant?: 'subtle' | 'hero';
}

export const FlowingWavesBackground: React.FC<FlowingWavesBackgroundProps> = ({
  className = '',
  variant = 'hero',
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className="absolute top-0 right-0 w-full h-[600px] md:h-[750px] opacity-30 dark:opacity-15 transition-opacity duration-700"
        viewBox="0 0 1440 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient for main flowing wave ribbon 1 */}
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CFF9E5" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#34D399" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0F3D2E" stopOpacity="0.1" />
          </linearGradient>

          {/* Gradient for flowing wave ribbon 2 */}
          <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#CFF9E5" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0F3D2E" stopOpacity="0.05" />
          </linearGradient>

          {/* Dark mode subtle ribbon gradient */}
          <linearGradient id="waveGradDark" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#061711" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Wave Ribbon Layer 1 */}
        <path
          d="M-100,180 C320,60 580,340 1020,190 C1280,100 1420,240 1560,200 L1560,0 L-100,0 Z"
          fill="url(#waveGrad1)"
          className="dark:hidden"
        />

        {/* Wave Ribbon Layer 2 */}
        <path
          d="M-50,320 C240,180 620,440 1140,260 C1380,180 1480,320 1600,280 L1600,0 L-50,0 Z"
          fill="url(#waveGrad2)"
          className="dark:hidden"
        />

        {/* Dark mode radiant wave paths */}
        <path
          d="M-100,220 C280,80 540,360 1060,210 C1320,120 1460,260 1600,220 L1600,0 L-100,0 Z"
          fill="url(#waveGradDark)"
          className="hidden dark:block"
        />
        <path
          d="M0,380 C360,220 740,500 1280,300 C1460,230 1560,340 1650,300 L1650,0 L0,0 Z"
          fill="url(#waveGradDark)"
          className="hidden dark:block opacity-60"
        />

        {/* Curved Accent Line with Circular Nodes (as shown in brand elements) */}
        {variant === 'hero' && (
          <g className="opacity-60 dark:opacity-30">
            <path
              d="M1000,120 C1180,240 1260,380 1420,520"
              stroke="#34D399"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              fill="none"
            />
            <circle cx="1180" cy="240" r="4.5" fill="#34D399" />
            <circle cx="1260" cy="380" r="3.5" fill="#0F3D2E" className="dark:fill-[#A7F3D0]" />
            <circle cx="1420" cy="520" r="5" fill="#34D399" />
          </g>
        )}
      </svg>
    </div>
  );
};
