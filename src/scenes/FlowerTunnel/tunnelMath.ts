/**
 * BUTTERFLY — Swirling Floral Vortex, Dense Viewport Saturation & Cascading Fall
 * Implements:
 * 1. Continuous, organic circular swirling motion around the screen center
 * 2. Absolutely NO empty center — core center (r=0) packed with overlapping blossoms
 * 3. Complete corner-to-corner viewport coverage forming a dense floral surface
 * 4. Brief hold of the fully covered floral tapestry
 * 5. Gravity-driven cascading downward fall of all flowers revealing the next scene
 */

import type { FlowerParticle, TunnelConfig, SequenceTimelineState } from './types';
import { clamp } from '../../utils/math';

export const DEFAULT_TUNNEL_CONFIG: TunnelConfig = {
  ringCount: 20,
  baseFlowersPerRing: 15,
  tunnelDepth: 3000,
  fov: 650,
  initialRadius: 0, // No center opening — center is completely filled!
  maxRadius: 520,
  swirlStrength: 0.35,
};

/**
 * Initializes particles in concentric swirling rings starting from the absolute center (r=0)
 * out to the outer corners, with randomized gravity and aerodynamic fluttering properties.
 */
export function initializeTunnelParticles(
  config: TunnelConfig = DEFAULT_TUNNEL_CONFIG,
  varietyCount: number = 16
): FlowerParticle[] {
  const particles: FlowerParticle[] = [];
  let particleId = 0;

  const numRings = config.ringCount;

  for (let ring = 0; ring < numRings; ring++) {
    // Ring 0 is the center core (r ≈ 0). Subsequent rings expand radially.
    const isCore = ring === 0;
    const flowersInRing = isCore ? 6 : config.baseFlowersPerRing;
    const angleStep = (Math.PI * 2) / flowersInRing;

    // Sub-linear radial distribution: concentrates density in center and mid-space
    const ringRadiusRatio = isCore ? 0.05 : Math.pow(ring / (numRings - 1), 0.72);
    // Angular phase staggering between adjacent rings creates gapless shingling
    const ringPhase = ring * 0.42 + (ring % 2 === 1 ? angleStep * 0.5 : 0);

    for (let f = 0; f < flowersInRing; f++) {
      const baseAngle = f * angleStep + ringPhase;

      // Subtle organic jitter on angle and radius
      const angularJitter = ((Math.sin(particleId * 17.3) + 1) / 2 - 0.5) * 0.12;
      const angle = baseAngle + angularJitter;

      // Core flowers overlap tightly around origin (r <= 50px); outer flowers expand
      const radiusOffset = isCore
        ? ((Math.cos(particleId * 11.3) + 1) / 2) * 35.0
        : ((Math.sin(particleId * 19.7) + 1) / 2 - 0.5) * 28.0;

      // Subtle z-depth offset for natural overlapping without z-fighting
      const depthOffset = ring * 12.0 + ((Math.sin(particleId * 31.1) + 1) / 2 - 0.5) * 20.0;

      // Natural blossom size: large enough to overlap and completely blanket space
      // Core blossoms: ~150px-180px; outer blossoms: ~170px-220px
      const scaleFactor = (isCore ? 0.95 : 1.0) + ((Math.sin(particleId * 23.3) + 1) / 2) * 0.35;
      const baseRadius = 100.0 * scaleFactor;

      // Balanced variety distribution across all 16 watercolor assets
      const varietyIndex = (particleId * 7 + ring * 3) % varietyCount;

      // Orientation & slow drift
      const initialRotation = (particleId * 53.7) % (Math.PI * 2);
      const rotationSpeed = ((Math.sin(particleId * 9.1) + 1) / 2 - 0.5) * 0.16;

      // Floating breathing pulse
      const wobbleSpeed = 0.9 + ((Math.sin(particleId * 13.7) + 1) / 2) * 0.6;
      const wobbleOffset = particleId * 0.4;

      // Cascading fall physics parameters (Stage 4)
      // Slight vertical staggering: flowers at the top fall slightly earlier
      const staggerBias = (Math.sin(angle) * 0.5 + 0.5) * 0.12;
      const fallDelay = clamp(((Math.sin(particleId * 41.9) + 1) / 2) * 0.22 + staggerBias, 0, 0.35);
      const fallSpeedMult = 0.85 + ((Math.cos(particleId * 37.1) + 1) / 2) * 0.45;
      const swayAmp = 20.0 + ((Math.sin(particleId * 29.3) + 1) / 2) * 30.0;
      const swayFreq = 1.8 + ((Math.cos(particleId * 17.9) + 1) / 2) * 1.6;
      const fallRotationSpeed = ((particleId % 2 === 0 ? 1 : -1) * (0.8 + ((Math.sin(particleId * 7.7) + 1) / 2) * 1.2));

      particles.push({
        id: particleId++,
        x: 0,
        y: 0,
        z: depthOffset,
        baseRadius,
        rotation: initialRotation,
        rotationSpeed,
        wobbleSpeed,
        wobbleOffset,
        varietyIndex,
        ringIndex: ring,
        baseAngle: angle,
        radiusRatio: ringRadiusRatio,
        radiusOffset,
        depthOffset,
        scaleFactor,
        alpha: 1,
        active: false,
        fallDelay,
        fallSpeedMult,
        swayAmp,
        swayFreq,
        fallRotationSpeed,
      });
    }
  }

  return particles;
}

