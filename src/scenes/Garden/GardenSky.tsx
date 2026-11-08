/**
 * BUTTERFLY — Garden Sky Layer
 * Breathing warm sun corona glow and seamless drifting watercolor clouds
 * with subtle vertical camera parallax.
 */

import { memo } from 'react';
import styles from './Garden.module.css';

export interface GardenSkyProps {
  className?: string;
}

export const GardenSky = memo(function GardenSky({ className = '' }: GardenSkyProps) {
  return (
    <div className={`${styles.skyContainer} ${className}`.trim()} aria-hidden="true">
      {/* Atmospheric Sun Corona & Sunset Bloom Glow */}
      <div className={styles.sunGlowOverlay} data-parallax="sun" />

      {/* Layer 2: Drifting Watercolor Clouds */}
      <div className={styles.cloudsWrapper} data-parallax="clouds">
        <div className={styles.cloudStrip} />
      </div>
    </div>
  );
});
