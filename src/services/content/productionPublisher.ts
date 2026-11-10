/**
 * BUTTERFLY — Production Content Publishing Service
 * Handles:
 * 1. Gathering active schema (spreads, text, markers, proposal, celebration)
 * 2. Extracting binary blobs from IndexedDB (media_files + audio_tracks)
 * 3. Validation & reference checking (detecting missing media/audio)
 * 4. Exporting standalone production ZIP package
 * 5. 1-Click Publishing directly to project repository via Vite local endpoint
 */

import type { ButterflyContent, AudioTrack } from './types';
import { loadSavedContent } from './contentStorage';
import { openMediaDB } from './indexedDB';
import { openAudioDB } from '../audio/audioDB';
import { createZipBlob, type ZipFileInput } from '../../utils/zipWriter';

export interface ValidationIssue {
  type: 'warning' | 'error';
  field: string;
  message: string;
}

export interface PublishResult {
  success: boolean;
  timestamp: number;
  backupPath?: string;
  mediaCount: number;
  audioCount: number;
  warnings: ValidationIssue[];
  error?: string;
}

interface StoredMediaRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  isGif: boolean;
  blob: Blob;
  createdAt: number;
}

interface StoredAudioRecord extends AudioTrack {
  blob: Blob;
}

/**
 * Validates references within ButterflyContent against available media & audio records
 */
export function validateContentReferences(
  content: ButterflyContent,
  availableMediaIds: Set<string>,
  availableTrackIds: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  content.spreads.forEach((spread, sIdx) => {
    // Check photos
    spread.leftPage.photos.forEach((photo, pIdx) => {
      if (photo.mediaId && !availableMediaIds.has(photo.mediaId) && !photo.customUrl) {
        issues.push({
          type: 'warning',
          field: `Spread ${sIdx + 1} Photo ${pIdx + 1} (${photo.title || 'Untitled'})`,
          message: `References mediaId "${photo.mediaId}" which was not found in media library.`,
        });
      }
    });

    // Check stickers
    spread.leftPage.stickers.forEach((st, stIdx) => {
      if (st.mediaId && !availableMediaIds.has(st.mediaId) && !st.customUrl) {
        issues.push({
          type: 'warning',
          field: `Spread ${sIdx + 1} Left Sticker ${stIdx + 1} (${st.label || st.id})`,
          message: `References mediaId "${st.mediaId}" which was not found in media library.`,
        });
      }
    });

    spread.rightPage.stickers.forEach((st, stIdx) => {
      if (st.mediaId && !availableMediaIds.has(st.mediaId) && !st.customUrl) {
        issues.push({
          type: 'warning',
          field: `Spread ${sIdx + 1} Right Sticker ${stIdx + 1} (${st.label || st.id})`,
          message: `References mediaId "${st.mediaId}" which was not found in media library.`,
        });
      }
    });

    // Check music markers
    if (spread.rightPage.musicMarkers) {
      Object.entries(spread.rightPage.musicMarkers).forEach(([mKey, marker]) => {
        if (marker.trackId && !availableTrackIds.has(marker.trackId)) {
          issues.push({
            type: 'warning',
            field: `Spread ${sIdx + 1} Music Marker (${marker.title || mKey})`,
            message: `References audio trackId "${marker.trackId}" which was not found in audio library.`,
          });
        }
      });
    }
  });

  // Check celebration GIF if configured with mediaId
  if (
    content.finalQuestion.celebrationGifMediaId &&
    !availableMediaIds.has(content.finalQuestion.celebrationGifMediaId) &&
    !content.finalQuestion.celebrationGifUrl
  ) {
    issues.push({
      type: 'warning',
      field: 'Celebration GIF',
      message: `References celebrationGifMediaId "${content.finalQuestion.celebrationGifMediaId}" which was not found.`,
    });
  }

  return issues;
}

/**
 * Reads all media records from IndexedDB
 */
async function getAllStoredMedia(): Promise<StoredMediaRecord[]> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction('media_files', 'readonly');
      const store = tx.objectStore('media_files');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredMediaRecord[]) || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Reads all audio records from IndexedDB
 */
async function getAllStoredAudio(): Promise<StoredAudioRecord[]> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction('audio_tracks', 'readonly');
      const store = tx.objectStore('audio_tracks');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredAudioRecord[]) || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

