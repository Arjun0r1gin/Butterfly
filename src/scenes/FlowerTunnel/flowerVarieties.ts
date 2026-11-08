/**
 * BUTTERFLY — Botanical Flower Varieties & High-DPI Sprite Cache
 * Pre-renders flower petal geometries onto offscreen canvas buffers to ensure 60 FPS
 * draw performance without vector path recalculations on every frame.
 */

import type { FlowerVariety } from './types';

export const FLOWER_VARIETIES: FlowerVariety[] = [
  {
    name: 'Blush Sakura',
    petalCount: 5,
    petalLayers: 1,
    centerRadius: 0.18,
    petalWidthRatio: 0.45,
    petalLengthRatio: 0.85,
    primaryColor: '#fbcfe8',    // Soft blush pink
    secondaryColor: '#f472b6',  // Rose pink edge
    centerColor: '#fbbf24',     // Warm amber
    stamenColor: '#b45309',
  },
  {
    name: 'Golden Marguerite',
    petalCount: 12,
    petalLayers: 1,
    centerRadius: 0.28,
    petalWidthRatio: 0.22,
    petalLengthRatio: 0.95,
    primaryColor: '#ffffff',    // Crisp white
    secondaryColor: '#fef08a',  // Warm cream
    centerColor: '#f59e0b',     // Deep amber center
    stamenColor: '#78350f',
  },
  {
    name: 'Coral Peony',
    petalCount: 8,
    petalLayers: 2,
    centerRadius: 0.22,
    petalWidthRatio: 0.55,
    petalLengthRatio: 0.9,
    primaryColor: '#fda4af',    // Vibrant coral
    secondaryColor: '#e11d48',  // Deep crimson accent
    centerColor: '#fef3c7',     // Soft butter yellow
    stamenColor: '#d97706',
  },
  {
    name: 'Twilight Lavender',
    petalCount: 6,
    petalLayers: 1,
    centerRadius: 0.2,
    petalWidthRatio: 0.42,
    petalLengthRatio: 0.88,
    primaryColor: '#ddd6fe',    // Lavender
    secondaryColor: '#8b5cf6',  // Deep violet edge
    centerColor: '#fde047',     // Bright yellow center
    stamenColor: '#9333ea',
  },
  {
    name: 'Amber Bloom',
    petalCount: 10,
    petalLayers: 1,
    centerRadius: 0.25,
    petalWidthRatio: 0.3,
    petalLengthRatio: 0.92,
    primaryColor: '#fed7aa',    // Peach amber
    secondaryColor: '#f97316',  // Warm tangerine
    centerColor: '#ea580c',     // Rich rust core
    stamenColor: '#7c2d12',
  },
  {
    name: 'Ethereal Azure',
    petalCount: 5,
    petalLayers: 1,
    centerRadius: 0.16,
    petalWidthRatio: 0.48,
    petalLengthRatio: 0.82,
    primaryColor: '#bae6fd',    // Sky blue
    secondaryColor: '#38bdf8',  // Vivid cyan
    centerColor: '#fef08a',     // Pale lemon
    stamenColor: '#0284c7',
  },
];

export interface FlowerSprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Generates high-DPI offscreen canvas sprites for all botanical varieties.
 */
export function generateFlowerSprites(baseSize: number = 256): FlowerSprite[] {
  if (typeof document === 'undefined') return [];

  return FLOWER_VARIETIES.map((variety) => {
    const canvas = document.createElement('canvas');
    canvas.width = baseSize;
    canvas.height = baseSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { canvas, width: baseSize, height: baseSize };

    const cx = baseSize / 2;
    const cy = baseSize / 2;
    const maxRadius = (baseSize / 2) * 0.9;

    ctx.clearRect(0, 0, baseSize, baseSize);

    // Draw multi-layered petals
    for (let layer = 0; layer < variety.petalLayers; layer++) {
      const layerScale = 1 - layer * 0.18;
      const layerAngleOffset = (layer * Math.PI) / variety.petalCount;
      const count = variety.petalCount;

      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count + layerAngleOffset;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Petal shape
        const petalLen = maxRadius * variety.petalLengthRatio * layerScale;
        const petalWid = petalLen * variety.petalWidthRatio;

        const gradient = ctx.createRadialGradient(
          0,
          petalLen * 0.5,
          0,
          0,
          petalLen * 0.5,
          petalWid
        );
        gradient.addColorStop(0, variety.primaryColor);
        gradient.addColorStop(0.85, variety.secondaryColor);
        gradient.addColorStop(1, 'rgba(255,255,255,0.4)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, maxRadius * variety.centerRadius * 0.8);
        ctx.bezierCurveTo(
          petalWid,
          petalLen * 0.35,
          petalWid * 0.9,
          petalLen * 0.85,
          0,
          petalLen
        );
        ctx.bezierCurveTo(
          -petalWid * 0.9,
          petalLen * 0.85,
          -petalWid,
          petalLen * 0.35,
          0,
          maxRadius * variety.centerRadius * 0.8
        );
        ctx.closePath();
        ctx.fill();

        // Subtle petal spine highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = Math.max(1, baseSize * 0.005);
        ctx.beginPath();
        ctx.moveTo(0, maxRadius * variety.centerRadius);
        ctx.lineTo(0, petalLen * 0.8);
        ctx.stroke();

        ctx.restore();
      }
    }

    // Flower center pistil / disc floret
    const centerR = maxRadius * variety.centerRadius;
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerR);
    centerGrad.addColorStop(0, '#ffffff');
    centerGrad.addColorStop(0.3, variety.centerColor);
    centerGrad.addColorStop(1, variety.stamenColor);

    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
    ctx.fill();

    // Stamen dots
    const stamenCount = 12;
    ctx.fillStyle = variety.stamenColor;
    for (let s = 0; s < stamenCount; s++) {
      const sAngle = (s * 2 * Math.PI) / stamenCount;
      const sDist = centerR * 0.65;
      const sx = cx + Math.cos(sAngle) * sDist;
      const sy = cy + Math.sin(sAngle) * sDist;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1.5, baseSize * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }

    return { canvas, width: baseSize, height: baseSize };
  });
}

