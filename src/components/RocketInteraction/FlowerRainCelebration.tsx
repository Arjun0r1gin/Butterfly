/**
 * BUTTERFLY — Final YES Celebration: Flower Rain
 * Full-screen cascade of the original 16 watercolor flower assets from Flower Tunnel.
 * Continuous top-to-bottom rainfall with aerodynamic sway, 3D tumbling, depth parallax,
 * and lush floral blanket accumulation.
 */

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { FlowerAssetCache, type LoadedFlowerSprite } from '../../scenes/FlowerTunnel/flowerRegistry';
import styles from './FinalQuestionModal.module.css';

export interface FlowerRainCelebrationProps {
  onReplay: () => void;
  className?: string;
}

/**
 * CELEBRATION_GIF_URL:
 * Easily replace this with your uploaded custom GIF path anytime!
 * (e.g. '/storybook/assets/celebration_appointment.gif' or any asset URL)
 */
export const CELEBRATION_GIF_URL: string = '';

interface RainParticle {
  id: number;
  spriteIndex: number;
  x: number;
  y: number;
  baseX: number;
  depth: number;       // Parallax depth: 0.4 (far/small) to 1.35 (hero foreground)
  radius: number;      // Render radius
  vy: number;          // Downward fall velocity (px/s)
  swayAmp: number;     // Aerodynamic sideways drift amplitude (px)
  swayFreq: number;    // Sideways oscillation frequency (rad/s)
  swayPhase: number;   // Random phase offset
  rot: number;         // 2D planar rotation angle
  rotSpeed: number;    // Planar spin speed (rad/s)
  tumble: number;      // 3D out-of-plane flip angle
  tumbleSpeed: number; // 3D flip speed (rad/s)
  alpha: number;       // Current opacity
  targetAlpha: number; // Maximum target opacity (0.85 to 1.0)
  hasSettled: boolean; // Settled in bottom blanket
  settleY: number;
  settleAngle: number;
}

