/**
 * BUTTERFLY — Content Schema & Data Contracts
 * Centralized schema for scrapbook spreads, page text, stickers, media assets, and the final proposal question.
 */

export type StickerType = 'image' | 'gif' | 'flower' | 'stamp' | 'heart' | 'botanical' | 'seal';

export interface StickerTransform {
  x: number;          // Percentage (0 - 100) relative to page or canvas
  y: number;          // Percentage (0 - 100) relative to page or canvas
  width: number;      // Width in px
  height: number;     // Height in px
  rotationDeg: number;// Rotation in degrees (-180 to 180)
  zIndex: number;     // Layering stack order
}

export interface StickerItem extends StickerTransform {
  id: string;
  type: StickerType;
  label?: string;
  mediaId?: string;   // Reference to MediaAsset in IndexedDB
  customUrl?: string; // Fallback data URL or local asset path
}

export interface PhotoMemory {
  id: string;
  title: string;
  date?: string;
  rotationDeg: number;
  tapeStyle: 'washi-pink' | 'washi-gold' | 'corner-tabs';
  bgGradient: string;
  doodle?: string;
  mediaId?: string;
  customUrl?: string;
}

export interface PageLeftContent {
  photos: PhotoMemory[];
  stickers: StickerItem[];
  handwrittenNotes: string[];
}

export interface PageTypography {
  fontFamily?: string;       // 'Caveat', 'Patrick Hand', 'Kalam', 'Dancing Script', 'Playfair Display'
  fontSize?: number;         // 20 - 52 (default: 34 for canvas)
  color?: string;            // default: '#17120F'
  lineHeight?: number;       // 1.2 - 2.2 (default: 1.55)
  paragraphSpacing?: number; // 10 - 50 (default: 28)
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

export interface PageRightContent {
  chapterNumber: string;
  chapterTitle: string;
  dateOrLocation?: string;
  decorativeInitial: string;
  storyParagraphs: string[];
  signature?: string;
  stickers: StickerItem[];
  typography?: PageTypography;
  musicMarkers?: Record<string, MusicMarker>;
}

export interface StorySpreadContent {
  id: string;
  spreadIndex: number;
  title: string;
  leftPage: PageLeftContent;
  rightPage: PageRightContent;
}

export interface FinalQuestionContent {
  chapterHeader: string;
  questionTitleMain: string;
  questionTitleHighlight: string;
  questionSubtitle: string;
  stickers: StickerItem[];
}

export interface MediaAsset {
  id: string;
  name: string;
  type: string;        // MIME type: image/png, image/jpeg, image/webp, image/gif
  size: number;        // Bytes
  isGif: boolean;
  createdAt: number;
  dataUrl?: string;    // Base64 data URL for export/preview
}

export interface AudioTrack {
  id: string;
  name: string;        // Track display name
  fileName: string;    // Original file name
  type: string;        // MIME type
  size: number;        // Bytes
  duration: number;    // Seconds
  createdAt: number;
}

export interface ButterflyContent {
  version: number;
  lastSaved: number;
  spreads: StorySpreadContent[];
  finalQuestion: FinalQuestionContent;
  mediaAssets: MediaAsset[];
  audioTracks?: AudioTrack[];
}

