/**
 * BUTTERFLY — IndexedDB Media Storage Service
 * Client-side binary storage for PNG, JPG, WebP, and animated GIF blobs.
 * Preserves binary fidelity, animated GIF frames, and prevents storage quota exhaustion.
 */

import type { MediaAsset } from './types';

const DB_NAME = 'butterfly_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

interface StoredMediaRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  isGif: boolean;
  blob: Blob;
  createdAt: number;
}

let dbInstance: IDBDatabase | null = null;
const objectUrlCache = new Map<string, string>();

export async function openMediaDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
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
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Saves a file/blob to IndexedDB and returns its MediaAsset metadata
 */
export async function saveMediaFile(
  id: string,
  blob: Blob,
  name: string,
  type: string
): Promise<MediaAsset> {
  const db = await openMediaDB();
  const isGif = type === 'image/gif' || name.toLowerCase().endsWith('.gif');
  const record: StoredMediaRecord = {
    id,
    name,
    type,
    size: blob.size,
    isGif,
    blob,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => {
      // Create and cache object URL
      const url = URL.createObjectURL(blob);
      objectUrlCache.set(id, url);

      resolve({
        id,
        name,
        type,
        size: blob.size,
        isGif,
        createdAt: record.createdAt,
      });
    };

    req.onerror = () => {
      reject(req.error || new Error(`Failed to save media file ${id}`));
    };
  });
}

/**
 * Retrieves the raw Blob for a given media ID
 */
export async function getMediaBlob(id: string): Promise<Blob | null> {
  const db = await openMediaDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
      const record = req.result as StoredMediaRecord | undefined;
      resolve(record ? record.blob : null);
    };

    req.onerror = () => {
      reject(req.error || new Error(`Failed to get media blob ${id}`));
    };
  });
}

/**
 * Returns a live Object URL for a given media ID (cached)
 */
export async function getMediaUrl(id: string): Promise<string | null> {
  if (objectUrlCache.has(id)) {
    return objectUrlCache.get(id)!;
  }

  const blob = await getMediaBlob(id);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  objectUrlCache.set(id, url);
  return url;
}

/**
 * Deletes a media file by ID
 */
export async function deleteMediaFile(id: string): Promise<boolean> {
  const db = await openMediaDB();

  // Revoke cached URL
  if (objectUrlCache.has(id)) {
    URL.revokeObjectURL(objectUrlCache.get(id)!);
    objectUrlCache.delete(id);
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error(`Failed to delete media ${id}`));
  });
}

/**
 * Lists all media assets metadata
 */
export async function getAllMediaAssets(): Promise<MediaAsset[]> {
  const db = await openMediaDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const records = (req.result as StoredMediaRecord[]) || [];
      const assets: MediaAsset[] = records.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        size: r.size,
        isGif: r.isGif,
        createdAt: r.createdAt,
      }));
      resolve(assets);
    };

    req.onerror = () => reject(req.error || new Error('Failed to retrieve media assets'));
  });
}

/**
 * Exports all media items as Base64 Data URLs for export package creation
 */
export async function exportAllMediaAsDataUrls(): Promise<Record<string, string>> {
  const db = await openMediaDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = async () => {
      const records = (req.result as StoredMediaRecord[]) || [];
      const dict: Record<string, string> = {};

      for (const rec of records) {
        dict[rec.id] = await blobToDataUrl(rec.blob);
      }
      resolve(dict);
    };

    req.onerror = () => reject(req.error || new Error('Failed to export media records'));
  });
}

/**
 * Imports media dictionary from data URLs into IndexedDB
 */
export async function importMediaFromDataUrls(
  mediaDict: Record<string, string>,
  assets: MediaAsset[]
): Promise<void> {
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  for (const [id, dataUrl] of Object.entries(mediaDict)) {
    const asset = assetMap.get(id);
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    const mime = asset?.type || mimeMatch?.[1] || 'image/png';
    const name = asset?.name || `asset_${id}.png`;
    const blob = dataUrlToBlob(dataUrl, mime);
    await saveMediaFile(id, blob, name, mime);
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string, defaultMime = 'image/png'): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : defaultMime;
  const bstr = atob(parts[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
