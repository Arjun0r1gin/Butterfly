/**
 * BUTTERFLY — Garden Scene Component
 * Master scene composing all 7 living watercolor depth layers:
 * - Layers 1 & 2: Sunset Sky, Glowing Sun & Drifting Watercolor Clouds
 * - Layers 3, 4, 5: Distant Purple Hills, Midground Meadow, Pink Tree & Mossy Boulders
 * - Layer 6: Foreground Wildflower Meadow & Harmonic Breeze Flowers
 * - Layer 7: Left Ancient Framing Tree & Hanging Blossom Canopy
 */

import { useRef, memo } from 'react';
import { SceneContainer } from '../../components/common/SceneContainer';
import { SCENE_IDS } from '../../utils/constants';
import { GardenSky } from './GardenSky';
import { GardenLandscape } from './GardenLandscape';
import { GardenForeground } from './GardenForeground';
import { GardenFraming } from './GardenFraming';
import styles from './Garden.module.css';

export interface GardenProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Garden = memo(function Garden({ className = '', style }: GardenProps) {
  const containerRef = useRef<HTMLElement>(null);

  return (
    <SceneContainer
      ref={containerRef}
      sceneId={SCENE_IDS.GARDEN}
      className={`${styles.garden} ${className}`.trim()}
      style={style}
      aria-label="Sunset Garden Scene"
    >
      {/* Layer 1 & 2: Sunset Sky, Glowing Sun & Drifting Clouds */}
      <GardenSky />

      {/* Layer 3, 4, 5: Distant Hills, Meadow & Mossy Boulders */}
      <GardenLandscape />

      {/* Layer 6: Foreground Wildflowers & Swaying Flower Heads */}
      <GardenForeground />

      {/* Layer 7: Left Framing Ancient Tree & Hanging Blossom Canopy */}
      <GardenFraming />
    </SceneContainer>
  );
});