function sanitizeFileName(name: string, fallback: string): string {
  const clean = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean.length > 0 ? clean : fallback;
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Prepares a production package with mapped media and audio files
 */
export async function prepareProductionPackage(contentInput?: ButterflyContent) {
  const content = contentInput || loadSavedContent();
  const mediaRecords = await getAllStoredMedia();
  const audioRecords = await getAllStoredAudio();

  const mediaIdSet = new Set(mediaRecords.map((m) => m.id));
  const audioIdSet = new Set(audioRecords.map((a) => a.id));

  // Add built-in samples to sets so they are not flagged as missing
  audioIdSet.add('sample_our_evening');
  audioIdSet.add('m_whispering_garden');
  audioIdSet.add('track_remo_first_sight');

  const warnings = validateContentReferences(content, mediaIdSet, audioIdSet);

  // Map media files: id -> relative file path
  const mediaFileMap: Record<string, { fileName: string; record: StoredMediaRecord }> = {};
  mediaRecords.forEach((rec) => {
    const ext = rec.isGif ? '.gif' : rec.name.includes('.') ? '' : '.png';
    const safeName = sanitizeFileName(`${rec.id}_${rec.name}${ext}`, `${rec.id}.png`);
    mediaFileMap[rec.id] = { fileName: safeName, record: rec };
  });

  // Map audio files: id -> relative file path
  const audioFileMap: Record<string, { fileName: string; record: StoredAudioRecord }> = {};
  audioRecords.forEach((rec) => {
    const ext = rec.fileName.includes('.') ? '' : '.mp3';
    const safeName = sanitizeFileName(`${rec.id}_${rec.fileName}${ext}`, `${rec.id}.mp3`);
    audioFileMap[rec.id] = { fileName: safeName, record: rec };
  });

  // Create a clean production clone of content with updated asset URLs
  const productionContent: ButterflyContent = JSON.parse(JSON.stringify(content));

  productionContent.spreads.forEach((spread) => {
    spread.leftPage.photos.forEach((photo) => {
      if (photo.mediaId && mediaFileMap[photo.mediaId]) {
        photo.customUrl = `/media/${mediaFileMap[photo.mediaId].fileName}`;
      }
    });

    spread.leftPage.stickers.forEach((st) => {
      if (st.mediaId && mediaFileMap[st.mediaId]) {
        st.customUrl = `/media/${mediaFileMap[st.mediaId].fileName}`;
      }
    });

    spread.rightPage.stickers.forEach((st) => {
      if (st.mediaId && mediaFileMap[st.mediaId]) {
        st.customUrl = `/media/${mediaFileMap[st.mediaId].fileName}`;
      }
    });
  });

  // Map celebration GIF if selected from media library
  if (
    productionContent.finalQuestion.celebrationGifMediaId &&
    mediaFileMap[productionContent.finalQuestion.celebrationGifMediaId]
  ) {
    productionContent.finalQuestion.celebrationGifUrl = `/media/${
      mediaFileMap[productionContent.finalQuestion.celebrationGifMediaId].fileName
    }`;
  }

  // Update mediaAssets list
  productionContent.mediaAssets = mediaRecords.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    size: m.size,
    isGif: m.isGif,
    createdAt: m.createdAt,
    customUrl: `/media/${mediaFileMap[m.id]?.fileName || `${m.id}.png`}`,
  }));

  // Update audioTracks list
  const existingTracks = productionContent.audioTracks || [];
  const trackMap = new Map(existingTracks.map((t) => [t.id, t]));

  audioRecords.forEach((a) => {
    const mappedFileName = audioFileMap[a.id]?.fileName || `${a.id}.mp3`;
    trackMap.set(a.id, {
      id: a.id,
      name: a.name,
      fileName: mappedFileName,
      type: a.type,
      size: a.size,
      duration: a.duration,
      createdAt: a.createdAt,
    });
  });

  productionContent.audioTracks = Array.from(trackMap.values());
  productionContent.lastSaved = Date.now();

  return {
    productionContent,
    mediaRecords,
    audioRecords,
    mediaFileMap,
    audioFileMap,
    warnings,
  };
}

/**
 * Generates and downloads a complete standalone production ZIP archive
 */
