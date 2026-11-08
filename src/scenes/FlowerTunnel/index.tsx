/**
 * BUTTERFLY — Reusable FlowerTunnel Component
 * Executes the opening flower animation sequence:
 * Clean light background -> Illustrated Pink Gift Box -> Box Dissolve -> Flower Cluster Emergence ->
 * Radial Multiplication -> Deep Floral Tunnel Illusion -> Camera Dolly -> Viewport Fill -> Garden Transition.
 *
 * Uses all 16 verified botanical watercolor flower assets from FlowerAssetCache.
 */

import { useRef, useEffect, memo } from 'react';
import { SceneContainer } from '../../components/common/SceneContainer';
import { SCENE_IDS } from '../../utils/constants';
import { GiftBox } from './GiftBox';
import { FlowerTunnelRenderer } from './flowerRenderer';
import { FlowerAssetCache, type LoadedFlowerSprite } from './flowerRegistry';
import {
  initializeTunnelParticles,
  projectTunnelParticles,
  DEFAULT_TUNNEL_CONFIG,
} from './tunnelMath';
import { createTunnelMasterTimeline } from './timeline';
import type { SequenceTimelineState, FlowerParticle } from './types';
import styles from './FlowerTunnel.module.css';

export interface FlowerTunnelProps {
  className?: string;
  autoPlay?: boolean;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  onStateUpdate?: (state: SequenceTimelineState) => void;
}

