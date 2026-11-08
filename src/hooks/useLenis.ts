/**
 * BUTTERFLY — useLenis Hook
 * Integrates Lenis smooth scrolling with the React lifecycle, ensuring proper cleanup on unmount.
 */

import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';
import { scrollManager, type ScrollManagerOptions } from '../animations/scroll/lenisManager';

export function useLenis(options?: ScrollManagerOptions): {
  getLenis: () => Lenis | null;
  scrollTo: typeof scrollManager.scrollTo;
  stop: typeof scrollManager.stop;
  start: typeof scrollManager.start;
} {
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (!isInitialized.current) {
      scrollManager.init(options);
      isInitialized.current = true;
    }

    return () => {
      scrollManager.destroy();
      isInitialized.current = false;
    };
  }, []);

  return {
    getLenis: () => scrollManager.instance,
    scrollTo: scrollManager.scrollTo.bind(scrollManager),
    stop: scrollManager.stop.bind(scrollManager),
    start: scrollManager.start.bind(scrollManager),
  };
}

