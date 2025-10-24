import React from 'react';

export type LogoSize = 'small' | 'medium' | 'large' | 'custom';

export interface LogoProps {
  /**
   * Predefined size for the logo
   * @default 'medium'
   */
  size?: LogoSize;
  /**
   * Custom size in pixels (only used when size='custom')
   */
  customSize?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SIZE_MAP = {
  small: 48,
  medium: 96,
  large: 128,
} as const;

export default function Logo({ size = 'medium', customSize, className = '' }: LogoProps) {
  // Determine the actual pixel size
  const pixelSize = size === 'custom' && customSize ? customSize : SIZE_MAP[size as keyof typeof SIZE_MAP] || SIZE_MAP.medium;

  // Calculate .IO size (35% of main text)
  const ioSize = pixelSize * 0.35;

  return (
    <div
      className={`logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '2px',
        fontFamily: 'var(--font-teko), Teko, sans-serif',
        fontWeight: 700,
        letterSpacing: '5px',
        transform: 'skewX(-10deg) scaleY(1.05)',
        filter: 'drop-shadow(0 0 8px rgba(0, 217, 255, 0.3)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontSize: `${pixelSize}px`,
          background: 'linear-gradient(180deg, #ffffff 0%, #e0f7ff 20%, #00d9ff 60%, #0099cc 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        PROCLUBS
      </span>
      <span
        style={{
          fontSize: `${ioSize}px`,
          background: 'linear-gradient(180deg, #ffffff 0%, #e0f7ff 20%, #00d9ff 60%, #0099cc 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginLeft: '-2px',
        }}
      >
        .IO
      </span>
    </div>
  );
}
