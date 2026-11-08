/**
 * BUTTERFLY — Storybook Scene Types & Data Contracts
 */

export interface PhotoMemory {
  id: string;
  title: string;
  date?: string;
  rotationDeg: number;
  tapeStyle: 'washi-pink' | 'washi-gold' | 'corner-tabs';
  bgGradient: string;
  doodle?: string;
}

export interface StickerItem {
  id: string;
  type: 'flower' | 'stamp' | 'heart' | 'botanical' | 'seal';
  label?: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  rotationDeg: number;
}

export interface StoryPageLeft {
  photos: PhotoMemory[];
  stickers: StickerItem[];
  handwrittenNotes: string[];
}

export interface StoryPageRight {
  chapterNumber: string;
  chapterTitle: string;
  dateOrLocation?: string;
  decorativeInitial: string;
  storyParagraphs: string[];
  signature?: string;
}

export interface StorySpread {
  id: string;
  spreadIndex: number;
  leftPage: StoryPageLeft;
  rightPage: StoryPageRight;
}

export interface StorybookConfig {
  perspectivePx: number;
  pageCurlStrength: number;
}

