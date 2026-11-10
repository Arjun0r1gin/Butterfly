/**
 * BUTTERFLY — IndexedDB Audio Storage Service
 * Local persistent binary storage for MP3, WAV, and OGG songs.
 * Supports track duration extraction, renaming, deletion, and on-demand object URL streaming.
 */

import { assetUrl } from '../../utils/assets';
import { DEFAULT_BUTTERFLY_CONTENT } from '../content/defaultContent';
import { loadSavedContent } from '../content/contentStorage';

export interface AudioTrack {
  id: string;
  name: string;        // Display name, e.g. "Our Evening ♡"
  fileName: string;    // Original file name, e.g. "our_evening.mp3"
  type: string;        // MIME type, e.g. "audio/mpeg", "audio/wav", "audio/ogg"
  size: number;        // Bytes
  duration: number;    // Seconds
  createdAt: number;   // Timestamp
}

interface StoredAudioRecord extends AudioTrack {
  blob: Blob;
}

const DB_NAME = 'butterfly_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_tracks';

let dbInstance: IDBDatabase | null = null;
const urlCache = new Map<string, string>();

export async function openAudioDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open butterfly_audio_db'));
    };
  });
}

/**
 * Calculates audio duration in seconds from a Blob using HTML5 Audio
 */
export async function getBlobDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(0);
      return;
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanUp = () => {
      URL.revokeObjectURL(url);
    };

    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      cleanUp();
      resolve(isFinite(dur) ? Math.round(dur * 10) / 10 : 0);
    };

    audio.onerror = () => {
      cleanUp();
      resolve(0);
    };

    audio.src = url;
  });
}

export const INITIAL_CONFESSION_TRACKS: AudioTrack[] = [
  {
    id: 'track_remo_first_sight',
    name: 'Remo — First Sight BGM',
    fileName: 'remo_first_sight.mp3',
    type: 'audio/mpeg',
    size: 0,
    duration: 0,
    createdAt: 1731100000000,
  },
  {
    id: 'track_othadayai_padhayile',
    name: 'Othadayai Padhayile',
    fileName: 'othadayai_padhayile.mp3',
    type: 'audio/mpeg',
    size: 0,
    duration: 0,
    createdAt: 1731100001000,
  },
  {
    id: 'track_thalaivar_bgm',
    name: 'Rajinikanth / Thalaivar BGM',
    fileName: 'thalaivar_bgm.mp3',
    type: 'audio/mpeg',
    size: 0,
    duration: 0,
    createdAt: 1731100002000,
  },
];

/**
 * Saves an uploaded audio file/blob to IndexedDB
 */
export async function saveAudioTrack(
  blob: Blob,
  fileName: string,
  customName?: string,
  type?: string
): Promise<AudioTrack> {
  const db = await openAudioDB();
  const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanType = type || blob.type || 'audio/mpeg';
  const duration = await getBlobDuration(blob);
  const name = customName || fileName.replace(/\.[^/.]+$/, '');

  const record: StoredAudioRecord = {
    id,
    name,
    fileName,
    type: cleanType,
    size: blob.size,
    duration,
    createdAt: Date.now(),
    blob,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => {
      // Notify listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('butterfly_audio_library_updated'));
      }
      resolve({
        id,
        name,
        fileName,
        type: cleanType,
        size: blob.size,
        duration,
        createdAt: record.createdAt,
      });
    };

    req.onerror = () => {
      reject(req.error || new Error(`Failed to save audio track ${id}`));
    };
  });
}

/**
 * Replaces or uploads an audio file for an existing track ID
 */
export async function replaceAudioTrack(
  id: string,
  blob: Blob,
  fileName: string,
  customName?: string,
  type?: string
): Promise<AudioTrack> {
  const db = await openAudioDB();
  const cleanType = type || blob.type || 'audio/mpeg';
  const duration = await getBlobDuration(blob);

  // Check if existing record exists to preserve custom name
  const existing = await getAudioTrack(id);
  const name = customName || existing?.name || fileName.replace(/\.[^/.]+$/, '');

  const record: StoredAudioRecord = {
    id,
    name,
    fileName,
    type: cleanType,
    size: blob.size,
    duration,
    createdAt: existing?.createdAt || Date.now(),
    blob,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => {
      if (urlCache.has(id)) {
        URL.revokeObjectURL(urlCache.get(id)!);
        urlCache.delete(id);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('butterfly_audio_library_updated'));
      }
      resolve({
        id,
        name,
        fileName,
        type: cleanType,
        size: blob.size,
        duration,
        createdAt: record.createdAt,
      });
    };

    req.onerror = () => {
      reject(req.error || new Error(`Failed to replace audio track ${id}`));
    };
  });
}

