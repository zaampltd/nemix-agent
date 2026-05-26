import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: number | string;
}

export function BrandLogo({ className, size = 26 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <defs>
        {/* Dynamic theme-adaptive gradient using CSS custom properties */}
        <linearGradient id="nvmix-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-grad-start, #4f46e5)" />
          <stop offset="50%" stopColor="var(--logo-grad-mid, #7c3aed)" />
          <stop offset="100%" stopColor="var(--logo-grad-end, #0891b2)" />
        </linearGradient>
        
        {/* Glow effect filter */}
        <filter id="nvmix-logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <g filter="url(#nvmix-logo-glow)" style={{ transition: "all 0.3s ease" }}>
        {/* Left Pillar */}
        <rect
          x="6"
          y="6"
          width="4"
          height="20"
          rx="1.5"
          fill="url(#nvmix-logo-grad)"
        />
        
        {/* Diagonal Sleek Connection Bar */}
        <polygon
          points="10,6 14,6 22,26 18,26"
          fill="url(#nvmix-logo-grad)"
        />
        
        {/* Right Pillar */}
        <rect
          x="22"
          y="6"
          width="4"
          height="20"
          rx="1.5"
          fill="url(#nvmix-logo-grad)"
        />
        
        {/* Signature square dot reflecting the geometric dot over 'i' in 'Nvmix' */}
        <rect
          x="22"
          y="0"
          width="4"
          height="4"
          rx="1"
          fill="url(#nvmix-logo-grad)"
        />
        
        {/* Complementary lower neural node dot */}
        <circle
          cx="8"
          cy="30"
          r="2"
          fill="url(#nvmix-logo-grad)"
        />
      </g>
    </svg>
  );
}