export interface ProjectedFlower {
  particle: FlowerParticle;
  screenX: number;
  screenY: number;
  renderRadius: number;
  alpha: number;
  rotation: number;
  depthZ: number;
}

/**
 * Computes the 2D position, swirling vortex rotation, viewport expansion,
 * and gravity-driven cascading downward fall for every blossom.
 */
export function projectTunnelParticles(
  particles: FlowerParticle[],
  timelineState: SequenceTimelineState,
  width: number,
  height: number,
  config: TunnelConfig = DEFAULT_TUNNEL_CONFIG,
  timeSec: number = 0
): ProjectedFlower[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const projected: ProjectedFlower[] = [];

  // Corner distance: ensures flowers reach beyond all 4 corners of the screen
  const maxCornerDist = Math.sqrt(centerX * centerX + centerY * centerY) * 1.15;

  // Progressive ring activation during initial bloom
  const maxActiveRing = Math.floor(timelineState.activeFlowerRatio * config.ringCount);

  // Overall scale of the floral galaxy from center outward
  const bloomGrowth = timelineState.flowerClusterProgress;
  // Coverage multiplier: expands from cluster to full corner-to-corner saturation
  const coverageMult = 0.35 + timelineState.coverageProgress * 0.85;

  // Continuous swirling rotation angle (smooth coordinated vortex)
  const masterSwirl = timelineState.swirlProgress * Math.PI * 2;

  // Fall progress (Stage 4)
  const fallProgress = timelineState.fallProgress;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    if (p.ringIndex > maxActiveRing && fallProgress <= 0) continue;

    const ringRevealFactor = clamp(
      timelineState.activeFlowerRatio * config.ringCount - p.ringIndex,
      0,
      1
    );

    // 1. Swirling Circular Motion
    // Inner rings have slightly higher angular velocity for organic vortex shear
    const differentialSpeed = 1.0 + 0.35 * (1.0 - p.radiusRatio);
    const swirlAngle = p.baseAngle + masterSwirl * differentialSpeed + timeSec * 0.15;

    // Radial distance: expands from center (r=0) outward to beyond screen corners
    const currentRadius = (p.radiusRatio * maxCornerDist + p.radiusOffset) * bloomGrowth * coverageMult;

    // Undisturbed orbital position on screen
    const orbitX = centerX + Math.cos(swirlAngle) * currentRadius;
    const orbitY = centerY + Math.sin(swirlAngle) * currentRadius;

    // 2. Cascading Downward Fall (Stage 4)
    let screenX = orbitX;
    let screenY = orbitY;
    let fallRotationOffset = 0;

    if (fallProgress > 0) {
      // Individual staggered activation
      const localFallT = clamp((fallProgress - p.fallDelay) / (1.0 - p.fallDelay), 0, 1);

      if (localFallT > 0) {
        // Natural gravity acceleration: y = 0.5 * g * t^2 + v0 * t
        // Total fall distance drops each flower completely past screen bottom (height + 250px)
        const fallDist = (height * 1.45 + 300) * (localFallT * localFallT * 0.85 + localFallT * 0.15) * p.fallSpeedMult;
        screenY += fallDist;

        // Aerodynamic horizontal flutter / sway
        const sway = Math.sin(localFallT * Math.PI * 4 * p.swayFreq + p.id) * p.swayAmp * (1.0 - localFallT * 0.3);
        screenX += sway;

        // Rotational tumble during descent
        fallRotationOffset = localFallT * p.fallRotationSpeed * Math.PI * 2;
      }
    }

    // Skip flowers that have fallen completely off the bottom of the screen
    if (screenY - p.baseRadius > height + 100) continue;

    // Gentle organic breathing pulse
    const wobble = 1 + 0.03 * Math.sin(timeSec * p.wobbleSpeed + p.wobbleOffset);
    const renderRadius = p.baseRadius * wobble;

    // Alpha calculation: solid opaque during coverage and hold, soft entry during initial bloom
    const alpha = ringRevealFactor;

    if (alpha <= 0.01) continue;

    // Natural orientation + spin + fall tumble
    const rotation = p.rotation + timeSec * p.rotationSpeed + fallRotationOffset;

    projected.push({
      particle: p,
      screenX,
      screenY,
      renderRadius,
      alpha,
      rotation,
      depthZ: p.depthOffset,
    });
  }

  // Painter's algorithm: sort ascending by depth so foreground blossoms render over background
  projected.sort((a, b) => a.depthZ - b.depthZ);

  return projected;
}