export async function exportProductionZipPackage(contentInput?: ButterflyContent): Promise<{
  warnings: ValidationIssue[];
  mediaCount: number;
  audioCount: number;
}> {
  const prep = await prepareProductionPackage(contentInput);
  const zipFiles: ZipFileInput[] = [];

  // 1. Content JSON
  const contentJson = JSON.stringify(prep.productionContent, null, 2);
  zipFiles.push({
    name: 'production_content.json',
    data: contentJson,
  });

  // 2. Manifest JSON
  const manifest = {
    packageName: 'BUTTERFLY Production Content Package',
    version: prep.productionContent.version,
    exportedAt: new Date().toISOString(),
    mediaCount: prep.mediaRecords.length,
    audioCount: prep.audioRecords.length,
    warnings: prep.warnings,
    mediaFiles: Object.entries(prep.mediaFileMap).map(([id, info]) => ({
      id,
      path: `media/${info.fileName}`,
      type: info.record.type,
      size: info.record.size,
    })),
    audioFiles: Object.entries(prep.audioFileMap).map(([id, info]) => ({
      id,
      path: `audio/${info.fileName}`,
      duration: info.record.duration,
      size: info.record.size,
    })),
  };

  zipFiles.push({
    name: 'manifest.json',
    data: JSON.stringify(manifest, null, 2),
  });

  // 3. Instructions README
  const readme = `BUTTERFLY Production Package
=============================
Exported: ${manifest.exportedAt}

CONTENTS:
- production_content.json: Full scrapbook schema, typography, audio markers, proposal & celebration.
- manifest.json: Asset registry and validation report.
- media/: ${prep.mediaRecords.length} images, stickers, polaroid memories, and animated GIFs.
- audio/: ${prep.audioRecords.length} uploaded music tracks.

TO PUBLISH TO GITHUB PAGES:
1. Extract the contents of this ZIP file.
2. Copy all files inside 'media/' into your project's 'public/media/' directory.
3. Copy all files inside 'audio/' into your project's 'public/audio/' directory.
4. Run:
     npm run publish:package <path/to/this/production_content.json>
   Or simply use the 1-click 'Publish to Project' button directly inside your local Studio Admin!
5. Test locally:
     npm run build
     npm run preview
6. Commit and deploy:
     git add .
     git commit -m "Publish updated scrapbook content and music"
     git push origin main
`;

  zipFiles.push({
    name: 'README.txt',
    data: readme,
  });

  // 4. Add Media Blobs
  for (const info of Object.values(prep.mediaFileMap)) {
    const bytes = await blobToUint8Array(info.record.blob);
    zipFiles.push({
      name: `media/${info.fileName}`,
      data: bytes,
    });
  }

  // 5. Add Audio Blobs
  for (const info of Object.values(prep.audioFileMap)) {
    const bytes = await blobToUint8Array(info.record.blob);
    zipFiles.push({
      name: `audio/${info.fileName}`,
      data: bytes,
    });
  }

  // Create ZIP Blob and trigger download
  const zipBlob = createZipBlob(zipFiles);
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `butterfly_production_package_${dateStr}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  return {
    warnings: prep.warnings,
    mediaCount: prep.mediaRecords.length,
    audioCount: prep.audioRecords.length,
  };
}

/**
 * 1-Click Publishing directly to the local project via Vite Dev Server API
 */
export async function publishDirectlyToProject(contentInput?: ButterflyContent): Promise<PublishResult> {
  const prep = await prepareProductionPackage(contentInput);

  // Encode media records as Data URLs for POST payload
  const mediaPayload: Record<string, { fileName: string; dataUrl: string; type: string }> = {};
  for (const [id, info] of Object.entries(prep.mediaFileMap)) {
    const dataUrl = await blobToDataUrl(info.record.blob);
    mediaPayload[id] = {
      fileName: info.fileName,
      dataUrl,
      type: info.record.type,
    };
  }

  // Encode audio records as Data URLs
  const audioPayload: Record<string, { fileName: string; dataUrl: string; type: string }> = {};
  for (const [id, info] of Object.entries(prep.audioFileMap)) {
    const dataUrl = await blobToDataUrl(info.record.blob);
    audioPayload[id] = {
      fileName: info.fileName,
      dataUrl,
      type: info.record.type,
    };
  }

  const payload = {
    content: prep.productionContent,
    media: mediaPayload,
    audio: audioPayload,
    warnings: prep.warnings,
  };

  const response = await fetch('/api/publish-to-project', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Server returned ${response.status}: ${errText || response.statusText}`);
  }

  const data = await response.json();

  return {
    success: true,
    timestamp: Date.now(),
    backupPath: data.backupPath,
    mediaCount: prep.mediaRecords.length,
    audioCount: prep.audioRecords.length,
    warnings: prep.warnings,
  };
}
