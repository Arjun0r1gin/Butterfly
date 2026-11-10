/**
 * BUTTERFLY — Interactive Storybook Scene Component
 * Front-facing open scrapbook with physical cylindrical 3D page turns synchronized to scroll progress.
 * Supports configurable spreads, two-sided pages, dynamic paper curling & shadows,
 * mobile responsiveness, and butterfly character placeholder.
 */

import { useRef, memo, useState } from 'react';
import { SceneContainer } from '../../components/common/SceneContainer';
import { SCENE_IDS } from '../../utils/constants';
import { STORYBOOK_SPREADS } from './storybookData';
import { ThreePageFlipPrototype } from './ThreePageFlipPrototype';
import { BookInstructionBanner } from './BookInstructionBanner';
import { useSceneTimeline } from '../../hooks/useSceneTimeline';
import { gsap } from '../../animations/gsapInit';
import styles from './Storybook.module.css';

export interface StorybookProps {
  className?: string;
  onSpreadChange?: (spreadIndex: number) => void;
}

export const Storybook = memo(function Storybook({
  className = '',
  onSpreadChange,
}: StorybookProps) {
  const containerRef = useRef<HTMLElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);

  const [curlProgress, setCurlProgress] = useState(0);

  const spreads = STORYBOOK_SPREADS;
  const pageTurnsCount = spreads.length - 1; // 3 page turns for 4 spreads

  // Synchronize cylindrical page turning with GSAP ScrollTrigger
  useSceneTimeline({
    sceneId: SCENE_IDS.STORYBOOK,
    scopeRef: containerRef,
    onSetup: () => {
      const pinWrapper = pinWrapperRef.current;
      if (!pinWrapper) return;

      // Check URL parameters for direct state inspection
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const flipParam = params?.get('flip');

      // Create master page-turn scrub timeline
      gsap.timeline({
        scrollTrigger: {
          trigger: pinWrapper,
          start: 'top top',
          end: `+=${pageTurnsCount * 1200}px`,
          pin: true,
          scrub: 0.8, // Fluid physical paper inertia
          anticipatePin: 1,
          onUpdate: (self: any) => {
            const totalVal = Math.min(pageTurnsCount - 0.001, Math.max(0, self.progress * pageTurnsCount));
            const turnIdx = Math.floor(totalVal);
            const frac = totalVal - turnIdx;

            setCurlProgress(frac);

            const settledSpread = frac >= 0.995 ? turnIdx + 1 : turnIdx;
            if (onSpreadChange) onSpreadChange(settledSpread);
          },
        },
      });

      // Handle direct inspection parameters
      if (flipParam !== null && flipParam !== undefined) {
        // Direct flip inspection (e.g. ?flip=0.5)
        const fProg = parseFloat(flipParam);
        setCurlProgress(fProg);
      }
    },
  });

  return (
    <SceneContainer
      ref={containerRef}
      sceneId={SCENE_IDS.STORYBOOK}
      className={`${styles.storybookScene} ${className}`.trim()}
      aria-label="Interactive Storybook"
    >
      {/* Background sunset garden ambience */}
      <img
        src="/garden/garden_base_master.png"
        alt=""
        className={styles.gardenBackdrop}
        aria-hidden="true"
      />

      {/* Pinned Scroll Wrapper */}
      <div ref={pinWrapperRef} className={styles.bookStage}>
        {/* Master 3D Handcrafted Storybook with Three.js Euler Elastica Page Curling */}
        <ThreePageFlipPrototype
          progress={curlProgress}
          showControls={false}
          className={styles.embeddedThreeBook}
        />

        {/* Butterfly Character Floating Anchor Placeholder */}
        <div id="storybook-butterfly-anchor" className={styles.butterflyAnchor} aria-hidden="true" />

        {/* Welcome Instruction Banner Centered Floating Above Book */}
        <BookInstructionBanner isOpen={true} />
      </div>
    </SceneContainer>
  );
});
