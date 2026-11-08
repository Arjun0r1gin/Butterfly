/**
 * BUTTERFLY — Device & Viewport Detection Utilities
 */

import { BREAKPOINTS } from './constants';

export const isBrowser = typeof window !== 'undefined';

export function isTouchDevice(): boolean {
  if (!isBrowser) return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(): DeviceType {
  if (!isBrowser) return 'desktop';
  const width = window.innerWidth;
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
}

export function prefersReducedMotion(): boolean {
  if (!isBrowser) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getViewportSize(): { width: number; height: number } {
  if (!isBrowser) return { width: 1920, height: 1080 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

