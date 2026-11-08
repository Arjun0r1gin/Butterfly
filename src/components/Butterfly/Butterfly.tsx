/**
 * BUTTERFLY — Botanical Watercolor Butterfly Character Component
 * Storybook Painted Lady (Botanical Natural History Plate style):
 * Real hand-painted watercolor textures, authentic translucent wing washes,
 * independent 3D wing-flapping physics, and directional flight banking.
 */

import { forwardRef, type HTMLAttributes } from 'react';
import styles from './Butterfly.module.css';

export interface ButterflyProps extends HTMLAttributes<HTMLDivElement> {
  /** Flap duration in seconds: smaller = faster flight, larger = gentle hover */
  flapDuration?: number;
  /** Hovering mode switches to serene slower flap */
  isHovering?: boolean;
  /** Whether to render the magical fairy aura / sparkle glow */
  showGlow?: boolean;
  /** Body banking / tilt angle in degrees */
  tilt?: number;
  /** Uniform scale multiplier */
  scale?: number;
}

export const Butterfly = forwardRef<HTMLDivElement, ButterflyProps>(function Butterfly(
  {
    flapDuration = 0.20,
    isHovering = false,
    showGlow = true,
    tilt = 0,
    scale = 1,
    className = '',
    style,
    ...rest
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={`${styles.butterflyWrapper} ${isHovering ? styles.hovering : ''} ${className}`.trim()}
      style={
        {
          '--flap-duration': `${flapDuration}s`,
          transform: `scale(${scale}) rotate(${tilt}deg)`,
          ...style,
        } as React.CSSProperties
      }
      aria-hidden="true"
      {...rest}
    >
      {/* Radiant ambient fairy glow */}
      {showGlow && <div className={styles.fairyAura} />}
      {showGlow && <div className={styles.sparkleTrail} />}

      <div className={styles.butterflyStage}>
        {/* Left Wing (Forewing + Hindwing with pivot along the right body axis) */}
        <div className={`${styles.wingContainer} ${styles.leftWingContainer}`}>
          <img
            src="/butterfly/butterfly_wing_left.png"
            alt=""
            className={styles.wingImg}
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Central Velvet Body, Thorax & Antennae */}
        <div className={styles.bodyWrapper}>
          <img
            src="/butterfly/butterfly_body.png"
            alt=""
            className={styles.bodyImg}
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Right Wing (Forewing + Hindwing with pivot along the left body axis) */}
        <div className={`${styles.wingContainer} ${styles.rightWingContainer}`}>
          <img
            src="/butterfly/butterfly_wing_right.png"
            alt=""
            className={styles.wingImg}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
});
