import React from 'react';

export interface HumanizeLogoProps {
  variant?: 'horizontal' | 'stacked' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const HumanizeLogo: React.FC<HumanizeLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  // Height / scale sizing maps
  const markSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-11 w-11',
    xl: 'h-16 w-16',
  }[size];

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }[size];

  const taglineSizeClasses = {
    sm: 'text-[7px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
    xl: 'text-[13px]',
  }[size];

  // Unique ID prefix for gradients to prevent collisions if multiple instances are rendered
  const id = React.useId().replace(/:/g, '');

  const LogoMarkSvg = (
    <svg
      viewBox="0 0 110 110"
      className={`${markSizeClasses} shrink-0 transition-transform hover:scale-105 duration-300`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Left Stem Ribbon Gradient: Mint #6EE7B7 -> Emerald #34D399 -> Forest #0F3D2E */}
        <linearGradient
          id={`stemGrad-${id}`}
          x1="15%"
          y1="5%"
          x2="85%"
          y2="95%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#34D399" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#145A40" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#0F3D2E" />
        </linearGradient>

        {/* Right Arch Ribbon Gradient */}
        <linearGradient
          id={`archGrad-${id}`}
          x1="10%"
          y1="25%"
          x2="90%"
          y2="95%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.88" />
          <stop offset="35%" stopColor="#34D399" stopOpacity="0.92" />
          <stop offset="75%" stopColor="#196347" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#0F3D2E" />
        </linearGradient>

        {/* Floating Accent Dot Gradient */}
        <linearGradient
          id={`dotGrad-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="45%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#0F3D2E" />
        </linearGradient>

        <filter id={`glow-${id}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F3D2E" floodOpacity="0.15" />
        </filter>
      </defs>

      <g filter={`url(#glow-${id})`}>
        {/* Left organic stem ribbon */}
        <path
          d="M25,12 C34,12 42,19 42,30 L42,80 C42,91 34,98 25,98 C16,98 10,91 10,80 L10,30 C10,19 16,12 25,12 Z"
          fill={`url(#stemGrad-${id})`}
        />

        {/* Overlapping smooth right arch ribbon */}
        <path
          d="M38,44 C44,35 56,31 69,31 C84,31 96,41 96,57 L96,80 C96,91 89,98 80,98 C71,98 66,91 66,80 L66,61 C66,52 60,46 51,46 C45,46 41,49 38,54 Z"
          fill={`url(#archGrad-${id})`}
          className="mix-blend-multiply dark:mix-blend-screen opacity-95"
        />

        {/* Floating circular dot */}
        <circle cx="88" cy="18" r="9.5" fill={`url(#dotGrad-${id})`} />
      </g>
    </svg>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{LogoMarkSvg}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {LogoMarkSvg}
        <div className={`mt-3 font-extrabold tracking-tight ${textSizeClasses}`}>
          <span className="text-[#0F3D2E] dark:text-[#F8FEFA] transition-colors">humanize</span>
          <span className="text-[#34D399]">Text</span>
        </div>
        {showTagline && (
          <span
            className={`mt-1 font-semibold uppercase tracking-[0.25em] text-[#575961] dark:text-[#A0A5B2] ${taglineSizeClasses}`}
          >
            Write Like A Human
          </span>
        )}
      </div>
    );
  }

  // Default horizontal lockup
  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      {LogoMarkSvg}
      <div className="flex flex-col">
        <div className={`font-extrabold leading-none tracking-tight ${textSizeClasses}`}>
          <span className="text-[#0F3D2E] dark:text-[#F8FEFA] transition-colors">humanize</span>
          <span className="text-[#34D399]">Text</span>
        </div>
        {showTagline && (
          <span
            className={`mt-1 font-semibold uppercase tracking-[0.22em] text-[#575961] dark:text-[#94A3B8] ${taglineSizeClasses}`}
          >
            Write Like A Human
          </span>
        )}
      </div>
    </div>
  );
};
