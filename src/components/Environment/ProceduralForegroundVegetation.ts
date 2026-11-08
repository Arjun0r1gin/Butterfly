/**
 * BUTTERFLY — Procedural Foreground Vegetation System
 * Generates independent procedural grass blades, wildflower stems, and delicate flora
 * along the foreground world floor, naturally displaced by the harmonic wind field.
 */

import type { ForegroundPlant, SceneConfig } from './types';
import type { ProceduralWindSystem } from './ProceduralWindSystem';

export class ProceduralForegroundVegetation {
  private plants: ForegroundPlant[] = [];
  private worldWidth: number = 4000;
  private worldHeight: number = 1000;

  constructor(worldWidth: number, worldHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.initPlants();
  }

  public setWorldDimensions(w: number, h: number): void {
    if (Math.abs(this.worldWidth - w) > 50 || Math.abs(this.worldHeight - h) > 50) {
      this.worldWidth = w;
      this.worldHeight = h;
      this.initPlants();
    }
  }

  private initPlants(): void {
    this.plants = [];
    // Distribute grass blades and wildflowers along the bottom of the world
    const count = Math.max(160, Math.round((this.worldWidth / 4000) * 220));

    // Diverse floral palette derived from the sunset garden
    const flowerColors = [
      '#f59e0b', // Golden amber buttercup
      '#ef4444', // Sunset coral poppy
      '#a855f7', // Twilight lavender
      '#f472b6', // Soft peach-pink bloom
      '#fbbf24', // Sun-drenched chamomile
    ];

    for (let i = 0; i < count; i++) {
      const worldX = (i / count) * this.worldWidth + (Math.sin(i * 4.3) * 12);
      const isFlower = i % 5 === 0;
      const isTall = i % 7 === 0;

      // Base Y near bottom of screen
      const baseY = 0.94 + (Math.sin(i * 7.1) * 0.5 + 0.5) * 0.05; // 0.94 to 0.99
      const height = isTall ? 45 + Math.random() * 25 : 24 + Math.random() * 26;
      const width = 2.0 + Math.random() * 2.0;
      const stiffness = 0.8 + Math.random() * 0.9;
      const phaseOffset = i * 0.35 + Math.random() * 0.5;

      // Color variation across depth
      const depthHue = i % 3;
      let colorBase = '#273811';
      let colorTip = '#5c6b24';

      if (depthHue === 1) {
        colorBase = '#1f2e0d';
        colorTip = '#78822d';
      } else if (depthHue === 2) {
        colorBase = '#304216';
        colorTip = '#8c7a2b'; // Sunlit golden-green
      }

      this.plants.push({
        worldX,
        baseY,
        height,
        width,
        stiffness,
        phaseOffset,
        bladeType: isFlower ? 'wildflower' : isTall ? 'tall_stem' : 'grass_blade',
        colorBase,
        colorTip,
        hasFlower: isFlower,
        flowerColor: flowerColors[i % flowerColors.length],
        flowerRadius: 3.5 + Math.random() * 2.5,
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    cameraPanX: number,
    viewportW: number,
    viewportH: number,
    windSystem: ProceduralWindSystem,
    sceneConfig: SceneConfig
  ): void {
    const globalVegDensity = sceneConfig.vegetationDensity;
    if (globalVegDensity <= 0.05) return;

    ctx.save();
    ctx.lineCap = 'round';

    for (const plant of this.plants) {
      // Vegetation has foreground parallax (factor = 1.0)
      const screenBaseX = plant.worldX - cameraPanX;
      const screenBaseY = plant.baseY * viewportH;

      // Viewport frustum culling
      if (screenBaseX < -40 || screenBaseX > viewportW + 40) {
        continue;
      }

      // Compute wind sway for this blade
      const swayPx = windSystem.getSwayOffset(
        plant.worldX,
        plant.stiffness,
        plant.phaseOffset,
        sceneConfig.windStrength,
        sceneConfig.windGustiness
      ) * (plant.height * 0.35);

      const tipX = screenBaseX + swayPx;
      const tipY = screenBaseY - plant.height;
      const ctrlX = screenBaseX + swayPx * 0.45;
      const ctrlY = screenBaseY - plant.height * 0.55;

      // Render stem / grass blade with gradient
      const grad = ctx.createLinearGradient(screenBaseX, screenBaseY, tipX, tipY);
      grad.addColorStop(0, plant.colorBase);
      grad.addColorStop(1, plant.colorTip);

      ctx.strokeStyle = grad;
      ctx.lineWidth = plant.width;

      ctx.beginPath();
      ctx.moveTo(screenBaseX, screenBaseY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.stroke();

      // Render wildflower blossom nodding at tip
      if (plant.hasFlower && plant.flowerColor) {
        const flowerR = (plant.flowerRadius || 4) * globalVegDensity;
        ctx.fillStyle = plant.flowerColor;

        // Soft blossom glow
        ctx.beginPath();
        ctx.arc(tipX, tipY, flowerR, 0, Math.PI * 2);
        ctx.fill();

        // Golden center stamen
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath();
        ctx.arc(tipX, tipY, flowerR * 0.40, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

