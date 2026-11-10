/**
 * BUTTERFLY — High-Performance Canvas 2D Flower Tunnel Renderer
 * Renders hundreds of watercolor flower assets with:
 * - Sub-pixel transforms and genuine alpha transparency
 * - Aspect-ratio correct drawing for all 16 floral varieties
 * - Device pixel ratio scaling (capped at 2.0 for mobile GPU safety)
 * - Zero garbage collection allocations in the active 60 FPS render loop
 * - Drifting watercolor petals transition matching reference video destination
 */

import type { ProjectedFlower } from './tunnelMath';
import type { LoadedFlowerSprite } from './flowerRegistry';

interface DriftingPetal {
  varietyIndex: number;
  xNorm: number;
  yOffset: number;
  fallSpeed: number;
  swaySpeed: number;
  swayAmp: number;
  rotationSpeed: number;
  initialRotation: number;
  scale: number;
}

export class FlowerTunnelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private width: number = 0;
  private height: number = 0;
  private petals: DriftingPetal[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // Reduces compositor latency on supported browsers
    });

    if (!context) {
      throw new Error('Unable to acquire 2D rendering context for FlowerTunnel');
    }
    this.ctx = context;
    this.initDriftingPetals();
    this.updateDimensions();
  }

  private initDriftingPetals(): void {
    const PETAL_COUNT = 24;
    this.petals = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      this.petals.push({
        varietyIndex: i % 16,
        xNorm: (i * 0.043 + 0.02) % 1.0,
        yOffset: ((i * 37) % 600) - 200,
        fallSpeed: 45 + ((i * 13) % 35),
        swaySpeed: 1.2 + ((i * 7) % 10) * 0.15,
        swayAmp: 25 + ((i * 5) % 20),
        rotationSpeed: (((i % 2 === 0 ? 1 : -1) * (0.3 + ((i * 3) % 5) * 0.1))),
        initialRotation: (i * 47) % (Math.PI * 2),
        scale: 0.22 + ((i * 11) % 15) * 0.012, // Small petal size ~35-55px
      });
    }
  }

  public updateDimensions(): { width: number; height: number } {
    if (typeof window === 'undefined') return { width: 0, height: 0 };

    // Cap DPR adaptively: 1.5 on mobile to protect GPU fill-rate, 2.0 on desktop
    const isMobile = window.innerWidth <= 768;
    this.dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2.0);

    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = Math.max(1, Math.floor(rect.width));
    const displayHeight = Math.max(1, Math.floor(rect.height));

    if (this.width !== displayWidth || this.height !== displayHeight) {
      this.width = displayWidth;
      this.height = displayHeight;
      this.canvas.width = Math.floor(displayWidth * this.dpr);
      this.canvas.height = Math.floor(displayHeight * this.dpr);
    }

    return { width: this.width, height: this.height };
  }

  /**
   * Renders a single frame from depth-sorted projected flowers
   * using cached pre-rendered watercolor flower sprites.
   * Direct affine matrix transforms with ZERO ctx.save()/ctx.restore() overhead.
   */
  public render(
    projectedFlowers: ProjectedFlower[],
    sprites: LoadedFlowerSprite[],
    petalAlpha: number = 0,
    timeSec: number = 0,
    activeCount?: number
  ): void {
    const ctx = this.ctx;
    const dpr = this.dpr;

    // Reset transform matrix and clear buffer
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const spriteCount = sprites.length;
    if (spriteCount === 0) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';

    // 1. Render depth-sorted tunnel flowers with direct affine matrix transforms
    const flowerCount = activeCount !== undefined ? activeCount : projectedFlowers.length;
    for (let i = 0; i < flowerCount; i++) {
      const flower = projectedFlowers[i];
      const spriteIndex = flower.particle.varietyIndex % spriteCount;
      const sprite = sprites[spriteIndex];

      const r = flower.renderRadius;
      const drawWidth = r * 2 * sprite.sqrtAspect;
      const drawHeight = r * 2 * sprite.invSqrtAspect;
      const hw = drawWidth / 2;
      const hh = drawHeight / 2;

      const rad = flower.rotation;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Direct matrix transform with baked-in DPR: eliminates 600 ctx.save()/ctx.restore() per frame!
      ctx.setTransform(
        cos * dpr,
        sin * dpr,
        -sin * dpr,
        cos * dpr,
        flower.screenX * dpr,
        flower.screenY * dpr
      );
      ctx.globalAlpha = flower.alpha;

      ctx.drawImage(
        sprite.canvas,
        -hw,
        -hh,
        drawWidth,
        drawHeight
      );
    }

    // 2. Render drifting soft petals during climax / exit transition (ref_08_destination)
    if (petalAlpha > 0.01) {
      const w = this.width;
      const h = this.height;

      for (let p = 0; p < this.petals.length; p++) {
        const petal = this.petals[p];
        const sprite = sprites[petal.varietyIndex % spriteCount];

        const totalY = petal.yOffset + timeSec * petal.fallSpeed;
        const currentY = (totalY % (h + 120)) - 60;
        const currentX = petal.xNorm * w + Math.sin(timeSec * petal.swaySpeed + p) * petal.swayAmp;
        const rotation = petal.initialRotation + timeSec * petal.rotationSpeed;

        const baseSize = 123 * petal.scale;
        const drawW = baseSize * sprite.sqrtAspect;
        const drawH = baseSize * sprite.invSqrtAspect;

        const rad = rotation;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        ctx.setTransform(
          cos * dpr,
          sin * dpr,
          -sin * dpr,
          cos * dpr,
          currentX * dpr,
          currentY * dpr
        );
        ctx.globalAlpha = petalAlpha * 0.85;
        ctx.drawImage(sprite.canvas, -drawW / 2, -drawH / 2, drawW, drawH);
      }
    }

    // Reset transform matrix cleanly at end of frame
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public clear(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
