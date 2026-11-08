/**
 * BUTTERFLY — Illustrated Pink Gift Box Component
 * Centered illustrated vector gift box for Steps 2 & 3 of the opening sequence.
 */

import { forwardRef } from 'react';

export interface GiftBoxProps {
  opacity?: number;
  scale?: number;
  rotation?: number;
  className?: string;
}

export const GiftBox = forwardRef<HTMLDivElement, GiftBoxProps>(
  ({ opacity = 1, scale = 1, rotation = 0, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`gift-box-wrapper ${className}`.trim()}
        style={{
          opacity,
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          willChange: 'transform, opacity',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 160 160"
          width="130"
          height="130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Box Body Gradient */}
            <linearGradient id="boxFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            <linearGradient id="boxLidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>

            {/* Gold Satin Ribbon Gradient */}
            <linearGradient id="ribbonGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Drop Shadow */}
            <radialGradient id="boxShadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(219, 39, 119, 0.28)" />
              <stop offset="100%" stopColor="rgba(219, 39, 119, 0)" />
            </radialGradient>
          </defs>

          {/* Soft Ground Shadow */}
          <ellipse cx="80" cy="144" rx="46" ry="10" fill="url(#boxShadowGrad)" />

          {/* Box Main Body */}
          <rect
            x="40"
            y="68"
            width="80"
            height="70"
            rx="8"
            fill="url(#boxFrontGrad)"
            stroke="#db2777"
            strokeWidth="2.5"
          />

          {/* Vertical Ribbon (Body) */}
          <rect
            x="72"
            y="68"
            width="16"
            height="70"
            fill="url(#ribbonGoldGrad)"
          />

          {/* Horizontal Ribbon (Body) */}
          <rect
            x="40"
            y="98"
            width="80"
            height="14"
            fill="url(#ribbonGoldGrad)"
          />

          {/* Box Lid */}
          <rect
            x="34"
            y="52"
            width="92"
            height="22"
            rx="6"
            fill="url(#boxLidGrad)"
            stroke="#db2777"
            strokeWidth="2.5"
          />

          {/* Vertical Ribbon (Lid) */}
          <rect
            x="72"
            y="52"
            width="16"
            height="22"
            fill="url(#ribbonGoldGrad)"
          />

          {/* Ribbon Bow Left Loop */}
          <path
            d="M80 52 C70 34 44 32 48 46 C52 54 74 53 80 52 Z"
            fill="url(#ribbonGoldGrad)"
            stroke="#d97706"
            strokeWidth="1.5"
          />

          {/* Ribbon Bow Right Loop */}
          <path
            d="M80 52 C90 34 116 32 112 46 C108 54 86 53 80 52 Z"
            fill="url(#ribbonGoldGrad)"
            stroke="#d97706"
            strokeWidth="1.5"
          />

          {/* Ribbon Bow Tails */}
          <path
            d="M74 54 C66 62 58 72 54 78"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M86 54 C94 62 102 72 106 78"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Center Bow Knot */}
          <ellipse
            cx="80"
            cy="52"
            rx="7"
            ry="6"
            fill="#fef08a"
            stroke="#d97706"
            strokeWidth="1.5"
          />

          {/* Sparkle Glints */}
          <circle cx="48" cy="78" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="112" cy="116" r="2" fill="#ffffff" opacity="0.8" />
          <circle cx="70" cy="40" r="1.5" fill="#ffffff" opacity="0.9" />
        </svg>
      </div>
    );
  }
);

GiftBox.displayName = 'GiftBox';

