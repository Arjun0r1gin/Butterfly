/**
 * BUTTERFLY — Atmospheric Particle System
 * Simulates atmospheric floating dust, golden pollen, and restrained glowing fireflies
 * with depth parallax and natural buoyancy across all three scenes.
 */

import type { EnvironmentalParticle, ParticleSpecies, SceneConfig } from './types';
import type { ProceduralWindSystem } from './ProceduralWindSystem';

export class AtmosphericParticleSystem {
  private particles: EnvironmentalParticle[] = [];
  private worldWidth: number = 4000;
  private worldHeight: number = 1000;
  private time: number = 0;

  constructor(worldWidth: number, worldHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.initParticles();
  }

  public setWorldDimensions(w: number, h: number): void {
    if (Math.abs(this.worldWidth - w) > 50 || Math.abs(this.worldHeight - h) > 50) {
      this.worldWidth = w;
      this.worldHeight = h;
      this.initParticles();
    }
  }

  private initParticles(): void {
    this.particles = [];
    const baseCount = Math.max(90, Math.round((this.worldWidth / 4000) * 110));

    for (let i = 0; i < baseCount; i++) {
      // Determine species: 60% dust, 30% pollen, 10% fireflies
      const roll = Math.random();
      let species: ParticleSpecies = 'dust';
      let radius = 1.2 + Math.random() * 1.5;
      let baseAlpha = 0.25 + Math.random() * 0.35;
      let color: [number, number, number] = [255, 205, 140]; // Warm sunset dust
      let pulseSpeed = 1.0 + Math.random() * 1.5;

      if (roll > 0.60 && roll <= 0.88) {
        species = 'pollen';
        radius = 2.0 + Math.random() * 2.2;
        baseAlpha = 0.35 + Math.random() * 0.40;
        color = [255, 230, 110]; // Golden pollen
        pulseSpeed = 0.8 + Math.random() * 1.2;
      } else if (roll > 0.88) {
        species = 'firefly';
        radius = 2.5 + Math.random() * 2.5;
        baseAlpha = 0.50 + Math.random() * 0.40;
        color = [235, 255, 140]; // Luminous chartreuse firefly glow
        pulseSpeed = 2.0 + Math.random() * 2.0;
      }

      this.particles.push({
        species,
        worldX: Math.random() * this.worldWidth,
        worldY: 0.15 * this.worldHeight + Math.random() * (0.80 * this.worldHeight),
        depth: 0.35 + Math.random() * 0.80, // depth parallax
        radius,
        baseAlpha,
        currentAlpha: baseAlpha,
        vx: (Math.random() - 0.3) * 15,
        vy: (Math.random() - 0.6) * 12,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed,
        color,
      });
    }
  }

  public update(dt: number, windSystem: ProceduralWindSystem, sceneConfig: SceneConfig): void {
    this.time += dt;
    const margin = 100;

    for (const p of this.particles) {
      // Apply wind drift
      const drift = windSystem.getParticleDrift(p.worldX, p.worldY, sceneConfig.windStrength);
      const depthMultiplier = p.depth;

      // Update position
      p.worldX += (drift.vx * 0.5 + p.vx) * depthMultiplier * dt;
      p.worldY += (drift.vy * 0.4 + p.vy) * depthMultiplier * dt;

      // Subtle harmonic floating motion
      p.phase += dt * p.pulseSpeed;
      if (p.species === 'firefly') {
        // Organic sinusoidal pulsation
        const pulse = Math.sin(p.phase) * 0.5 + 0.5;
        p.currentAlpha = p.baseAlpha * (0.35 + 0.65 * pulse);
        // Fireflies wander slightly
        p.worldX += Math.cos(p.phase * 0.7) * 8 * dt;
        p.worldY += Math.sin(p.phase * 0.9) * 6 * dt;
      } else {
        p.currentAlpha = p.baseAlpha * (0.85 + 0.15 * Math.sin(p.phase));
      }

      // Seamless world boundary wrap
      if (p.worldX > this.worldWidth + margin) {
        p.worldX = -margin;
        p.worldY = 0.15 * this.worldHeight + Math.random() * (0.80 * this.worldHeight);
      } else if (p.worldX < -margin) {
        p.worldX = this.worldWidth + margin;
        p.worldY = 0.15 * this.worldHeight + Math.random() * (0.80 * this.worldHeight);
      }

      if (p.worldY > this.worldHeight + margin) {
        p.worldY = 0.15 * this.worldHeight;
      } else if (p.worldY < 0.10 * this.worldHeight) {
        p.worldY = this.worldHeight - 50;
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    cameraPanX: number,
    viewportW: number,
    viewportH: number,
    sceneConfig: SceneConfig
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const p of this.particles) {
      // Check if this species is enabled in current scene configuration
      if (p.species === 'pollen' && !sceneConfig.particleTypes.pollen) continue;
      if (p.species === 'firefly' && !sceneConfig.particleTypes.fireflies) continue;

      // Parallax projection based on particle depth
      const screenX = p.worldX - cameraPanX * p.depth;
      const screenY = p.worldY;

      // Viewport frustum culling
      if (screenX < -20 || screenX > viewportW + 20 || screenY < -20 || screenY > viewportH + 20) {
        continue;
      }

      const alpha = p.currentAlpha * sceneConfig.particleDensity;
      const [r, g, b] = p.color;

      if (p.species === 'firefly') {
        // Glowing halo for fireflies
        const haloRadius = p.radius * 3.5;
        const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, haloRadius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${alpha * 0.45})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX, screenY, haloRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.species === 'pollen') {
        // Soft aura for pollen
        const auraRadius = p.radius * 2.0;
        const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, auraRadius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 1.1})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX, screenY, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Crisp warm sunset dust mote
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

