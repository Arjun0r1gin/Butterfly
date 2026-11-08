/**
 * BUTTERFLY — Scene Timeline Factory
 * Standardized factory for scene timelines with integrated ScrollTrigger binding,
 * reduced-motion compliance, and lifecycle cleanup.
 */

import { gsap } from '../gsapInit';
import { prefersReducedMotion } from '../../utils/device';

export interface SceneTimelineConfig {
  id: string;
  scope?: Element | null;
  scrollTrigger?: gsap.AnimationVars['scrollTrigger'];
  defaults?: gsap.TweenVars;
  onComplete?: () => void;
}

export interface SceneTimelineHandle {
  timeline: gsap.core.Timeline;
  kill: () => void;
}

/**
 * Creates a configured GSAP timeline for a scene.
 * Note: Actual scene animations are not implemented in Phase 1 per architecture guidelines.
 */
export function createSceneTimeline(config: SceneTimelineConfig): SceneTimelineHandle {
  const isReduced = prefersReducedMotion();

  const timeline = gsap.timeline({
    id: config.id,
    defaults: {
      ease: 'power2.out',
      duration: isReduced ? 0.01 : 1,
      ...config.defaults,
    },
    scrollTrigger: config.scrollTrigger,
    onComplete: config.onComplete,
  });

  const kill = () => {
    if (timeline.scrollTrigger) {
      timeline.scrollTrigger.kill();
    }
    timeline.kill();
  };

  return {
    timeline,
    kill,
  };
}
