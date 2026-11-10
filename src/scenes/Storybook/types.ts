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
  customUrl?: string;
}

export interface StickerItem {
  id: string;
  type: 'flower' | 'stamp' | 'heart' | 'botanical' | 'seal' | 'image' | 'gif';
  label?: string;
  customUrl?: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width?: number;
  height?: number;
  zIndex?: number;
  rotationDeg: number;
}

export interface StoryPageLeft {
  photos: PhotoMemory[];
  stickers: StickerItem[];
  handwrittenNotes: string[];
}

export interface PageTypography {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  paragraphSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export interface MusicMarker {
  id: string;
  trackId: string;
  title?: string;
  startTime?: number;
  endTime?: number;
  loop?: boolean;
  enabled?: boolean;
  color?: string;
  size?: number;
}

export interface StoryPageRight {
  chapterNumber: string;
  chapterTitle: string;
  dateOrLocation?: string;
  decorativeInitial: string;
  storyParagraphs: string[];
  signature?: string;
  typography?: PageTypography;
  stickers?: StickerItem[];
  musicMarkers?: Record<string, MusicMarker>;
}

export interface StorySpread {
  id: string;
  spreadIndex: number;
  title?: string;
  leftPage: StoryPageLeft;
  rightPage: StoryPageRight;
}

export interface StorybookConfig {
  perspectivePx: number;
  pageCurlStrength: number;
}

