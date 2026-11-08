/**
 * BUTTERFLY — Media Library Component
 * Upload, browse, preview, replace, and delete PNG, JPG, WebP, and animated GIF files.
 * Binary blobs are stored in IndexedDB preserving animated GIF frames and high resolution.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { MediaAsset } from '../../../services/content/types';
import {
  saveMediaFile,
  deleteMediaFile,
  getAllMediaAssets,
  getMediaUrl,
} from '../../../services/content/indexedDB';
import styles from '../../Admin.module.css';

export interface MediaLibraryProps {
  onSelectMedia?: (asset: MediaAsset, url: string) => void;
  isPickerMode?: boolean;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectMedia,
  isPickerMode = false,
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetIdRef = useRef<string | null>(null);

  // Load assets from IndexedDB
  const refreshAssets = async () => {
    try {
      const list = await getAllMediaAssets();
      setAssets(list);

      // Resolve URLs
      const urlDict: Record<string, string> = {};
      for (const item of list) {
        const u = await getMediaUrl(item.id);
        if (u) urlDict[item.id] = u;
      }
      setUrls(urlDict);
    } catch (err) {
      console.error('[MediaLibrary] Failed to load assets', err);
      setErrorMsg('Failed to read from IndexedDB.');
    }
  };

  useEffect(() => {
    refreshAssets();
  }, []);

  const handleProcessFile = async (file: File, replaceId?: string) => {
    setErrorMsg(null);

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg(`Unsupported file type: ${file.type}. Please upload PNG, JPG, WebP, or GIF.`);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Limit is 15MB.`);
      return;
    }

    setIsUploading(true);
    try {
      const id = replaceId || `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await saveMediaFile(id, file, file.name, file.type);
      await refreshAssets();
    } catch (err) {
      console.error('[MediaLibrary] Failed to upload media file', err);
      setErrorMsg('Failed to save file to IndexedDB storage.');
    } finally {
      setIsUploading(false);
      replaceTargetIdRef.current = null;
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleProcessFile(file, replaceTargetIdRef.current || undefined);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this media asset from IndexedDB?')) return;

    try {
      await deleteMediaFile(id);
      await refreshAssets();
    } catch (err) {
      console.error('[MediaLibrary] Delete failed', err);
      setErrorMsg('Failed to delete media asset.');
    }
  };

  const handleReplace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    replaceTargetIdRef.current = id;
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.8rem', margin: '0 0 6px', color: 'var(--admin-text-main)' }}>
            Media Library
          </h2>
          <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.88rem' }}>
            Permanent IndexedDB binary storage. Full support for animated GIFs, high-res photos, and transparent PNG stickers.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(224, 82, 68, 0.2)', border: '1px solid var(--admin-danger)', borderRadius: '8px', padding: '12px 16px', color: '#ffb3ad', marginBottom: '20px', fontSize: '0.86rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Upload Zone */}
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
        onClick={() => {
          replaceTargetIdRef.current = null;
          fileInputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className={styles.dropzoneIcon}>📁</div>
        <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: 'var(--admin-text-main)' }}>
          {isUploading ? 'Saving to IndexedDB...' : 'Drag & drop image or animated GIF here'}
        </h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-subtle)' }}>
          PNG, JPG, WebP, or GIF up to 15MB. Click anywhere to browse files.
        </p>
      </div>

      {/* Media Grid */}
      {assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--admin-text-subtle)' }}>
          No media files uploaded yet. Drag and drop your favorite stickers or animated GIFs above!
        </div>
      ) : (
        <div className={styles.mediaGrid}>
          {assets.map((item) => {
            const url = urls[item.id];
            return (
              <div
                key={item.id}
                className={styles.mediaItemCard}
                onClick={() => onSelectMedia && url && onSelectMedia(item, url)}
                style={{ cursor: isPickerMode ? 'pointer' : 'default' }}
              >
                <div className={styles.mediaThumbWrapper}>
                  {url ? (
                    <img src={url} alt={item.name} className={styles.mediaThumb} />
                  ) : (
                    <div style={{ color: 'var(--admin-text-subtle)', fontSize: '0.8rem' }}>Loading...</div>
                  )}
                  {item.isGif && <span className={styles.gifBadge}>GIF</span>}
                </div>

                <div className={styles.mediaDetails}>
                  <span className={styles.mediaName} title={item.name}>
                    {item.name}
                  </span>
                  <span className={styles.mediaMeta}>
                    {formatFileSize(item.size)} • {item.type.split('/')[1]?.toUpperCase()}
                  </span>
                </div>

                <div className={styles.mediaActions}>
                  {isPickerMode ? (
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      style={{ padding: '4px 10px', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}
                      onClick={() => url && onSelectMedia(item, url)}
                    >
                      Insert
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        onClick={(e) => handleReplace(item.id, e)}
                        title="Replace this asset"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete from IndexedDB"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
