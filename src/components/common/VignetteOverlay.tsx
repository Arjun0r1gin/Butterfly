/**
 * BUTTERFLY — VignetteOverlay Component
 * Ambient cinematic vignette layer maintaining consistent depth and edge shadowing.
 */

import { memo } from 'react';

export const VignetteOverlay = memo(function VignetteOverlay() {
  return (
    <div
      className="layer-vignette"
      aria-hidden="true"
      style={{
        background:
          'radial-gradient(circle at 50% 50%, transparent 70%, rgba(247, 160, 73, 0.12) 100%)',
      }}
    />
  );
});

