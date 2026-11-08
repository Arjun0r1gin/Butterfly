/**
 * BUTTERFLY — Admin Studio Audio Library Component
 * Upload, preview, rename, and manage audio tracks (MP3, WAV, OGG) stored persistently in IndexedDB.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  getAllAudioTracks,
  saveAudioTrack,
  renameAudioTrack,
  deleteAudioTrack,
  getAudioUrl,
  type AudioTrack,
} from '../../../services/audio/audioDB';
import styles from '../../Admin.module.css';

export const AudioLibrary: React.FC = () => {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<{ current: number; duration: number }>({
    current: 0,
    duration: 0,
  });
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadTracks = async () => {
    setIsLoading(true);
    try {
      const list = await getAllAudioTracks();
      setTracks(list);
    } catch (err) {
      console.error('[AudioLibrary] Failed to load tracks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
    const handleUpdate = () => loadTracks();
    window.addEventListener('butterfly_audio_library_updated', handleUpdate);
    return () => {
      window.removeEventListener('butterfly_audio_library_updated', handleUpdate);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    if (!isFinite(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Format bytes to KB / MB
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file uploads (supports multiple files)
  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => {
      const ext = f.name.toLowerCase();
      return (
        ext.endsWith('.mp3') ||
        ext.endsWith('.wav') ||
        ext.endsWith('.ogg') ||
        f.type.startsWith('audio/')
      );
    });

    if (validFiles.length === 0) {
      showToast('⚠️ Please upload MP3, WAV, or OGG audio files.');
      return;
    }

    let savedCount = 0;
    for (const f of validFiles) {
      try {
        await saveAudioTrack(f, f.name, undefined, f.type);
        savedCount++;
      } catch (err) {
        console.error('[AudioLibrary] Save failed for', f.name, err);
      }
    }

    showToast(`✨ Successfully added ${savedCount} audio track${savedCount > 1 ? 's' : ''}!`);
    await loadTracks();
  };

  // Handle Play/Pause Preview
  const handleTogglePlay = async (track: AudioTrack) => {
    if (playingTrackId === track.id) {
      if (audioPreviewRef.current && !audioPreviewRef.current.paused) {
        audioPreviewRef.current.pause();
        setPlayingTrackId(null);
      } else if (audioPreviewRef.current) {
        await audioPreviewRef.current.play();
        setPlayingTrackId(track.id);
      }
      return;
    }

    // Stop current
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    const url = await getAudioUrl(track.id);
    if (!url) {
      showToast('❌ Unable to load audio file');
      return;
    }

    const a = new Audio(url);
    audioPreviewRef.current = a;

    a.ontimeupdate = () => {
      setPlaybackTime({
        current: a.currentTime,
        duration: a.duration || track.duration,
      });
    };

    a.onended = () => {
      setPlayingTrackId(null);
      setPlaybackTime({ current: 0, duration: track.duration });
    };

    a.onerror = () => {
      showToast('❌ Error playing audio preview');
      setPlayingTrackId(null);
    };

    try {
      await a.play();
      setPlayingTrackId(track.id);
    } catch {
      showToast('⚠️ Autoplay prevented');
    }
  };

  // Handle Rename
  const handleStartRename = (track: AudioTrack) => {
    setEditingTrackId(track.id);
    setEditingName(track.name);
  };

  const handleSaveRename = async (id: string) => {
    if (!editingName.trim()) {
      setEditingTrackId(null);
      return;
    }
    try {
      await renameAudioTrack(id, editingName.trim());
      showToast('✓ Track renamed');
      setEditingTrackId(null);
      await loadTracks();
    } catch (err) {
      console.error(err);
      showToast('❌ Rename failed');
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete audio track "${name}" from your local Audio Library?`)) {
      if (playingTrackId === id && audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setPlayingTrackId(null);
      }
      await deleteAudioTrack(id);
      showToast('🗑️ Track deleted');
      await loadTracks();
    }
  };

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const totalBytes = tracks.reduce((sum, t) => sum + (t.size || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.dashboardTitle}>Audio Library</h1>
            <p className={styles.dashboardSubtitle}>
              Upload and manage romantic melodies and songs in MP3, WAV, or OGG format. Stored locally in IndexedDB and ready to embed inline within scrapbook handwriting.
            </p>
          </div>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => fileInputRef.current?.click()}
          >
            <span>+</span> Upload Songs
          </button>
        </div>
      </div>

      {toast && (
        <div
          style={{
            background: 'rgba(229, 189, 117, 0.22)',
            border: '1px solid var(--admin-gold-primary)',
            color: 'var(--admin-gold-bright)',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '0.86rem',
          }}
        >
          {toast}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/mp3,audio/wav,audio/ogg,.mp3,.wav,.ogg"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Drag & Drop Upload Zone */}
      <div
        className={styles.dropzone}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
      >
        <div className={styles.dropzoneIcon}>🎵</div>
        <h3 style={{ margin: '0 0 6px 0', color: 'var(--admin-gold-bright)', fontSize: '1.15rem' }}>
          Drop songs here, or click to browse
        </h3>
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-subtle)' }}>
          Supports MP3, WAV, and OGG formats. Audio files are saved directly to local IndexedDB.
        </p>
      </div>

      {/* Summary Metrics Banner */}
      <div className={styles.metricsGrid} style={{ marginBottom: '24px' }}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Songs</span>
          <span className={styles.metricValue}>{tracks.length}</span>
          <span className={styles.metricDetail}>In Audio Library</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Duration</span>
          <span className={styles.metricValue}>{formatTime(totalDuration)}</span>
          <span className={styles.metricDetail}>Playable audio runtime</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Storage Used</span>
          <span className={styles.metricValue}>{formatSize(totalBytes)}</span>
          <span className={styles.metricDetail}>IndexedDB binary storage</span>
        </div>
      </div>

      {/* Track List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontFamily: 'Cinzel, Georgia, serif', fontSize: '1.05rem', color: 'var(--admin-gold-primary)', margin: '0 0 4px 0' }}>
          Uploaded Audio Tracks ({tracks.length})
        </h3>

        {isLoading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--admin-text-subtle)' }}>
            Loading songs from IndexedDB...
          </div>
        ) : tracks.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'rgba(24, 18, 12, 0.45)',
              border: '1px dashed var(--admin-border)',
              borderRadius: '12px',
              color: 'var(--admin-text-muted)',
            }}
          >
            <p style={{ fontSize: '1.05rem', margin: '0 0 8px 0' }}>No songs uploaded yet.</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-subtle)', margin: 0 }}>
              Upload your favorite songs above to embed them into your scrapbook handwriting.
            </p>
          </div>
        ) : (
          tracks.map((track) => {
            const isPlayingThis = playingTrackId === track.id;
            const isEditing = editingTrackId === track.id;

            return (
              <div
                key={track.id}
                style={{
                  background: isPlayingThis ? 'rgba(229, 189, 117, 0.12)' : 'rgba(24, 18, 12, 0.75)',
                  border: isPlayingThis ? '1px solid var(--admin-gold-primary)' : '1px solid var(--admin-border)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Left: Play/Pause Button */}
                <button
                  type="button"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isPlayingThis ? 'var(--admin-gold-primary)' : 'rgba(229, 189, 117, 0.18)',
                    border: '1px solid var(--admin-gold-primary)',
                    color: isPlayingThis ? '#120e0a' : 'var(--admin-gold-bright)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    flexShrink: 0,
                  }}
                  onClick={() => handleTogglePlay(track)}
                  title={isPlayingThis ? 'Pause preview' : 'Play preview'}
                >
                  {isPlayingThis ? '⏸' : '▶'}
                </button>

                {/* Middle: Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ padding: '4px 10px', fontSize: '0.90rem' }}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(track.id);
                          if (e.key === 'Escape') setEditingTrackId(null);
                        }}
                      />
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => handleSaveRename(track.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => setEditingTrackId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: 'var(--admin-text-main)',
                          fontFamily: 'Playfair Display, Georgia, serif',
                        }}
                      >
                        {track.name}
                      </span>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--admin-gold-primary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          padding: '2px',
                        }}
                        onClick={() => handleStartRename(track)}
                        title="Rename track"
                      >
                        ✏️
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: '14px',
                      fontSize: '0.76rem',
                      color: 'var(--admin-text-subtle)',
                      marginTop: '4px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>📁 {track.fileName}</span>
                    <span>⏱ {formatTime(track.duration)}</span>
                    <span>💾 {formatSize(track.size)}</span>
                    <span>🎵 {track.type.split('/')[1]?.toUpperCase() || 'AUDIO'}</span>
                  </div>

                  {/* Playback Progress Bar if playing */}
                  {isPlayingThis && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '4px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: 'var(--admin-gold-bright)',
                            width: `${
                              playbackTime.duration > 0
                                ? (playbackTime.current / playbackTime.duration) * 100
                                : 0
                            }%`,
                            transition: 'width 0.2s linear',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.70rem', color: 'var(--admin-gold-bright)', fontFamily: 'monospace' }}>
                        {formatTime(playbackTime.current)} / {formatTime(playbackTime.duration)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => handleStartRename(track)}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    onClick={() => handleDelete(track.id, track.name)}
                    title="Delete track from Audio Library"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

