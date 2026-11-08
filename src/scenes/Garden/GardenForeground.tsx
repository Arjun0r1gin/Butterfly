/**
 * BUTTERFLY — Garden Foreground Layer
 * Renders dynamic canvas overlay with delicate watercolor flower petals
 * gently fluttering across the central meadow on the sunset breeze.
 */

import { useRef, useEffect, memo } from 'react';
import { FlowerAssetCache, type LoadedFlowerSprite } from '../FlowerTunnel/flowerRegistry';
import type { FloatingPetal } from './types';
import styles from './Garden.module.css';

export interface GardenForegroundProps {
  className?: string;
}

export const GardenForeground = memo(function GardenForeground({
  className = '',
}: GardenForegroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isDisposed = false;
    let rafId: number | null = null;
    let sprites: LoadedFlowerSprite[] = [];

    // Preload verified flower sprites
    FlowerAssetCache.getInstance()
      .loadAll(128)
      .then((loaded) => {
        if (isDisposed) return;
        sprites = loaded;
      });

    // Initialize floating breeze petals (delicate, low density, authentic)
    const petals: FloatingPetal[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: window.innerHeight * 0.45 + Math.random() * window.innerHeight * 0.45,
      speedX: 0.35 + Math.random() * 0.6,
      speedY: 0.12 + Math.random() * 0.25,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 35,
      scale: 0.022 + Math.random() * 0.015, // Delicate tiny petal scale
      opacity: 0.55 + Math.random() * 0.25,
      flowerIndex: (i * 3 + 1) % 16,
    }));

    const updateDimensions = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      return { width: rect.width, height: rect.height, dpr };
    };

    let startTime = performance.now();

    const render = (time: number) => {
      if (isDisposed) return;

      const elapsed = (time - startTime) * 0.001;
      const { width, height, dpr } = updateDimensions();

      if (width > 0 && height > 0) {
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        if (sprites.length > 0) {
          // Render gentle floating petals drifting across meadow
          for (let i = 0; i < petals.length; i++) {
            const p = petals[i];
            p.x += p.speedX;
            p.y += p.speedY + 0.25 * Math.sin(elapsed * 2.2 + p.id);
            p.rotation += p.rotationSpeed * 0.016;

            if (p.x > width + 40 || p.y > height + 40) {
              p.x = -30;
              p.y = height * 0.45 + Math.random() * height * 0.45;
            }

            const sprite = sprites[p.flowerIndex % sprites.length];
            if (!sprite) continue;

            const pSize = Math.min(width, height) * p.scale;
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.drawImage(sprite.canvas, -pSize / 2, -pSize / 2, pSize, pSize);
            ctx.restore();
          }
        }

        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={`${styles.foregroundContainer} ${className}`.trim()} aria-hidden="true">
      {/* Floating Breeze Petals Overlay */}
      <canvas ref={canvasRef} className={styles.foregroundCanvas} />
    </div>
  );
});
