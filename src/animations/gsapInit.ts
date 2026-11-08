/**
 * BUTTERFLY — GSAP & ScrollTrigger Core Initialization
 * Central registry for GSAP plugins, ticker timing, and default animation configurations.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

let isInitialized = false;

export function initGSAP(): void {
  if (isInitialized || typeof window === 'undefined') return;

  // 1. Register official GSAP plugins
  gsap.registerPlugin(ScrollTrigger, useGSAP);

  // 2. Set global defaults
  gsap.defaults({
    ease: 'power2.out',
    duration: 0.8,
  });

  // 3. Configure GSAP ticker for seamless Lenis synchronization.
  // lagSmoothing(0) prevents GSAP from artificially jumping frames during lag spikes,
  // keeping ScrollTrigger perfectly aligned with the smooth-scroller virtual position.
  gsap.ticker.lagSmoothing(0);

  // 4. Configure ScrollTrigger defaults
  ScrollTrigger.config({
    limitCallbacks: true,
    syncInterval: 40,
    ignoreMobileResize: true, // Prevents sudden jumps when mobile address bar shows/hides
  });

  isInitialized = true;
}

// Auto-initialize when loaded in browser
if (typeof window !== 'undefined') {
  initGSAP();
}

export { gsap, ScrollTrigger, useGSAP };

