/**
 * BUTTERFLY — Garden Framing Layer
 * Ancient gnarly tree trunk, arching canopy bough, and hanging pink blossom clusters
 * with subtle organic branch flex and vertical camera parallax.
 */

import { memo } from 'react';
import { assetUrl } from '../../utils/assets';
import styles from './Garden.module.css';

export interface GardenFramingProps {
  className?: string;
}

export const GardenFraming = memo(function GardenFraming({
  className = '',
}: GardenFramingProps) {
  return (
    <div
      className={`${styles.framingContainer} ${className}`.trim()}
      data-parallax="framing"
      aria-hidden="true"
    >
      <div className={styles.framingTreeWrapper}>
        <img
          src={assetUrl('/garden/layer_framing_tree_clean.png')}
          alt=""
          className={styles.framingTree}
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
});
