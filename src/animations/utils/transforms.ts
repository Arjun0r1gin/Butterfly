/**
 * BUTTERFLY — GPU Transforms & Compositing Helpers
 * Ensures smooth 60 FPS transitions via hardware acceleration without causing layer thrashing.
 */

import { gsap } from '../gsapInit';

/**
 * Promotes element to its own compositor layer using transform3d and will-change.
 */
export function promoteToGPU(elements: gsap.TweenTarget): void {
  gsap.set(elements, {
    force3D: true,
    backfaceVisibility: 'hidden',
  });
}

/**
 * Clears GPU-specific override properties to release graphics memory when scene is offscreen.
 */
export function demoteFromGPU(elements: gsap.TweenTarget): void {
  gsap.set(elements, {
    clearProps: 'willChange,backfaceVisibility',
  });
}