/**
 * Retrieves all saved audio tracks (metadata only)
 */
export async function getAllAudioTracks(): Promise<AudioTrack[]> {
  const sampleTrack: AudioTrack = {
    id: 'sample_our_evening',
    name: 'Our Evening ♡',
    fileName: 'our_evening_melody.mp3',
    type: 'audio/mpeg',
    size: 1587644,
    duration: 18,
    createdAt: 1731070000000,
  };

  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result as StoredAudioRecord[]) || [];
        const metadataList: AudioTrack[] = records.map((r) => ({
          id: r.id,
          name: r.name,
          fileName: r.fileName,
          type: r.type,
          size: r.size,
          duration: r.duration,
          createdAt: r.createdAt,
        }));

        // Include initial configured confession tracks if not yet added by user
        for (const ct of INITIAL_CONFESSION_TRACKS) {
          if (!metadataList.some((t) => t.id === ct.id)) {
            metadataList.push(ct);
          }
        }

        // Include sample track if not overridden
        if (!metadataList.some((t) => t.id === 'sample_our_evening')) {
          metadataList.push(sampleTrack);
        }

        resolve(metadataList);
      };

      req.onerror = () => reject(req.error || new Error('Failed to load audio tracks'));
    });
  } catch (err) {
    console.warn('[audioDB] getAllAudioTracks failed, returning defaults', err);
    return [...INITIAL_CONFESSION_TRACKS, sampleTrack];
  }
}

/**
 * Retrieves a single audio track metadata
 */
export async function getAudioTrack(id: string): Promise<AudioTrack | null> {
  if (id === 'sample_our_evening' || id === 'm_whispering_garden') {
    return {
      id: 'sample_our_evening',
      name: 'Our Evening ♡',
      fileName: 'our_evening_melody.mp3',
      type: 'audio/mpeg',
      size: 1587644,
      duration: 18,
      createdAt: 1731070000000,
    };
  }

  // Check published content static tracks first
  try {
    const savedContent = typeof window !== 'undefined' ? loadSavedContent() : DEFAULT_BUTTERFLY_CONTENT;
    const contentTrack = savedContent.audioTracks?.find((t) => t.id === id);
    if (contentTrack) return contentTrack;
  } catch {
    // fallback
  }

  const initialMatch = INITIAL_CONFESSION_TRACKS.find((t) => t.id === id);

  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const r = req.result as StoredAudioRecord | undefined;
        if (!r) {
          resolve(initialMatch || null);
          return;
        }
        resolve({
          id: r.id,
          name: r.name,
          fileName: r.fileName,
          type: r.type,
          size: r.size,
          duration: r.duration,
          createdAt: r.createdAt,
        });
      };

      req.onerror = () => reject(req.error);
    });
  } catch {
    return initialMatch || null;
  }
}

/**
 * Retrieves the raw Blob for playback
 */
export async function getAudioBlob(id: string): Promise<Blob | null> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
      const r = req.result as StoredAudioRecord | undefined;
      resolve(r ? r.blob : null);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Gets or creates an object URL for an audio track (lazy loading on demand)
 */
export async function getAudioUrl(id: string): Promise<string | null> {
  if (id === 'sample_our_evening' || id === 'm_whispering_garden') {
    return assetUrl('/storybook/assets/our_evening_melody.mp3');
  }

  // Check if track is registered in content with a published static audio path/filename
  try {
    const savedContent = typeof window !== 'undefined' ? loadSavedContent() : DEFAULT_BUTTERFLY_CONTENT;
    const track = savedContent.audioTracks?.find((t) => t.id === id);
    if (track && track.fileName) {
      const rawPath = track.fileName.startsWith('/')
        ? track.fileName
        : `/audio/${track.fileName}`;
      return assetUrl(rawPath);
    }
  } catch {
    // fallback
  }

  if (urlCache.has(id)) {
    return urlCache.get(id)!;
  }

  const blob = await getAudioBlob(id);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

/**
 * Renames an audio track
 */
export async function renameAudioTrack(id: string, newName: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
      const record = req.result as StoredAudioRecord | undefined;
      if (!record) {
        reject(new Error(`Track ${id} not found`));
        return;
      }
      record.name = newName;
      const putReq = store.put(record);
      putReq.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('butterfly_audio_library_updated'));
        }
        resolve();
      };
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Deletes an audio track
 */
export async function deleteAudioTrack(id: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => {
      if (urlCache.has(id)) {
        URL.revokeObjectURL(urlCache.get(id)!);
        urlCache.delete(id);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('butterfly_audio_library_updated'));
      }
      resolve();
    };

    req.onerror = () => reject(req.error);
  });
}
