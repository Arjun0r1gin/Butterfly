/**
 * BUTTERFLY — Garden Landscape Master Environment
 * Renders the foundational watercolor painting preserving 100% fidelity to the reference,
 * organized into discrete depth planes with bleed margins for vertical camera parallax.
 */

import { memo } from 'react';
import styles from './Garden.module.css';

export interface GardenLandscapeProps {
  className?: string;
}

export const GardenLandscape = memo(function GardenLandscape({
  className = '',
}: GardenLandscapeProps) {
  return (
    <div className={`${styles.landscapeContainer} ${className}`.trim()} aria-hidden="true">
      {/* Foundational Master Environment — guaranteed fallback */}
      <img
        src="/garden/garden_base_master.png"
        alt="Watercolor sunset garden meadow"
        className={styles.masterEnvironment}
        data-parallax="base"
        loading="eager"
        decoding="async"
      />

      {/* Discrete Depth Planes for Vertical Camera Movement */}
      {/* Depth 1: Sky & Horizon */}
      <img
        src="/garden/layer_1_sky.png"
        alt=""
        className={styles.parallaxLayer}
        data-parallax="sky"
        loading="eager"
        decoding="async"
      />

      {/* Depth 2: Distant Mountains & Purple Hills */}
      <img
        src="/garden/layer_3_distant_hills.png"
        alt=""
        className={styles.parallaxLayer}
        data-parallax="hills"
        loading="eager"
        decoding="async"
      />

      {/* Depth 3: Midground Golden Meadow & Flowering Pink Tree */}
      <img
        src="/garden/layer_4_midground_meadow.png"
        alt=""
        className={styles.parallaxLayer}
        data-parallax="meadow"
        loading="eager"
        decoding="async"
      />

      {/* Depth 4: Mossy Boulders */}
      <img
        src="/garden/layer_5_midground_rocks.png"
        alt=""
        className={styles.parallaxLayer}
        data-parallax="rocks"
        loading="eager"
        decoding="async"
      />

      {/* Depth 5: Foreground Wildflowers, Daisies & Hibiscus */}
      <img
        src="/garden/layer_6_foreground_flora.png"
        alt=""
        className={styles.parallaxLayer}
        data-parallax="flora"
        loading="eager"
        decoding="async"
      />
    </div>
  );
});
