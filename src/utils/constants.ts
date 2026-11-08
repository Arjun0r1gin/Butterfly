/**
 * BUTTERFLY — Application & Architecture Constants
 */

export const SCENE_IDS = {
  FLOWER_TUNNEL: 'flower-tunnel',
  GARDEN: 'garden',
  STORYBOOK: 'storybook',
  FINAL_SCENE: 'final-scene',
} as const;

export type SceneId = (typeof SCENE_IDS)[keyof typeof SCENE_IDS];

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

export const Z_INDEX = {
  deepParallax: -100,
  background: -10,
  sceneBase: 1,
  sceneMid: 10,
  sceneForeground: 20,
  character: 30,
  floatingParticles: 40,
  vignette: 50,
  hud: 100,
  modal: 200,
  toast: 300,
  cursor: 9999,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;

