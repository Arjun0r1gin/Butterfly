/**
 * BUTTERFLY — Golden Glitter Trail Particle System
 * Emits a magical trail of warm-gold and champagne-colored sparkles
 * that smoothly follows the butterfly's actual moving position across all scenes.
 */

import React, { useEffect, useRef, memo } from 'react';
import { prefersReducedMotion } from '../../utils/device';
import styles from './ButterflyGlitterTrail.module.css';

export interface ButterflyGlitterTrailProps {
  butterflyRef: React.RefObject<HTMLDivElement | null>;
  isHovering?: boolean;
  className?: string;
}

interface GlitterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxLife: number;
  age: number;
  color: string;
  isStar: boolean;
  rotation: number;
  rotSpeed: number;
}

const GOLD_PALETTE = [
  '#f5ba58', // Warm Amber Gold
  '#fff2cc', // Champagne Glint
  '#ffdf7a', // Brilliant Gold
  '#e5a840', // Deep Honey Gold
  '#ffffff', // Diamond Core Sparkle
];

export const ButterflyGlitterTrail = memo(function ButterflyGlitterTrail({
  butterflyRef,
  isHovering = false,
  className = '',
}: ButterflyGlitterTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<GlitterParticle[]>([]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    if (prefersReducedMotion()) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const maxParticles = 75;

    const renderLoop = () => {
      ctx.clearRect(0, 0, width, height);

      // Check current butterfly screen position
      const bfElem = butterflyRef.current;
      if (bfElem) {
        const style = window.getComputedStyle(bfElem);
        const opacity = parseFloat(style.opacity || '1');

        if (opacity > 0.08) {
          const rect = bfElem.getBoundingClientRect();
          const curX = rect.left + rect.width / 2;
          const curY = rect.top + rect.height / 2;

          if (curX > -50 && curX < width + 50 && curY > -50 && curY < height + 50) {
            if (lastPosRef.current) {
              const dx = curX - lastPosRef.current.x;
              const dy = curY - lastPosRef.current.y;
              const dist = Math.hypot(dx, dy);

              if (dist > 1.2) {
                // Butterfly is actively flying: spawn smooth continuous trail
                const spawnCount = Math.min(4, Math.max(1, Math.floor(dist / 6.5)));
                for (let i = 0; i < spawnCount; i++) {
                  if (particlesRef.current.length >= maxParticles) break;

                  const t = (i + Math.random()) / spawnCount;
                  const px = lastPosRef.current.x + dx * t + (Math.random() - 0.5) * 14;
                  const py = lastPosRef.current.y + dy * t + (Math.random() - 0.5) * 12;

                  particlesRef.current.push({
                    x: px,
                    y: py,
                    vx: (Math.random() - 0.5) * 0.7,
                    vy: -0.25 + (Math.random() - 0.5) * 0.5,
                    size: 1.5 + Math.random() * 2.8,
                    maxLife: 38 + Math.floor(Math.random() * 28),
                    age: 0,
                    color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
                    isStar: Math.random() < 0.22,
                    rotation: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 0.09,
                  });
                }
              } else if (isHovering && Math.random() < 0.12) {
                // Occasional subtle glint when hovering near book or rocket
                if (particlesRef.current.length < maxParticles) {
                  particlesRef.current.push({
                    x: curX + (Math.random() - 0.5) * 20,
                    y: curY + (Math.random() - 0.5) * 16,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: -0.15 + (Math.random() - 0.5) * 0.3,
                    size: 1.8 + Math.random() * 1.8,
                    maxLife: 32 + Math.floor(Math.random() * 20),
                    age: 0,
                    color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
                    isStar: Math.random() < 0.35,
                    rotation: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 0.07,
                  });
                }
              }
            }
            lastPosRef.current = { x: curX, y: curY };
          }
        } else {
          lastPosRef.current = null;
        }
      }

      // Update and render all active glitter particles
      const alive: GlitterParticle[] = [];
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age += 1;
        if (p.age >= p.maxLife) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035; // Gentle downward drift
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.rotation += p.rotSpeed;

        const progress = p.age / p.maxLife;
        // Bell-curve fade: quick soft fade-in, sustained glow, gentle dissolve
        const alpha = Math.max(0, (1.0 - progress) * Math.sin(progress * Math.PI * 0.85 + 0.15));

        ctx.save();
        ctx.globalAlpha = Math.min(1.0, alpha * 0.95);

        if (p.isStar) {
          // Delicate 4-point star glint
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          const arm = p.size * 2.0;
          const thin = p.size * 0.35;

          ctx.beginPath();
          ctx.moveTo(0, -arm);
          ctx.quadraticCurveTo(0, 0, arm, 0);
          ctx.quadraticCurveTo(0, 0, 0, arm);
          ctx.quadraticCurveTo(0, 0, -arm, 0);
          ctx.quadraticCurveTo(0, 0, 0, -arm);
          ctx.fill();

          // Soft central glow core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, thin * 1.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Soft glowing golden orb with tiny white core
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Core bright dot
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        alive.push(p);
      }

      particlesRef.current = alive;
      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [butterflyRef, isHovering]);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.glitterCanvas} ${className}`.trim()}
      aria-hidden="true"
    />
  );
});

