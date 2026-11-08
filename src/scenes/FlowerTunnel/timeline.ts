/**
 * BUTTERFLY — Choreographed Flower Vortex, Full Coverage & Cascading Fall Timeline
 * Orchestrates:
 * 1. Gift box appearance and pop open (0.0s - 2.0s)
 * 2. Continuous circular swirling movement starting from center (2.0s - 5.8s)
 * 3. Complete center and viewport coverage (corner-to-corner floral blanket) (5.8s - 6.8s)
 * 4. Brief hold of the fully covered floral tapestry (6.8s - 7.8s)
 * 5. All flowers falling downward together like a cascading curtain revealing next scene (7.8s - 9.8s)
 */

import { gsap } from '../../animations/gsapInit';
import type { SequenceTimelineState, TunnelConfig } from './types';
import { prefersReducedMotion } from '../../utils/device';

export interface TimelineOptions {
  config: TunnelConfig;
  paused?: boolean;
  onUpdate: (state: SequenceTimelineState) => void;
  onComplete?: () => void;
}

export function createTunnelMasterTimeline(
  state: SequenceTimelineState,
  options: TimelineOptions
): gsap.core.Timeline {
  const isReduced = prefersReducedMotion();

  const tl = gsap.timeline({
    paused: options.paused ?? false,
    defaults: {
      ease: 'power2.out',
    },
    onUpdate: () => {
      options.onUpdate(state);
    },
    onComplete: () => {
      if (options.onComplete) {
        options.onComplete();
      }
    },
  });

  if (isReduced) {
    // Accessible fallback: gentle non-disorienting crossfade sequence
    tl.to(state, {
      giftBoxOpacity: 1,
      giftBoxScale: 1,
      duration: 0.8,
      ease: 'power1.out',
    })
      .to(state, {
        giftBoxOpacity: 0,
        giftBoxScale: 1.05,
        duration: 0.5,
      }, '+=0.5')
      .to(state, {
        flowerClusterProgress: 1,
        activeFlowerRatio: 1,
        coverageProgress: 1,
        duration: 1.5,
        ease: 'power2.out',
      })
      .to(state, {
        holdProgress: 1,
        backgroundOpacity: 0,
        duration: 0.8,
      })
      .to(state, {
        fallProgress: 1,
        transitionProgress: 1,
        duration: 1.5,
        ease: 'power2.in',
      });

    return tl;
  }

  // Initial State Reset
  tl.set(state, {
    progress: 0,
    giftBoxOpacity: 0,
    giftBoxScale: 0.7,
    giftBoxRotation: 0,
    giftBoxDisintegration: 0,
    flowerClusterProgress: 0,
    activeFlowerRatio: 0,
    tunnelFormation: 0,
    tunnelDepthExpansion: 0,
    swirlProgress: 0,
    coverageProgress: 0,
    holdProgress: 0,
    fallProgress: 0,
    cameraZ: 0,
    cameraRoll: 0,
    viewportFillProgress: 0,
    transitionProgress: 0,
    backgroundOpacity: 1.0,
    gardenOpacity: 0.0,
  })
    // --- STAGE 0: Envelope Opening Response ---
    .to(state, {
      giftBoxOpacity: 0,
      duration: 0.15,
      ease: 'none',
    })

    // --- STAGE 1: Circular Swirling Motion & Center Core Bloom ---
    // Core flowers appear right at the center (r=0), erupting as envelope opens
    .to(
      state,
      {
        flowerClusterProgress: 1.0,
        activeFlowerRatio: 0.4, // Front 8 rings emerge
        swirlProgress: 0.45, // Continuous coordinated swirl
        duration: 1.8,
        ease: 'power2.out',
      }
    )

    // --- STAGE 2: Viewport Saturation (Center to Corners) ---
    // Swirl builds and expands radially until every corner is covered
    .to(
      state,
      {
        activeFlowerRatio: 1.0, // All rings active
        coverageProgress: 1.0, // Full viewport & corner blanket
        swirlProgress: 1.25, // Fluid circular flow
        duration: 2.4,
        ease: 'power1.inOut',
      }
    )

    // --- STAGE 3: Full Coverage Hold ---
    // Holds the dense, gap-free floral blanket across the entire screen.
    // Background remains 100% clean pastel (#faf5ec); Garden remains completely hidden (opacity: 0).
    .to(
      state,
      {
        holdProgress: 1.0,
        swirlProgress: 1.55, // Gentle ongoing swirl during hold
        duration: 1.2,
        ease: 'none',
      }
    )

    // --- STAGE 4: All Flowers Fall Downward (Once flowers drop down, Garden BG appears!) ---
    // Every flower drops with natural gravity, aerodynamic horizontal flutter, and spin.
    // Right as flowers drop down, Garden BG appears seamlessly (gardenOpacity 0 -> 1)
    // and clean pastel background fades out (backgroundOpacity 1 -> 0)!
    // Zero black screen: smooth transition directly from warm pastel to golden sunset garden.
    .to(
      state,
      {
        fallProgress: 1.0,
        swirlProgress: 1.75,
        gardenOpacity: 1.0, // Garden background appears as the flowers drop down!
        backgroundOpacity: 0.0,
        duration: 2.0,
        ease: 'power2.inOut',
      }
    )
    .to(
      state,
      {
        transitionProgress: 1.0,
        duration: 0.4,
        ease: 'none',
      }
    );

  return tl;
}
