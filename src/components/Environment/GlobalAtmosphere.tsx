/**
 * BUTTERFLY — Global Procedural Environmental Effects Host Component
 * Orchestrates procedural clouds, atmospheric particles, wind dynamics, and swaying flora
 * continuously across Scene 1 (Meadow), Scene 2 (Pergola), and Scene 3 (Rocket).
 * Operates with 0 React re-renders in the active scroll loop for silky 60 FPS performance.
 */

import { memo, useEffect, useRef } from 'react';
import styles from './GlobalAtmosphere.module.css';
import { getBlendedEnvironmentConfig } from './SceneEnvironmentConfig';
import { ProceduralWindSystem } from './ProceduralWindSystem';
import { ProceduralCloudLayer } from './ProceduralCloudLayer';
import { AtmosphericParticleSystem } from './AtmosphericParticleSystem';
import { ProceduralForegroundVegetation } from './ProceduralForegroundVegetation';

export interface EnvState {
  progress: number;
  cameraPanX: number;
  worldWidth: number;
  isRevealed: boolean;
}

export interface GlobalAtmosphereProps {
  envStateRef: React.RefObject<EnvState>;
  className?: string;
}

export const GlobalAtmosphere = memo(function GlobalAtmosphere({
  envStateRef,
  className = '',
}: GlobalAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize procedural subsystems
    const initialWidth = envStateRef.current?.worldWidth || window.innerWidth * 2.2;
    const initialHeight = window.innerHeight;

    const windSystem = new ProceduralWindSystem();
    const cloudLayer = new ProceduralCloudLayer(initialWidth, initialHeight);
    const particleSystem = new AtmosphericParticleSystem(initialWidth, initialHeight);
    const vegetationSystem = new ProceduralForegroundVegetation(initialWidth, initialHeight);

    let rafId: number | null = null;
    let lastTime = performance.now();
    let currentOpacity = envStateRef.current?.isRevealed ? 1.0 : 0.0;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0); // capped at 2.0 for performance
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const curWorldW = envStateRef.current?.worldWidth || w * 2.2;
      cloudLayer.setWorldDimensions(curWorldW, h);
      particleSystem.setWorldDimensions(curWorldW, h);
      vegetationSystem.setWorldDimensions(curWorldW, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = (now: number) => {
      // Pause if tab is in background
      if (document.hidden) {
        lastTime = now;
        rafId = requestAnimationFrame(renderLoop);
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1); // clamp delta time
      lastTime = now;

      const envState = envStateRef.current || {
        progress: 0,
        cameraPanX: 0,
        worldWidth: window.innerWidth * 2.2,
        isRevealed: true,
      };

      // Smooth fade-in when world emerges
      const targetOpacity = envState.isRevealed ? 1.0 : 0.0;
      currentOpacity += (targetOpacity - currentOpacity) * Math.min(1.0, dt * 3.5);

      if (currentOpacity > 0.01) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
        const vw = canvas.width / dpr;
        const vh = canvas.height / dpr;

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, vw, vh);

        // Apply global fade-in
        ctx.globalAlpha = currentOpacity;

        const currentP = envState.progress;
        const curPanX = envState.cameraPanX;
        const sceneConfig = getBlendedEnvironmentConfig(currentP);

        // Advance simulation time (halved if reduced motion preferred)
        const motionScale = prefersReducedMotion ? 0.25 : 1.0;
        windSystem.update(dt * motionScale);
        cloudLayer.update(dt * motionScale, sceneConfig);
        particleSystem.update(dt * motionScale, windSystem, sceneConfig);

        // 1. Subtle Sunset Atmospheric Scattering & Horizon Haze
        renderAtmosphericHaze(ctx, vw, vh, sceneConfig, currentP);

        // 2. Procedural Drifting Clouds (Multiple Depth Layers)
        cloudLayer.render(ctx, curPanX, vw, vh, sceneConfig);

        // 3. Floating Atmospheric Dust, Golden Pollen & Glowing Fireflies
        particleSystem.render(ctx, curPanX, vw, vh, sceneConfig);

        // 4. Procedural Wind-Swayed Foreground Vegetation & Flora
        vegetationSystem.render(ctx, curPanX, vw, vh, windSystem, sceneConfig);

        ctx.restore();
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [envStateRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.atmosphereCanvas} ${className}`.trim()}
      aria-hidden="true"
    />
  );
});

/**
 * Renders subtle warm atmospheric haze and restrained sunset volumetric glow
 */
function renderAtmosphericHaze(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  sceneConfig: import('./types').SceneConfig,
  p: number
): void {
  const warmth = sceneConfig.atmosphereWarmth;
  if (warmth <= 0.05) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Soft warm horizon glow rising from bottom
  const horizonGrad = ctx.createLinearGradient(0, vh * 0.45, 0, vh);
  horizonGrad.addColorStop(0, 'rgba(255, 140, 50, 0)');
  horizonGrad.addColorStop(0.65, `rgba(240, 110, 40, ${warmth * 0.12})`);
  horizonGrad.addColorStop(1.0, `rgba(180, 60, 30, ${warmth * 0.22})`);

  ctx.fillStyle = horizonGrad;
  ctx.fillRect(0, vh * 0.45, vw, vh * 0.55);

  // Subtle sun scattering rays in Scene 1 (Meadow, sun at left-center)
  if (p < 0.35 && sceneConfig.lightRayIntensity > 0.05) {
    const sunScreenX = vw * 0.28;
    const sunScreenY = vh * 0.52;
    const rayGrad = ctx.createRadialGradient(
      sunScreenX,
      sunScreenY,
      20,
      sunScreenX,
      sunScreenY,
      vw * 0.65
    );
    const rayAlpha = sceneConfig.lightRayIntensity * (1.0 - p / 0.35) * 0.18;
    rayGrad.addColorStop(0, `rgba(255, 230, 170, ${rayAlpha * 1.5})`);
    rayGrad.addColorStop(0.35, `rgba(255, 170, 70, ${rayAlpha})`);
    rayGrad.addColorStop(1.0, 'rgba(240, 100, 40, 0)');

    ctx.fillStyle = rayGrad;
    ctx.fillRect(0, 0, vw, vh);
  }

  ctx.restore();
}
