/**
 * BUTTERFLY — IndexedDB Audio Storage Service
 * Local persistent binary storage for MP3, WAV, and OGG songs.
 * Supports track duration extraction, renaming, deletion, and on-demand object URL streaming.
 */

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
 * Retrieves all saved audio tracks (metadata only)
 */
export async function getAllAudioTracks(): Promise<AudioTrack[]> {
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
        resolve(metadataList);
      };

      req.onerror = () => reject(req.error || new Error('Failed to load audio tracks'));
    });
  } catch (err) {
    console.warn('[audioDB] getAllAudioTracks failed, returning empty', err);
    return [];
  }
}

/**
 * Retrieves a single audio track metadata
 */
export async function getAudioTrack(id: string): Promise<AudioTrack | null> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
      const r = req.result as StoredAudioRecord | undefined;
      if (!r) {
        resolve(null);
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
