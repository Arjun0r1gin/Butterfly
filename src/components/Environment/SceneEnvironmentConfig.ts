/**
 * BUTTERFLY — Scene Environment Configuration & Smooth Interpolator
 * Provides scene-specific environmental configurations with Hermite smoothstep
 * blending between Scene 1 (Meadow), Scene 2 (Pergola), and Scene 3 (Rocket).
 */

import type { SceneConfig } from './types';

export const SCENE_1_CONFIG: SceneConfig = {
  cloudDensity: 0.85,
  cloudSpeed: 18,
  cloudTint: [255, 175, 110], // Warm golden sunset peach
  cloudOpacity: 0.42,
  particleDensity: 1.0,
  particleTypes: {
    dust: true,
    pollen: true,
    fireflies: false,
  },
  windStrength: 0.65, // Gentle open meadow breeze
  windGustiness: 0.55,
  vegetationDensity: 1.0, // Lush meadow flora along floor
  atmosphereWarmth: 0.38,
  lightRayIntensity: 0.30,
};

export const SCENE_2_CONFIG: SceneConfig = {
  cloudDensity: 0.78,
  cloudSpeed: 14,
  cloudTint: [248, 160, 125], // Rose-amber sunset glow
  cloudOpacity: 0.38,
  particleDensity: 0.90,
  particleTypes: {
    dust: true,
    pollen: true,
    fireflies: true, // Golden motes around pergola
  },
  windStrength: 0.45, // Calmer sheltered garden air around memory book
  windGustiness: 0.35,
  vegetationDensity: 0.85,
  atmosphereWarmth: 0.42,
  lightRayIntensity: 0.22,
};

export const SCENE_3_CONFIG: SceneConfig = {
  cloudDensity: 0.70,
  cloudSpeed: 16,
  cloudTint: [230, 130, 95], // Deep amber & twilight indigo sky
  cloudOpacity: 0.35,
  particleDensity: 0.95,
  particleTypes: {
    dust: true,
    pollen: false,
    fireflies: true, // Restrained fireflies around rocket garden
  },
  windStrength: 0.52, // Evening terrace breeze
  windGustiness: 0.40,
  vegetationDensity: 0.80,
  atmosphereWarmth: 0.35,
  lightRayIntensity: 0.25,
};

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0.0, Math.min(1.0, (x - e0) / (e1 - e0)));
  return t * t * (3.0 - 2.0 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

/**
 * Returns a smoothly blended configuration based on the continuous camera journey progress p in [0.0, 1.0].
 * Ensures position, density, wind, and colors transition seamlessly with C1 continuity.
 */
export function getBlendedEnvironmentConfig(p: number): SceneConfig {
  const clampedP = Math.max(0, Math.min(1, p));

  // Transition from Scene 1 to Scene 2 happens across p in [0.25, 0.45]
  // Transition from Scene 2 to Scene 3 happens across p in [0.62, 0.82]
  if (clampedP <= 0.25) {
    return SCENE_1_CONFIG;
  } else if (clampedP < 0.45) {
    const t = smoothstep(0.25, 0.45, clampedP);
    return {
      cloudDensity: lerp(SCENE_1_CONFIG.cloudDensity, SCENE_2_CONFIG.cloudDensity, t),
      cloudSpeed: lerp(SCENE_1_CONFIG.cloudSpeed, SCENE_2_CONFIG.cloudSpeed, t),
      cloudTint: lerpColor(SCENE_1_CONFIG.cloudTint, SCENE_2_CONFIG.cloudTint, t),
      cloudOpacity: lerp(SCENE_1_CONFIG.cloudOpacity, SCENE_2_CONFIG.cloudOpacity, t),
      particleDensity: lerp(SCENE_1_CONFIG.particleDensity, SCENE_2_CONFIG.particleDensity, t),
      particleTypes: {
        dust: true,
        pollen: t < 0.7,
        fireflies: t > 0.3,
      },
      windStrength: lerp(SCENE_1_CONFIG.windStrength, SCENE_2_CONFIG.windStrength, t),
      windGustiness: lerp(SCENE_1_CONFIG.windGustiness, SCENE_2_CONFIG.windGustiness, t),
      vegetationDensity: lerp(SCENE_1_CONFIG.vegetationDensity, SCENE_2_CONFIG.vegetationDensity, t),
      atmosphereWarmth: lerp(SCENE_1_CONFIG.atmosphereWarmth, SCENE_2_CONFIG.atmosphereWarmth, t),
      lightRayIntensity: lerp(SCENE_1_CONFIG.lightRayIntensity, SCENE_2_CONFIG.lightRayIntensity, t),
    };
  } else if (clampedP <= 0.62) {
    return SCENE_2_CONFIG;
  } else if (clampedP < 0.82) {
    const t = smoothstep(0.62, 0.82, clampedP);
    return {
      cloudDensity: lerp(SCENE_2_CONFIG.cloudDensity, SCENE_3_CONFIG.cloudDensity, t),
      cloudSpeed: lerp(SCENE_2_CONFIG.cloudSpeed, SCENE_3_CONFIG.cloudSpeed, t),
      cloudTint: lerpColor(SCENE_2_CONFIG.cloudTint, SCENE_3_CONFIG.cloudTint, t),
      cloudOpacity: lerp(SCENE_2_CONFIG.cloudOpacity, SCENE_3_CONFIG.cloudOpacity, t),
      particleDensity: lerp(SCENE_2_CONFIG.particleDensity, SCENE_3_CONFIG.particleDensity, t),
      particleTypes: {
        dust: true,
        pollen: false,
        fireflies: true,
      },
      windStrength: lerp(SCENE_2_CONFIG.windStrength, SCENE_3_CONFIG.windStrength, t),
      windGustiness: lerp(SCENE_2_CONFIG.windGustiness, SCENE_3_CONFIG.windGustiness, t),
      vegetationDensity: lerp(SCENE_2_CONFIG.vegetationDensity, SCENE_3_CONFIG.vegetationDensity, t),
      atmosphereWarmth: lerp(SCENE_2_CONFIG.atmosphereWarmth, SCENE_3_CONFIG.atmosphereWarmth, t),
      lightRayIntensity: lerp(SCENE_2_CONFIG.lightRayIntensity, SCENE_3_CONFIG.lightRayIntensity, t),
    };
  } else {
    return SCENE_3_CONFIG;
  }
}

