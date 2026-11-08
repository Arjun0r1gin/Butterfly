/**
 * BUTTERFLY — useSceneTimeline Hook
 * Provides isolated GSAP context scoping per scene, ensuring that:
 * 1. All timelines and ScrollTriggers are automatically reverted/killed on unmount.
 * 2. Animations directly mutate DOM elements via refs without triggering React re-renders.
 */

import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from '../animations/gsapInit';
import { timelineRegistry } from '../animations/timelines/timelineRegistry';

export interface UseSceneTimelineOptions {
  sceneId: string;
  scopeRef: RefObject<HTMLElement | null>;
  onSetup?: (ctx: gsap.Context) => void;
}

export function useSceneTimeline({ sceneId, scopeRef, onSetup }: UseSceneTimelineOptions): void {
  const isSetupRef = useRef<boolean>(false);

  useEffect(() => {
    if (!scopeRef.current || isSetupRef.current) return;

    // Create a scoped GSAP context isolated to this scene's DOM tree
    const ctx = gsap.context((self) => {
      if (onSetup) {
        onSetup(self);
      }
    }, scopeRef);

    isSetupRef.current = true;

    return () => {
      // Clean up all tweens, timelines, and ScrollTriggers registered in this context
      ctx.revert();
      timelineRegistry.unregister(sceneId);
      isSetupRef.current = false;
    };
  }, [sceneId, scopeRef, onSetup]);
}

