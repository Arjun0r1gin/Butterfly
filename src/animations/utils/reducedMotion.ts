/**
 * BUTTERFLY — Accessible Animation & Reduced Motion Helpers
 * Guarantees that users with vestibular or motion sensitivities experience instantaneous transitions
 * or simplified, non-disorienting animations.
 */

import { prefersReducedMotion } from '../../utils/device';
import { gsap } from '../gsapInit';

/**
 * Adjusts a GSAP timeline based on reduced motion settings.
 * If reduced motion is active, sets the timeline's timeScale to an ultra-fast value or seeks to end.
 */
export function applyReducedMotionToTimeline(timeline: gsap.core.Timeline): gsap.core.Timeline {
  if (prefersReducedMotion()) {
    timeline.progress(1);
    timeline.pause();
  }
  return timeline;
}

/**
 * Creates a motion-safe tween. If reduced motion is preferred, applies only opacity or jumps to end.
 */
export function safeTween(
  target: gsap.TweenTarget,
  vars: gsap.TweenVars,
  reducedVars?: gsap.TweenVars
): gsap.core.Tween {
  if (prefersReducedMotion()) {
    const fallbackVars: gsap.TweenVars = reducedVars ?? {
      duration: 0.01,
      opacity: vars.opacity !== undefined ? vars.opacity : 1,
      ease: 'none',
      clearProps: 'transform',
    };
    return gsap.to(target, fallbackVars);
  }

  return gsap.to(target, vars);
}