export const FlowerRainCelebration = memo(function FlowerRainCelebration({
  onReplay,
  className = '',
}: FlowerRainCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [showCelebrationCard, setShowCelebrationCard] = useState(false);

  // Fade in celebration card smoothly as the flower cascade begins
  useEffect(() => {
    const cardTimer = setTimeout(() => {
      setShowCelebrationCard(true);
    }, 400);

    return () => clearTimeout(cardTimer);
  }, []);

  const handleReplayClick = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onReplay();
  }, [onReplay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isDisposed = false;
    let sprites: LoadedFlowerSprite[] = [];
    const particles: RainParticle[] = [];
    const settledFlowers: RainParticle[] = [];

    // Check user's motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const motionMultiplier = prefersReducedMotion ? 0.45 : 1.0;

    // Viewport dimensions & DPR scaling
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const isMobile = vw <= 768;
    const maxParticles = isMobile ? 85 : 170;
    const maxSettled = isMobile ? 45 : 110;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Particle Factory
    let particleId = 0;
    const createParticle = (initialY?: number): RainParticle => {
      const depth = 0.4 + Math.random() * 0.95; // 0.4 to 1.35
      const mobileScale = isMobile ? 0.68 : 1.0;
      const radius = mobileScale * (32 + depth * 58 + Math.random() * 14); // ~45px to 125px desktop
      const x = -40 + Math.random() * (vw + 80);
      const y = initialY !== undefined ? initialY : -(radius * 2 + Math.random() * 120);

      // Downward velocity based on depth parallax
      const vy = (160 + depth * 190 + Math.random() * 60) * motionMultiplier;
      const swayAmp = (18 + depth * 28 + Math.random() * 16) * motionMultiplier;
      const swayFreq = (0.9 + Math.random() * 1.5) * motionMultiplier;

      return {
        id: ++particleId,
        spriteIndex: Math.floor(Math.random() * 16),
        x,
        y,
        baseX: x,
        depth,
        radius,
        vy,
        swayAmp,
        swayFreq,
        swayPhase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.6 * motionMultiplier,
        tumble: Math.random() * Math.PI * 2,
        tumbleSpeed: (1.2 + Math.random() * 2.2) * (Math.random() > 0.5 ? 1 : -1) * motionMultiplier,
        alpha: initialY !== undefined ? 0.85 : 0.0,
        targetAlpha: 0.88 + Math.random() * 0.12,
        hasSettled: false,
        settleY: vh - (20 + Math.random() * 140),
        settleAngle: Math.random() * Math.PI * 2,
      };
    };

    // Preload verified original 16 watercolor flower sprites from Flower Tunnel
    FlowerAssetCache.getInstance()
      .loadAll(256)
      .then((loadedSprites) => {
        if (isDisposed) return;
        sprites = loadedSprites;

        // Seed initial staggered wave entering from top
        const seedCount = isMobile ? 32 : 65;
        for (let i = 0; i < seedCount; i++) {
          particles.push(createParticle(-Math.random() * vh * 0.85));
        }
      });

    // High Performance 60 FPS Render Loop
    let lastTime = performance.now();
    let spawnAccumulator = 0;
    let elapsed = 0;

    const renderLoop = (now: number) => {
      rafRef.current = requestAnimationFrame(renderLoop);

      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      ctx.clearRect(0, 0, vw, vh);

      if (sprites.length === 0) return;

      // 1. Continuous Cascading Spawn Rate
      // Escalates from gentle rain (20/s) up to torrential flower shower (50/s)
      const spawnRate = Math.min(52, 18 + elapsed * 8);
      spawnAccumulator += spawnRate * dt;

      while (spawnAccumulator >= 1.0 && particles.length < maxParticles) {
        particles.push(createParticle());
        spawnAccumulator -= 1.0;
      }

      // 2. Render Settled Blanket Flowers at bottom
      const settledCount = settledFlowers.length;
      for (let s = 0; s < settledCount; s++) {
        const flower = settledFlowers[s];
        const sprite = sprites[flower.spriteIndex % sprites.length];
        if (!sprite || !sprite.canvas) continue;

        ctx.save();
        ctx.translate(flower.x, flower.settleY);
        ctx.rotate(flower.settleAngle);
        ctx.globalAlpha = flower.alpha;

        const rw = flower.radius * 2;
        const rh = rw / (sprite.def?.aspectRatio || 1);
        ctx.drawImage(sprite.canvas, -rw / 2, -rh / 2, rw, rh);
        ctx.restore();
      }

      // 3. Update & Render Active Cascading Flowers
      // Sort by depth so background blossoms render behind foreground hero blooms
      particles.sort((a, b) => a.depth - b.depth);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Kinematics: gravity fall + aerodynamic horizontal sway
        p.y += p.vy * dt;
        p.swayPhase += p.swayFreq * dt;
        p.x = p.baseX + Math.sin(p.swayPhase) * p.swayAmp;
        p.rot += p.rotSpeed * dt;
        p.tumble += p.tumbleSpeed * dt;

        // Smooth fade-in as flower enters viewport top
        if (p.alpha < p.targetAlpha) {
          p.alpha = Math.min(p.targetAlpha, p.alpha + dt * 2.5);
        }

        // Settling physics: portion of flowers stack up along the bottom
        if (p.y >= p.settleY && !p.hasSettled) {
          // 40% settle into the blanket if capacity allows
          if (Math.random() < 0.40 && settledFlowers.length < maxSettled) {
            p.hasSettled = true;
            p.settleAngle = p.rot;
            settledFlowers.push(p);
            particles.splice(i, 1);
            continue;
          }
        }

        // Recycle flowers falling past screen bottom
        if (p.y > vh + p.radius * 2 + 60) {
          particles.splice(i, 1);
          continue;
        }

        // Draw flower sprite with 3D tumble projection
        const sprite = sprites[p.spriteIndex % sprites.length];
        if (!sprite || !sprite.canvas) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        // 3D tumble projection (natural out-of-plane fluttering in wind)
        const tumbleScale = Math.cos(p.tumble);
        ctx.scale(1.0, 0.38 + 0.62 * Math.abs(tumbleScale));
        ctx.globalAlpha = p.alpha;

        const rw = p.radius * 2;
        const rh = rw / (sprite.def?.aspectRatio || 1);
        ctx.drawImage(sprite.canvas, -rw / 2, -rh / 2, rw, rh);

        ctx.restore();
      }
    };

    rafRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isDisposed = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className={`${styles.flowerRainWrapper} ${className}`.trim()}
      aria-label="Full-Screen Flower Rain Celebration"
    >
      {/* 1. Full-Screen Flower Rain Canvas */}
      <canvas
        ref={canvasRef}
        className={styles.flowerRainCanvas}
        aria-hidden="true"
      />

      {/* 2. Celebration Card Appearing Over the Falling Floral Shower */}
      <div
        className={`${styles.celebrationOverlay} ${
          showCelebrationCard ? styles.cardEntered : ''
        }`}
      >
        <div className={styles.celebrationCard}>
          {/* Antique Scrapbook Corner Accents */}
          <div className={`${styles.cardCorner} ${styles.cornerTL}`} aria-hidden="true" />
          <div className={`${styles.cardCorner} ${styles.cornerTR}`} aria-hidden="true" />
          <div className={`${styles.cardCorner} ${styles.cornerBL}`} aria-hidden="true" />
          <div className={`${styles.cardCorner} ${styles.cornerBR}`} aria-hidden="true" />

          {/* Memory Stamp Badge */}
          <div className={styles.celebrationStamp} aria-hidden="true">
            <span>★ APPOINTMENT SEALED ★</span>
          </div>

          <h1 className={styles.celebrationTitle}>APPOINTMENT CONFIRMED! ❤️</h1>

          <p className={styles.celebrationMessage}>
            Thank you for giving me an appointment during lunch break. 🙏
          </p>

          <p className={styles.celebrationPromise}>
            I promise I&apos;ll be there! 🥹
          </p>

          {/* Dedicated Replaceable Celebration GIF / Floral Fallback */}
          <div className={styles.celebrationGifContainer}>
            {CELEBRATION_GIF_URL ? (
              <img
                src={CELEBRATION_GIF_URL}
                alt="Appointment Celebration GIF"
                className={styles.celebrationGif}
              />
            ) : (
              <div className={styles.celebrationVignette} aria-hidden="true">
                <div className={styles.vignetteFiligreeLine}>
                  <span className={styles.vignetteStar}>✦</span>
                  <span className={styles.vignetteRule} />
                  <span className={styles.vignetteSealEmoji}>💌</span>
                  <span className={styles.vignetteRule} />
                  <span className={styles.vignetteStar}>✦</span>
                </div>
                <div className={styles.vignetteWreath}>
                  <span className={styles.vignetteFloralCenter}>🌸</span>
                  <span className={styles.vignetteSparkle}>✨</span>
                  <span className={styles.vignetteFloralCenter}>🌸</span>
                </div>
                <p className={styles.vignetteDateText}>18 March · B-Block Corridor</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.replayButton}
            onClick={handleReplayClick}
            aria-label="Replay Cinematic Journey"
          >
            REPLAY JOURNEY ↺
          </button>
        </div>
      </div>
    </div>
  );
});
