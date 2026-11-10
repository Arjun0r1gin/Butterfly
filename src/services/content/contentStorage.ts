/**
 * BUTTERFLY — Content Storage & Persistence Service
 * Orchestrates localStorage schema storage, draft auto-save, export/import packages, and IndexedDB sync.
 */

import type { ButterflyContent } from './types';
import { DEFAULT_BUTTERFLY_CONTENT } from './defaultContent';
import {
  exportAllMediaAsDataUrls,
  importMediaFromDataUrls,
  getAllMediaAssets,
} from './indexedDB';

export const CONTENT_STORAGE_KEY = 'butterfly_content_v1';
export const DRAFT_STORAGE_KEY = 'butterfly_content_draft_v1';

export interface ContentPackage {
  format: 'butterfly_content_package_v1';
  exportedAt: number;
  schema: ButterflyContent;
  media: Record<string, string>; // mediaId -> Base64 data URL
}

/**
 * Loads the active content from localStorage, or returns canonical defaults
 */
export function loadSavedContent(): ButterflyContent {
  if (typeof window === 'undefined') return DEFAULT_BUTTERFLY_CONTENT;

  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (!raw) return DEFAULT_BUTTERFLY_CONTENT;
    const parsed = JSON.parse(raw) as ButterflyContent;
    return sanitizeContent(parsed);
  } catch (err) {
    console.warn('[ContentStorage] Failed to parse saved content, falling back to default', err);
    return DEFAULT_BUTTERFLY_CONTENT;
  }
}

/**
 * Saves active content to localStorage with timestamp
 */
export function saveContent(content: ButterflyContent): ButterflyContent {
  if (typeof window === 'undefined') return content;

  const toSave: ButterflyContent = {
    ...content,
    lastSaved: Date.now(),
  };

  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(toSave));
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    // Dispatch custom event for cross-component and visitor synchronization
    window.dispatchEvent(new CustomEvent('butterfly_content_updated', { detail: toSave }));
  } catch (err) {
    console.error('[ContentStorage] Failed to save content to localStorage', err);
  }

  return toSave;
}

/**
 * Loads draft content if present
 */
export function loadDraftContent(): ButterflyContent | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeContent(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Saves draft content
 */
export function saveDraftContent(content: ButterflyContent): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(content));
  } catch (err) {
    console.warn('[ContentStorage] Failed to autosave draft', err);
  }
}

/**
 * Clears draft content
 */
export function clearDraftContent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

/**
 * Resets content to canonical project defaults
 */
export function resetToDefaultContent(): ButterflyContent {
  return saveContent(DEFAULT_BUTTERFLY_CONTENT);
}

/**
 * Exports complete package (schema + all media as data URLs)
 */
export async function exportContentPackage(content: ButterflyContent): Promise<string> {
  const mediaDict = await exportAllMediaAsDataUrls();
  const pkg: ContentPackage = {
    format: 'butterfly_content_package_v1',
    exportedAt: Date.now(),
    schema: content,
    media: mediaDict,
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Imports complete package, restoring media to IndexedDB and schema to localStorage
 */
export async function importContentPackage(jsonString: string): Promise<ButterflyContent> {
  const parsed = JSON.parse(jsonString) as Partial<ContentPackage>;

  if (parsed.format !== 'butterfly_content_package_v1' || !parsed.schema) {
    throw new Error('Invalid BUTTERFLY content package format');
  }

  // Restore media to IndexedDB
  if (parsed.media && parsed.schema.mediaAssets) {
    await importMediaFromDataUrls(parsed.media, parsed.schema.mediaAssets);
  }

  // Query updated media assets from IndexedDB
  const updatedAssets = await getAllMediaAssets();
  const restoredContent: ButterflyContent = {
    ...sanitizeContent(parsed.schema),
    mediaAssets: updatedAssets,
    lastSaved: Date.now(),
  };

  return saveContent(restoredContent);
}

/**
 * Ensures required arrays and properties exist on loaded content
 */
function sanitizeContent(raw: Partial<ButterflyContent>): ButterflyContent {
  const isV3 = (raw.version || 0) >= 3;
  const isOldQuestion =
    !raw.finalQuestion ||
    raw.finalQuestion.chapterHeader === 'CHAPTER IV: BEYOND THE HORIZON' ||
    (raw.version || 0) < 5;
  const finalQuestion = isOldQuestion
    ? DEFAULT_BUTTERFLY_CONTENT.finalQuestion
    : { ...raw.finalQuestion!, stickers: [] };

  const rawSpreads =
    isV3 && Array.isArray(raw.spreads) && raw.spreads.length > 0
      ? raw.spreads
      : DEFAULT_BUTTERFLY_CONTENT.spreads;

  // Filter out any flower stickers from the right-hand narrative pages
  const cleanSpreads = rawSpreads.map((sp) => ({
    ...sp,
    rightPage: {
      ...sp.rightPage,
      stickers: (sp.rightPage.stickers || []).filter((st) => {
        const isFlower =
          st.type === 'flower' ||
          st.type === 'botanical' ||
          (st.customUrl &&
            (st.customUrl.includes('flower') ||
              st.customUrl.includes('sprig') ||
              st.customUrl.includes('blossom') ||
              st.customUrl.includes('stamp_pink') ||
              st.customUrl.includes('stamp_vintage_rose') ||
              st.customUrl.includes('washi_pink_floral'))) ||
          (st.label &&
            (st.label.toLowerCase().includes('flower') ||
              st.label.toLowerCase().includes('sprig') ||
              st.label.toLowerCase().includes('blossom') ||
              st.label.toLowerCase().includes('rose')));
        return !isFlower;
      }),
    },
  }));

  return {
    version: 6,
    lastSaved: raw.lastSaved || Date.now(),
    spreads: cleanSpreads,
    finalQuestion,
    mediaAssets: Array.isArray(raw.mediaAssets) ? raw.mediaAssets : [],
    audioTracks: Array.isArray(raw.audioTracks) ? raw.audioTracks : DEFAULT_BUTTERFLY_CONTENT.audioTracks,
  };
}

