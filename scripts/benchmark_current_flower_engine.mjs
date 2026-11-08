/**
 * Profiling benchmark for the current Flower Tunnel math & particle engine
 */
import { performance } from 'perf_hooks';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const DEFAULT_TUNNEL_CONFIG = {
  ringCount: 20,
  baseFlowersPerRing: 15,
  tunnelDepth: 3000,
  fov: 650,
  initialRadius: 0,
  maxRadius: 520,
  swirlStrength: 0.35,
};

function initializeTunnelParticles(config = DEFAULT_TUNNEL_CONFIG, varietyCount = 16) {
  const particles = [];
  let particleId = 0;
  const numRings = config.ringCount;

  for (let ring = 0; ring < numRings; ring++) {
    const isCore = ring === 0;
    const flowersInRing = isCore ? 6 : config.baseFlowersPerRing;
    const angleStep = (Math.PI * 2) / flowersInRing;
    const ringRadiusRatio = isCore ? 0.05 : Math.pow(ring / (numRings - 1), 0.72);
    const ringPhase = ring * 0.42 + (ring % 2 === 1 ? angleStep * 0.5 : 0);

    for (let f = 0; f < flowersInRing; f++) {
      const baseAngle = f * angleStep + ringPhase;
      const angularJitter = ((Math.sin(particleId * 17.3) + 1) / 2 - 0.5) * 0.12;
      const angle = baseAngle + angularJitter;
      const radiusOffset = isCore
        ? ((Math.cos(particleId * 11.3) + 1) / 2) * 35.0
        : ((Math.sin(particleId * 19.7) + 1) / 2 - 0.5) * 28.0;
      const depthOffset = ring * 12.0 + ((Math.sin(particleId * 31.1) + 1) / 2 - 0.5) * 20.0;
      const scaleFactor = (isCore ? 0.95 : 1.0) + ((Math.sin(particleId * 23.3) + 1) / 2) * 0.35;
      const baseRadius = 100.0 * scaleFactor;
      const varietyIndex = (particleId * 7 + ring * 3) % varietyCount;
      const initialRotation = (particleId * 53.7) % (Math.PI * 2);
      const rotationSpeed = ((Math.sin(particleId * 9.1) + 1) / 2 - 0.5) * 0.16;
      const wobbleSpeed = 0.9 + ((Math.sin(particleId * 13.7) + 1) / 2) * 0.6;
      const wobbleOffset = particleId * 0.4;
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

function projectTunnelParticlesCurrent(particles, timelineState, width, height, config = DEFAULT_TUNNEL_CONFIG, timeSec = 0) {
  const centerX = width / 2;
  const centerY = height / 2;
  const projected = [];
  const maxCornerDist = Math.sqrt(centerX * centerX + centerY * centerY) * 1.15;
  const maxActiveRing = Math.floor(timelineState.activeFlowerRatio * config.ringCount);
  const bloomGrowth = timelineState.flowerClusterProgress;
  const coverageMult = 0.35 + timelineState.coverageProgress * 0.85;
  const masterSwirl = timelineState.swirlProgress * Math.PI * 2;
  const fallProgress = timelineState.fallProgress;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.ringIndex > maxActiveRing && fallProgress <= 0) continue;

    const ringRevealFactor = clamp(
      timelineState.activeFlowerRatio * config.ringCount - p.ringIndex,
      0,
      1
    );

    const differentialSpeed = 1.0 + 0.35 * (1.0 - p.radiusRatio);
    const swirlAngle = p.baseAngle + masterSwirl * differentialSpeed + timeSec * 0.15;
    const currentRadius = (p.radiusRatio * maxCornerDist + p.radiusOffset) * bloomGrowth * coverageMult;
    const orbitX = centerX + Math.cos(swirlAngle) * currentRadius;
    const orbitY = centerY + Math.sin(swirlAngle) * currentRadius;

    let screenX = orbitX;
    let screenY = orbitY;
    let fallRotationOffset = 0;

    if (fallProgress > 0) {
      const localFallT = clamp((fallProgress - p.fallDelay) / (1.0 - p.fallDelay), 0, 1);
      if (localFallT > 0) {
        const fallDist = (height * 1.45 + 300) * (localFallT * localFallT * 0.85 + localFallT * 0.15) * p.fallSpeedMult;
        screenY += fallDist;
        const sway = Math.sin(localFallT * Math.PI * 4 * p.swayFreq + p.id) * p.swayAmp * (1.0 - localFallT * 0.3);
        screenX += sway;
        fallRotationOffset = localFallT * p.fallRotationSpeed * Math.PI * 2;
      }
    }

    if (screenY - p.baseRadius > height + 100) continue;
    const wobble = 1 + 0.03 * Math.sin(timeSec * p.wobbleSpeed + p.wobbleOffset);
    const renderRadius = p.baseRadius * wobble;
    const alpha = ringRevealFactor;
    if (alpha <= 0.01) continue;

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

  projected.sort((a, b) => a.depthZ - b.depthZ);
  return projected;
}

// Run benchmark across 500 frames of flower-drop sequence (Stage 4)
const particles = initializeTunnelParticles();
console.log(`Total particles initialized: ${particles.length}`);

const frames = 500;
const width = 1920;
const height = 1080;

const state = {
  flowerClusterProgress: 1.0,
  activeFlowerRatio: 1.0,
  coverageProgress: 1.0,
  holdProgress: 1.0,
  fallProgress: 0.5, // Midway through cascading drop
  swirlProgress: 1.6,
  transitionProgress: 0.2,
};

const frameTimes = [];
let totalAllocations = 0;

const tStart = performance.now();
for (let f = 0; f < frames; f++) {
  const elapsed = f * (1 / 60);
  state.fallProgress = Math.min(1.0, f / frames);
  const t0 = performance.now();
  const proj = projectTunnelParticlesCurrent(particles, state, width, height, DEFAULT_TUNNEL_CONFIG, elapsed);
  const t1 = performance.now();
  frameTimes.push(t1 - t0);
  totalAllocations += proj.length + 1; // Array + objects
}
const tTotal = performance.now() - tStart;

frameTimes.sort((a, b) => a - b);
const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
const p95 = frameTimes[Math.floor(frameTimes.length * 0.95)];
const max = frameTimes[frameTimes.length - 1];
const min = frameTimes[0];

console.log("=== CURRENT ENGINE PROFILING RESULTS (Flower Drop) ===");
console.log(`Frames tested: ${frames}`);
console.log(`Total calculation time: ${tTotal.toFixed(2)} ms`);
console.log(`Average calculation per frame: ${avg.toFixed(3)} ms`);
console.log(`95th percentile frame time: ${p95.toFixed(3)} ms`);
console.log(`Max calculation frame time: ${max.toFixed(3)} ms`);
console.log(`Min calculation frame time: ${min.toFixed(3)} ms`);
console.log(`Heap allocations in ${frames} frames: ${totalAllocations} objects (avg ${(totalAllocations / frames).toFixed(1)} objects/frame)`);

