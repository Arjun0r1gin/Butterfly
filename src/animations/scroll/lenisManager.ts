/**
 * BUTTERFLY — Lenis & ScrollTrigger Synchronization Manager
 * Orchestrates Lenis smooth scrolling with GSAP ScrollTrigger on a unified RAF loop,
 * preventing desynchronization, rubber-banding, or scroll-drift.
 */

import Lenis, { type LenisOptions } from 'lenis';
import { gsap, ScrollTrigger } from '../gsapInit';
import { prefersReducedMotion } from '../../utils/device';

export interface ScrollManagerOptions extends Partial<LenisOptions> {
  autoRaf?: boolean;
}

class ScrollManager {
  private lenis: Lenis | null = null;
  private tickerCallback: ((time: number) => void) | null = null;
  private isRunning: boolean = false;

  /**
   * Initialize Lenis and bind to GSAP ScrollTrigger
   */
  public init(options: ScrollManagerOptions = {}): Lenis | null {
    if (typeof window === 'undefined') return null;

    // Destroy existing instance if present before re-creating
    if (this.lenis) {
      this.destroy();
    }

    const reducedMotion = prefersReducedMotion();

    const defaultOptions: LenisOptions = {
      duration: reducedMotion ? 0.01 : 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !reducedMotion,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
      ...options,
    };

    this.lenis = new Lenis(defaultOptions);

    // 1. Synchronize Lenis scroll position with GSAP ScrollTrigger
    this.lenis.on('scroll', ScrollTrigger.update);

    // 2. Drive Lenis via GSAP ticker for single unified requestAnimationFrame loop
    this.tickerCallback = (time: number) => {
      this.lenis?.raf(time * 1000);
    };

    gsap.ticker.add(this.tickerCallback);
    gsap.ticker.lagSmoothing(0);

    this.isRunning = true;
    return this.lenis;
  }

  public get instance(): Lenis | null {
    return this.lenis;
  }

  public get active(): boolean {
    return this.isRunning;
  }

  public scrollTo(target: string | number | HTMLElement, options?: Parameters<Lenis['scrollTo']>[1]): void {
    this.lenis?.scrollTo(target, options);
  }

  public stop(): void {
    this.lenis?.stop();
    this.isRunning = false;
  }

  public start(): void {
    this.lenis?.start();
    this.isRunning = true;
  }

  public refresh(): void {
    ScrollTrigger.refresh();
  }

  public destroy(): void {
    if (this.tickerCallback) {
      gsap.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }

    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }

    this.isRunning = false;
  }
}

export const scrollManager = new ScrollManager();