export const FlowerTunnel = memo(function FlowerTunnel({
  className = '',
  onComplete,
  onProgress,
  onStateUpdate,
}: FlowerTunnelProps) {
  // Allow direct inspection of the Garden scene via ?scene=garden
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scene') === 'garden') {
      return null;
    }
  }

  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const giftBoxRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const rendererRef = useRef<FlowerTunnelRenderer | null>(null);
  const spritesRef = useRef<LoadedFlowerSprite[]>([]);
  const particlesRef = useRef<FlowerParticle[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isTabVisibleRef = useRef<boolean>(true);

  // Animation timeline state: strictly mutated by GSAP, never triggering React re-renders
  const stateRef = useRef<SequenceTimelineState>({
    progress: 0,
    giftBoxOpacity: 0,
    giftBoxScale: 0.6,
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
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    let isDisposed = false;

    // 1. Initialize Canvas 2D Renderer
    const renderer = new FlowerTunnelRenderer(canvas);
    rendererRef.current = renderer;

    // 2. Preload and decode all 16 watercolor flower assets
    const assetCache = FlowerAssetCache.getInstance();
    assetCache.loadAll(512).then((sprites) => {
      if (isDisposed) return;
      spritesRef.current = sprites;

      // 3. Pre-allocate 3D Tunnel Particles
      const particles = initializeTunnelParticles(DEFAULT_TUNNEL_CONFIG, sprites.length);
      particlesRef.current = particles;

      // 4. Build GSAP Choreographed Master Timeline
      const startTime = performance.now();
      const tl = createTunnelMasterTimeline(stateRef.current, {
        config: DEFAULT_TUNNEL_CONFIG,
        onUpdate: (currentState) => {
          // Direct DOM style updates for gift box: zero React reconciliation cost
          if (giftBoxRef.current) {
            const gb = giftBoxRef.current;
            gb.style.opacity = currentState.giftBoxOpacity.toString();
            gb.style.transform = `scale(${currentState.giftBoxScale}) rotate(${currentState.giftBoxRotation}deg)`;
            gb.style.display = currentState.giftBoxOpacity <= 0.001 ? 'none' : 'block';
          }

          // Direct DOM style updates for opening pastel background (fades out behind opaque flower blanket)
          if (backgroundRef.current) {
            backgroundRef.current.style.opacity = currentState.backgroundOpacity.toString();
          }

          if (onStateUpdate) {
            onStateUpdate(currentState);
          }

          if (onProgress) {
            onProgress(tl.progress());
          }
        },
        onComplete: () => {
          if (onComplete) {
            onComplete();
          }
        },
      });

      timelineRef.current = tl;

      // Handle test, stage snapshot, and automated benchmark URL parameters
      const searchParams = new URLSearchParams(window.location.search);
      const stageParam = searchParams.get('stage');
      const gifProgParam = searchParams.get('gif_progress');
      const benchmarkParam = searchParams.get('benchmark');

      if (stageParam) {
        const stageMap: Record<string, number> = {
          '1': 0.10, // Gift box floating
          '2': 0.32, // Circular swirling movement & center filled
          '3': 0.58, // Viewport saturation expanding to corners
          '4': 0.72, // Full coverage hold (complete dense floral blanket)
          '5': 0.86, // Cascading downward fall (curtain dropping)
          '6': 0.98, // Revealed scene underneath
        };
        const p = stageMap[stageParam] ?? 0;
        tl.pause();
        tl.progress(p);
      } else if (gifProgParam !== null) {
        tl.pause();
        tl.progress(parseFloat(gifProgParam));
      }

      if (benchmarkParam) {
        tl.pause();
        let frameCount = 0;
        const maxFrames = 200;
        const frameTimes: number[] = [];

        const runBenchFrame = () => {
          if (isDisposed) return;
          const prog = frameCount / maxFrames;
          tl.progress(prog);

          const t0 = performance.now();
          const { width, height } = renderer.updateDimensions();
          if (width > 0 && height > 0) {
            const projected = projectTunnelParticles(
              particlesRef.current,
              stateRef.current,
              width,
              height,
              DEFAULT_TUNNEL_CONFIG,
              prog * tl.duration()
            );
            renderer.render(
              projected,
              spritesRef.current,
              stateRef.current.transitionProgress,
              prog * tl.duration()
            );
          }
          const t1 = performance.now();
          frameTimes.push(t1 - t0);

          frameCount++;
          if (frameCount < maxFrames) {
            requestAnimationFrame(runBenchFrame);
          } else {
            frameTimes.sort((a, b) => a - b);
            const sum = frameTimes.reduce((a, b) => a + b, 0);
            const mean = sum / frameTimes.length;
            const data = {
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              sampleCount: frameTimes.length,
              meanMs: Number(mean.toFixed(2)),
              medianMs: Number(frameTimes[Math.floor(frameTimes.length * 0.5)].toFixed(2)),
              p95Ms: Number(frameTimes[Math.floor(frameTimes.length * 0.95)].toFixed(2)),
              p99Ms: Number(frameTimes[Math.floor(frameTimes.length * 0.99)].toFixed(2)),
              minMs: Number(frameTimes[0].toFixed(2)),
              maxMs: Number(frameTimes[frameTimes.length - 1].toFixed(2)),
              effectiveFps: Number((1000 / mean).toFixed(1)),
            };
            console.log("BENCHMARK_RESULT:" + JSON.stringify(data));
            document.title = "BENCHMARK_DONE:" + JSON.stringify(data);
            (window as any).__benchmarkData = data;
            fetch('http://localhost:9010/metrics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            }).catch(() => {});
          }
        };

        requestAnimationFrame(runBenchFrame);
        return;
      }

      // Expose for inspection
      (window as any).__flowerTunnel = {
        timeline: tl,
        state: stateRef.current,
        canvas,
        renderer,
        particles: particlesRef.current,
        sprites: spritesRef.current,
        giftBox: giftBoxRef.current,
      };

      // 5. 60 FPS Render Loop
      const renderLoop = (timestamp: number) => {
        if (isDisposed) return;

        if (isTabVisibleRef.current) {
          const elapsedSec = (timestamp - startTime) * 0.001;
          const { width, height } = renderer.updateDimensions();

          if (width > 0 && height > 0) {
            if (
              (stateRef.current.flowerClusterProgress > 0.01 || stateRef.current.transitionProgress > 0.01) &&
              spritesRef.current.length > 0
            ) {
              const projected = projectTunnelParticles(
                particlesRef.current,
                stateRef.current,
                width,
                height,
                DEFAULT_TUNNEL_CONFIG,
                elapsedSec
              );

              renderer.render(
                projected,
                spritesRef.current,
                stateRef.current.transitionProgress,
                elapsedSec
              );
            } else {
              renderer.clear();
            }
          }
        }

        rafIdRef.current = requestAnimationFrame(renderLoop);
      };

      rafIdRef.current = requestAnimationFrame(renderLoop);
    });

    // 6. Responsive resize handler
    const handleResize = () => {
      renderer.updateDimensions();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 7. Page visibility handler to pause/resume RAF
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      if (document.hidden) {
        timelineRef.current?.pause();
      } else {
        timelineRef.current?.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 8. Cleanup on unmount
    return () => {
      isDisposed = true;
      delete (window as any).__flowerTunnel;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      renderer.clear();
      rendererRef.current = null;
    };
  }, [onComplete, onProgress]);

  return (
    <SceneContainer
      ref={containerRef}
      sceneId={SCENE_IDS.FLOWER_TUNNEL}
      className={`${styles.tunnelContainer} ${className}`.trim()}
      aria-label="Opening Flower Tunnel"
    >
      {/* Clean, light pastel opening background (fades out behind 100% opaque flower blanket) */}
      <div ref={backgroundRef} className={styles.tunnelBackground} aria-hidden="true" />

      {/* High-Performance Canvas 2D Flower Tunnel Layer */}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      {/* Step 2 & 3: Illustrated Pink Gift Box */}
      <div className={styles.giftBoxCenter}>
        <GiftBox ref={giftBoxRef} />
      </div>
    </SceneContainer>
  );
});
