import React from 'react';
import Image from 'next/image';

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
  small: 36,
  medium: 72,
  large: 96,
} as const;

export default function Logo({ size = 'medium', customSize, className = '' }: LogoProps) {
  const pixelSize = size === 'custom' && customSize ? customSize : SIZE_MAP[size as keyof typeof SIZE_MAP] || SIZE_MAP.medium;

  return (
    <div
      className={`logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      <Image
        src="/images/logo.png"
        alt="PROCLUBS.IO"
        width={pixelSize}
        height={pixelSize}
        style={{ objectFit: 'contain' }}
        priority
      />
      <span
        style={{
          fontFamily: 'var(--font-work-sans), sans-serif',
          fontWeight: 800,
          fontSize: `${pixelSize * 0.38}px`,
          color: '#FFFFFF',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        PROCLUBS
        <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.65em' }}>.IO</span>
      </span>
    </div>
  );
}
