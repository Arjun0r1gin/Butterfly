/**
 * BUTTERFLY — Standard ScrollTrigger Configuration Presets
 * Ensures uniform trigger markers, scrub smoothness, and pinning behavior across scenes.
 */

export const SCROLL_PRESETS = {
  /**
   * For pinning a full-screen scene while scrubbing internal animations
   */
  pinnedScene: (trigger: string | Element, endDuration = '+=200%') => ({
    trigger,
    pin: true,
    start: 'top top',
    end: endDuration,
    scrub: 1, // 1-second lag smoothing for buttery scroll feel
    anticipatePin: 1,
    invalidateOnRefresh: true,
  }),

  /**
   * For standard entrance reveals that trigger once when entering viewport
   */
  revealOnce: (trigger: string | Element, start = 'top 80%') => ({
    trigger,
    start,
    toggleActions: 'play none none none',
    once: true,
  }),

  /**
   * For scrubbed continuous parallax effects
   */
  parallax: (trigger: string | Element, scrubRate: number | boolean = true) => ({
    trigger,
    start: 'top bottom',
    end: 'bottom top',
    scrub: scrubRate,
    invalidateOnRefresh: true,
  }),
} as const;

