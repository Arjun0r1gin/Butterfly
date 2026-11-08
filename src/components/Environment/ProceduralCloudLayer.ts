/**
 * BUTTERFLY — Procedural Cloud Layer System
 * Renders multiple depth layers of soft, irregular sunset cloud clusters with warm
 * peach, amber, coral and dark-red volumetric lighting drifting across the sky.
 */

import type { ProceduralCloudCluster, ProceduralCloudPuff, SceneConfig } from './types';

export class ProceduralCloudLayer {
  private clusters: ProceduralCloudCluster[] = [];
  private worldWidth: number = 4000;
  private worldHeight: number = 1000;

  constructor(worldWidth: number, worldHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.initClusters();
  }

  public setWorldDimensions(w: number, h: number): void {
    if (Math.abs(this.worldWidth - w) > 50 || Math.abs(this.worldHeight - h) > 50) {
      this.worldWidth = w;
      this.worldHeight = h;
      this.initClusters();
    }
  }

  private initClusters(): void {
    this.clusters = [];
    // Distribute cloud formations across the 3 scenes in world space
    // Scene 1: X in [0, worldWidth * 0.35]
    // Scene 2: X in [worldWidth * 0.35, worldWidth * 0.70]
    // Scene 3: X in [worldWidth * 0.70, worldWidth]
    const clusterCount = Math.max(14, Math.round(this.worldWidth / 260));

    for (let i = 0; i < clusterCount; i++) {
      const depthLayer = i % 3; // 0 = high stratosphere, 1 = mid sunset, 2 = lower wisps
      let parallaxFactor = 0.25;
      let speedMultiplier = 0.45;
      let scale = 1.0;
      let yMin = 0.04;
      let yMax = 0.22;

      if (depthLayer === 1) {
        parallaxFactor = 0.45;
        speedMultiplier = 0.75;
        scale = 1.25;
        yMin = 0.10;
        yMax = 0.34;
      } else if (depthLayer === 2) {
        parallaxFactor = 0.65;
        speedMultiplier = 1.10;
        scale = 0.90;
        yMin = 0.18;
        yMax = 0.44;
      }

      // Distribute evenly with organic jitter
      const baseWorldX = (i / clusterCount) * this.worldWidth + (Math.sin(i * 3.7) * 80);
      const worldY = (yMin + (Math.sin(i * 5.1) * 0.5 + 0.5) * (yMax - yMin)) * this.worldHeight;

      // Build 5 to 9 overlapping organic puffs per cluster
      const puffCount = 5 + (i % 4);
      const puffs: ProceduralCloudPuff[] = [];

      for (let p = 0; p < puffCount; p++) {
        const angle = (p / puffCount) * Math.PI * 2 + (i * 0.4);
        const dist = (Math.sin(p * 2.3 + i) * 0.4 + 0.6) * (60 * scale);
        const relX = Math.cos(angle) * dist * 1.5; // wider horizontally
        const relY = Math.sin(angle) * dist * 0.55; // flatter vertically
        const radiusX = (55 + Math.sin(p * 1.7) * 25) * scale;
        const radiusY = (35 + Math.cos(p * 2.1) * 15) * scale;

        puffs.push({
          relX,
          relY,
          radiusX,
          radiusY,
          rotation: Math.sin(p + i) * 0.2,
          baseOpacity: 0.22 + (Math.cos(p * 1.3) * 0.08),
        });
      }

      this.clusters.push({
        id: i,
        worldX: baseWorldX,
        worldY,
        depthLayer,
        parallaxFactor,
        speedMultiplier,
        scale,
        puffs,
      });
    }
  }

  /**
   * Update cloud drift across time
   */
  public update(dt: number, sceneConfig: SceneConfig): void {
    const margin = 350;
    const baseSpeed = sceneConfig.cloudSpeed;

    for (const cluster of this.clusters) {
      // Slow gentle horizontal drift (rightward sunset movement)
      cluster.worldX += baseSpeed * cluster.speedMultiplier * dt;

      // Seamless wrap around the world
      if (cluster.worldX > this.worldWidth + margin) {
        cluster.worldX = -margin;
        // Subtle vertical variation on wrap
        cluster.worldY = Math.max(
          0.04 * this.worldHeight,
          Math.min(0.44 * this.worldHeight, cluster.worldY + (Math.random() - 0.5) * 40)
        );
      }
    }
  }

  /**
   * Draw clouds onto viewport canvas with camera parallax projection
   */
  public render(
    ctx: CanvasRenderingContext2D,
    cameraPanX: number,
    viewportW: number,
    viewportH: number,
    sceneConfig: SceneConfig
  ): void {
    const [rTint, gTint, bTint] = sceneConfig.cloudTint;
    const globalOpacity = sceneConfig.cloudOpacity * sceneConfig.cloudDensity;

    ctx.save();
    // Use 'screen' or soft alpha blending to naturally merge into sky without seams
    ctx.globalCompositeOperation = 'screen';

    for (const cluster of this.clusters) {
      // Parallax projection: distant clouds move less with camera
      const screenX = cluster.worldX - cameraPanX * cluster.parallaxFactor;
      const screenY = cluster.worldY;

      // Viewport frustum culling
      const clusterRadius = 260 * cluster.scale;
      if (
        screenX + clusterRadius < 0 ||
        screenX - clusterRadius > viewportW ||
        screenY + clusterRadius < 0 ||
        screenY - clusterRadius > viewportH
      ) {
        continue;
      }

      for (const puff of cluster.puffs) {
        const px = screenX + puff.relX;
        const py = screenY + puff.relY;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(puff.rotation);
        ctx.scale(1.0, puff.radiusY / puff.radiusX);

        // Soft radial density gradient: warm sunset illuminated core fading to zero
        const grad = ctx.createRadialGradient(0, -puff.radiusX * 0.15, 0, 0, 0, puff.radiusX);
        const alpha = puff.baseOpacity * globalOpacity;

        // Sunset highlights on top, warm amber in mid, deep dark-red on shaded underside
        grad.addColorStop(0, `rgba(${rTint}, ${gTint}, ${bTint}, ${alpha * 1.2})`);
        grad.addColorStop(0.35, `rgba(${Math.min(255, rTint + 15)}, ${Math.max(0, gTint - 30)}, 60, ${alpha * 0.85})`);
        grad.addColorStop(0.70, `rgba(160, 50, 40, ${alpha * 0.40})`);
        grad.addColorStop(1.0, 'rgba(120, 30, 30, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, puff.radiusX, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore();
  }
}

