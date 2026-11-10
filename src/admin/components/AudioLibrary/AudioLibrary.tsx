/**
 * BUTTERFLY — Admin Studio Music & Audio Management Component
 * Dedicated audio & music marker orchestrator:
 * - Persistent binary audio storage in IndexedDB (MP3, WAV, OGG)
 * - Track upload, replacement, deletion, renaming, and preview scrubbing
 * - Right-page handwriting music marker assignments (enable/disable, custom color, custom size)
 * - Move / reassign songs to specific paragraphs across scrapbook spreads
 * - Immediate visitor-facing synchronization & persistence
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  getAllAudioTracks,
  saveAudioTrack,
  replaceAudioTrack,
  renameAudioTrack,
  deleteAudioTrack,
  getAudioUrl,
  type AudioTrack,
} from '../../../services/audio/audioDB';
import type {
  ButterflyContent,
  StorySpreadContent,
  MusicMarker,
} from '../../../services/content/types';
import { loadSavedContent, saveContent } from '../../../services/content/contentStorage';
import { audioPlayer } from '../../../services/audio/audioPlayer';
import styles from '../../Admin.module.css';

export interface AudioLibraryProps {
  content?: ButterflyContent;
  onChange?: (updater: (prev: ButterflyContent) => ButterflyContent) => void;
}

const PRESET_COLORS = [
  { label: 'Crimson Red (Default)', hex: '#D32F2F' },
  { label: 'Deep Ruby', hex: '#B71C1C' },
  { label: 'Romantic Rose', hex: '#E91E63' },
  { label: 'Antique Gold', hex: '#F5BA58' },
  { label: 'Emerald Sage', hex: '#2E7D32' },
  { label: 'Sapphire Night', hex: '#1565C0' },
];

export const AudioLibrary: React.FC<AudioLibraryProps> = ({
  content: propContent,
  onChange: propOnChange,
}) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'markers'>('tracks');
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<{ current: number; duration: number }>({
    current: 0,
    duration: 0,
  });
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [replacingTrackId, setReplacingTrackId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Content state fallback
  const [localContent, setLocalContent] = useState<ButterflyContent>(() =>
    propContent || loadSavedContent()
  );

  const activeContent = propContent || localContent;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
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

  // Update content helper that syncs with parent onChange and saves persistently
  const updateScrapbookContent = (updater: (prev: ButterflyContent) => ButterflyContent) => {
    if (propOnChange) {
      propOnChange(updater);
    } else {
      const updated = updater(localContent);
      setLocalContent(updated);
      saveContent(updated);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    if (!isFinite(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Format bytes to KB / MB
  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return 'Awaiting file';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle uploading new audio files
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

  // Trigger replacing an existing track file
  const handleTriggerReplace = (trackId: string) => {
    setReplacingTrackId(trackId);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = '';
      replaceFileInputRef.current.click();
    }
  };

  // Execute replace when file chosen
  const handleExecuteReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replacingTrackId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      if (playingTrackId === replacingTrackId && audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setPlayingTrackId(null);
      }
      await replaceAudioTrack(replacingTrackId, file, file.name, undefined, file.type);
      showToast(`✓ Replaced audio file for track!`);
      setReplacingTrackId(null);
      await loadTracks();
    } catch (err) {
      console.error(err);
      showToast('❌ Replacement failed');
    }
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

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    const url = await getAudioUrl(track.id);
    if (!url) {
      showToast('⚠️ No audio file uploaded for this track yet. Click "Upload File" to add one.');
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
      showToast('❌ Error playing audio preview. File may need to be uploaded.');
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

  // Extract all markers across spreads
  interface MarkerInfo {
    spreadId: string;
    spreadIndex: number;
    spreadTitle: string;
    markerId: string;
    marker: MusicMarker;
    paragraphIndex: number;
    paragraphText: string;
  }

  const allSpreadMarkers = useMemo<MarkerInfo[]>(() => {
    const list: MarkerInfo[] = [];
    const spreads = activeContent.spreads || [];

    spreads.forEach((sp, spIdx) => {
      const markers = sp.rightPage.musicMarkers || {};
      const paras = sp.rightPage.storyParagraphs || [];

      Object.entries(markers).forEach(([mId, mData]) => {
        let pIdx = -1;
        let pText = '';
        paras.forEach((p, idx) => {
          if (p.includes(`[[music:${mId}]]`)) {
            pIdx = idx;
            pText = p.replace(/\[\[music:[a-zA-Z0-9_\-]+\]\]/g, '').trim();
          }
        });

        list.push({
          spreadId: sp.id,
          spreadIndex: spIdx,
          spreadTitle: sp.title || `Spread ${spIdx + 1}`,
          markerId: mId,
          marker: mData,
          paragraphIndex: pIdx,
          paragraphText: pText || '(Paragraph unassigned)',
        });
      });
    });

    return list;
  }, [activeContent]);

  // Marker editing handlers
  const handleToggleMarkerEnabled = (spreadIndex: number, markerId: string) => {
    updateScrapbookContent((prev) => {
      const spreads = JSON.parse(JSON.stringify(prev.spreads)) as StorySpreadContent[];
      const targetSp = spreads[spreadIndex];
      if (targetSp && targetSp.rightPage.musicMarkers?.[markerId]) {
        const cur = targetSp.rightPage.musicMarkers[markerId].enabled !== false;
        targetSp.rightPage.musicMarkers[markerId].enabled = !cur;
      }
      const updated = { ...prev, spreads };
      saveContent(updated);
      return updated;
    });
    showToast('✓ Marker visibility updated');
  };

  const handleUpdateMarkerColor = (spreadIndex: number, markerId: string, color: string) => {
    updateScrapbookContent((prev) => {
      const spreads = JSON.parse(JSON.stringify(prev.spreads)) as StorySpreadContent[];
      const targetSp = spreads[spreadIndex];
      if (targetSp && targetSp.rightPage.musicMarkers?.[markerId]) {
        targetSp.rightPage.musicMarkers[markerId].color = color;
      }
      const updated = { ...prev, spreads };
      saveContent(updated);
      return updated;
    });
  };

  const handleUpdateMarkerSize = (spreadIndex: number, markerId: string, size: number) => {
    updateScrapbookContent((prev) => {
      const spreads = JSON.parse(JSON.stringify(prev.spreads)) as StorySpreadContent[];
      const targetSp = spreads[spreadIndex];
      if (targetSp && targetSp.rightPage.musicMarkers?.[markerId]) {
        targetSp.rightPage.musicMarkers[markerId].size = size;
      }
      const updated = { ...prev, spreads };
      saveContent(updated);
      return updated;
    });
  };

  const handleUpdateMarkerTrack = (spreadIndex: number, markerId: string, trackId: string) => {
    const matched = tracks.find((t) => t.id === trackId);
    updateScrapbookContent((prev) => {
      const spreads = JSON.parse(JSON.stringify(prev.spreads)) as StorySpreadContent[];
      const targetSp = spreads[spreadIndex];
      if (targetSp && targetSp.rightPage.musicMarkers?.[markerId]) {
        targetSp.rightPage.musicMarkers[markerId].trackId = trackId;
        if (matched) {
          targetSp.rightPage.musicMarkers[markerId].title = matched.name;
        }
      }
      const updated = { ...prev, spreads };
      saveContent(updated);
      return updated;
    });
    showToast(`✓ Assigned "${matched?.name || 'track'}" to marker`);
  };

  const handleUpdateMarkerTitle = (spreadIndex: number, markerId: string, title: string) => {
    updateScrapbookContent((prev) => {
      const spreads = JSON.parse(JSON.stringify(prev.spreads)) as StorySpreadContent[];
      const targetSp = spreads[spreadIndex];
      if (targetSp && targetSp.rightPage.musicMarkers?.[markerId]) {
        targetSp.rightPage.musicMarkers[markerId].title = title;
      }
      const updated = { ...prev, spreads };
      saveContent(updated);
      return updated;
    });
  };

  // Move marker to a different paragraph on the spread
  const handleMoveMarkerToParagraph = (
    spreadIndex: number,
    markerId: string,
    targetParaIdx: number
  ) => {
    updateScrapbookContent((prev) => {
      const spreads = JSON.parse(JSON.stringify(prev.spreads)) as StorySpreadContent[];
      const targetSp = spreads[spreadIndex];
      if (!targetSp) return prev;

      const paras = targetSp.rightPage.storyParagraphs || [];
      const markerTag = `[[music:${markerId}]]`;

      // 1. Strip marker from all paragraphs on this spread
      const cleanedParas = paras.map((p) => p.replace(markerTag, '').trim());

      // 2. Append to target paragraph
      if (cleanedParas[targetParaIdx] !== undefined) {
        cleanedParas[targetParaIdx] = `${cleanedParas[targetParaIdx]} ${markerTag}`.trim();
      }

      targetSp.rightPage.storyParagraphs = cleanedParas;
      const updated = { ...prev, spreads };
      saveContent(updated);
      return updated;
    });
    showToast(`✓ Moved music marker to paragraph ${targetParaIdx + 1}`);
  };

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const totalBytes = tracks.reduce((sum, t) => sum + (t.size || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.dashboardTitle}>Music & Audio Management</h1>
            <p className={styles.dashboardSubtitle}>
              Manage romantic melodies, song assignments, red music icons, and paragraph placements in your confession scrapbook. Stored locally in IndexedDB & LocalStorage.
            </p>
          </div>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => fileInputRef.current?.click()}
          >
            + Upload New Song
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.ogg,audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".mp3,.wav,.ogg,audio/*"
        style={{ display: 'none' }}
        onChange={handleExecuteReplace}
      />

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid var(--admin-border)',
          marginBottom: '24px',
          paddingBottom: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('tracks')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tracks' ? '2px solid var(--admin-gold-primary)' : '2px solid transparent',
            color: activeTab === 'tracks' ? 'var(--admin-gold-bright)' : 'var(--admin-text-subtle)',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: 'Cinzel, Georgia, serif',
            transition: 'all 0.2s',
          }}
        >
          🎵 Audio Tracks Library ({tracks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('markers')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'markers' ? '2px solid var(--admin-gold-primary)' : '2px solid transparent',
            color: activeTab === 'markers' ? 'var(--admin-gold-bright)' : 'var(--admin-text-subtle)',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: 'Cinzel, Georgia, serif',
            transition: 'all 0.2s',
          }}
        >
          🏷️ Scrapbook Music Markers & Placements ({allSpreadMarkers.length})
        </button>
      </div>

      {/* TAB 1: TRACKS LIBRARY */}
      {activeTab === 'tracks' && (
        <div>
          {/* Summary Metrics Banner */}
          <div className={styles.metricsGrid} style={{ marginBottom: '24px' }}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Songs</span>
              <span className={styles.metricValue}>{tracks.length}</span>
              <span className={styles.metricDetail}>In Audio Library</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Playtime</span>
              <span className={styles.metricValue}>{formatTime(totalDuration)}</span>
              <span className={styles.metricDetail}>Playable audio runtime</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Storage Used</span>
              <span className={styles.metricValue}>{formatSize(totalBytes)}</span>
              <span className={styles.metricDetail}>IndexedDB binary storage</span>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            style={{
              border: '2px dashed var(--admin-border)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(24, 18, 12, 0.45)',
              marginBottom: '28px',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--admin-gold-primary)';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--admin-border)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--admin-border)';
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎵</div>
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--admin-gold-bright)', fontSize: '1.05rem' }}>
              Drop audio files here, or click to upload
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-subtle)' }}>
              Supports MP3, WAV, and OGG formats. Audio files are saved directly into your local IndexedDB storage.
            </p>
          </div>

          {/* Track List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                const hasFile = (track.size || 0) > 0;

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
                        background: isPlayingThis
                          ? 'var(--admin-gold-primary)'
                          : hasFile
                          ? 'rgba(229, 189, 117, 0.18)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isPlayingThis
                          ? '1px solid var(--admin-gold-primary)'
                          : hasFile
                          ? '1px solid var(--admin-gold-primary)'
                          : '1px dashed rgba(255, 255, 255, 0.2)',
                        color: isPlayingThis ? '#120e0a' : hasFile ? 'var(--admin-gold-bright)' : 'var(--admin-text-subtle)',
                        fontSize: '1rem',
                        cursor: hasFile ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        flexShrink: 0,
                      }}
                      onClick={() => handleTogglePlay(track)}
                      title={hasFile ? (isPlayingThis ? 'Pause preview' : 'Play preview') : 'No audio file uploaded yet'}
                    >
                      {isPlayingThis ? '⏸' : hasFile ? '▶' : '⏳'}
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
                          {!hasFile && (
                            <span
                              style={{
                                background: 'rgba(211, 47, 47, 0.25)',
                                color: '#ff8a80',
                                border: '1px solid rgba(211, 47, 47, 0.4)',
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                              }}
                            >
                              Awaiting audio file
                            </span>
                          )}
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
                        {hasFile && <span>⏱ {formatTime(track.duration)}</span>}
                        <span>💾 {formatSize(track.size)}</span>
                        <span>🎵 {track.type.split('/')[1]?.toUpperCase() || 'AUDIO'}</span>
                      </div>

                      {/* Playback Progress Bar */}
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
                        className={styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => handleTriggerReplace(track.id)}
                        title={hasFile ? 'Replace audio file' : 'Upload MP3 audio file'}
                      >
                        {hasFile ? '🔄 Replace File' : '📤 Upload Audio'}
                      </button>

                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        onClick={() => handleStartRename(track)}
                      >
                        Rename
                      </button>

                      {track.id !== 'track_remo_first_sight' &&
                        track.id !== 'track_othadayai_padhayile' &&
                        track.id !== 'track_thalaivar_bgm' && (
                          <button
                            type="button"
                            className={styles.btnDanger}
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleDelete(track.id, track.name)}
                            title="Delete track from Audio Library"
                          >
                            🗑️
                          </button>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCRAPBOOK MUSIC MARKERS & PLACEMENTS */}
      {activeTab === 'markers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '10px',
              background: 'rgba(211, 47, 47, 0.08)',
              border: '1px solid rgba(211, 47, 47, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#ff8a80', fontSize: '0.98rem' }}>
                Right-Hand Page Music Icons & Paragraph Associations
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-subtle)' }}>
                Music icons appear ONLY on handwritten right-hand pages (zero on left collage pages). Default icon color is Crimson Red. Clicking an icon toggles playback exclusively.
              </p>
            </div>
          </div>

          {allSpreadMarkers.map((item) => {
            const isEnabled = item.marker.enabled !== false;
            const markerColor = item.marker.color || '#D32F2F';
            const markerSize = item.marker.size || 26;
            const spreadObj = activeContent.spreads[item.spreadIndex];
            const paragraphs = spreadObj?.rightPage?.storyParagraphs || [];

            return (
              <div
                key={item.markerId}
                style={{
                  background: 'rgba(24, 18, 12, 0.75)',
                  border: isEnabled ? '1px solid var(--admin-gold-primary)' : '1px solid var(--admin-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Header Row: Spread & ID & Visibility Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        background: 'rgba(229, 189, 117, 0.15)',
                        color: 'var(--admin-gold-bright)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {item.spreadTitle} (Right Page)
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--admin-text-main)' }}>
                      Marker: <code style={{ color: 'var(--admin-gold-primary)' }}>{item.markerId}</code>
                    </span>
                  </div>

                  {/* Enable / Disable Toggle Button */}
                  <button
                    type="button"
                    style={{
                      background: isEnabled ? 'rgba(46, 125, 50, 0.25)' : 'rgba(120, 120, 120, 0.25)',
                      border: isEnabled ? '1px solid rgba(76, 175, 80, 0.6)' : '1px solid rgba(160, 160, 160, 0.4)',
                      color: isEnabled ? '#81c784' : '#b0bec5',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onClick={() => handleToggleMarkerEnabled(item.spreadIndex, item.markerId)}
                  >
                    <span>{isEnabled ? '● Active / Visible' : '○ Disabled / Hidden'}</span>
                  </button>
                </div>

                {/* Paragraph Excerpt */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--admin-gold-primary)',
                    color: 'var(--admin-text-main)',
                    fontFamily: 'Caveat, cursive, sans-serif',
                    fontSize: '1.15rem',
                  }}
                >
                  "{item.paragraphText}"
                </div>

                {/* Settings Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                    paddingTop: '6px',
                  }}
                >
                  {/* Setting 1: Assigned Track */}
                  <div>
                    <label className={styles.formLabel}>Assigned Song Track</label>
                    <select
                      className={styles.formSelect}
                      value={item.marker.trackId || ''}
                      onChange={(e) =>
                        handleUpdateMarkerTrack(item.spreadIndex, item.markerId, e.target.value)
                      }
                    >
                      <option value="">(None / Unassigned)</option>
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({formatSize(t.size)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Setting 2: Display Title */}
                  <div>
                    <label className={styles.formLabel}>Marker Display Label</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={item.marker.title || ''}
                      placeholder="e.g. Remo — First Sight BGM"
                      onChange={(e) =>
                        handleUpdateMarkerTitle(item.spreadIndex, item.markerId, e.target.value)
                      }
                    />
                  </div>

                  {/* Setting 3: Icon Color Picker */}
                  <div>
                    <label className={styles.formLabel}>Icon Color (Default RED)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={markerColor}
                        onChange={(e) =>
                          handleUpdateMarkerColor(item.spreadIndex, item.markerId, e.target.value)
                        }
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          border: '1px solid var(--admin-border)',
                          cursor: 'pointer',
                          background: 'none',
                          padding: '2px',
                        }}
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ width: '100px', fontSize: '0.85rem' }}
                        value={markerColor}
                        onChange={(e) =>
                          handleUpdateMarkerColor(item.spreadIndex, item.markerId, e.target.value)
                        }
                      />
                      {/* Preset swatches */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.label}
                            onClick={() =>
                              handleUpdateMarkerColor(item.spreadIndex, item.markerId, c.hex)
                            }
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: c.hex,
                              border: markerColor === c.hex ? '2px solid white' : '1px solid rgba(0,0,0,0.4)',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Setting 4: Icon Size Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className={styles.formLabel}>Icon Size ({markerSize}px)</label>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={40}
                      step={1}
                      value={markerSize}
                      onChange={(e) =>
                        handleUpdateMarkerSize(
                          item.spreadIndex,
                          item.markerId,
                          parseInt(e.target.value, 10)
                        )
                      }
                      style={{ width: '100%', accentColor: markerColor }}
                    />
                  </div>

                  {/* Setting 5: Paragraph Assignment / Reorder */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className={styles.formLabel}>Move to Paragraph on this Page</label>
                    <select
                      className={styles.formSelect}
                      value={item.paragraphIndex}
                      onChange={(e) =>
                        handleMoveMarkerToParagraph(
                          item.spreadIndex,
                          item.markerId,
                          parseInt(e.target.value, 10)
                        )
                      }
                    >
                      {paragraphs.map((p, pIdx) => {
                        const cleanExcerpt = p.replace(/\[\[music:[a-zA-Z0-9_\-]+\]\]/g, '').trim();
                        return (
                          <option key={pIdx} value={pIdx}>
                            Para {pIdx + 1}: {cleanExcerpt.slice(0, 75)}...
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Live Icon Test & Interactive Preview */}
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-subtle)' }}>
                      Interactive Right-Page Preview:
                    </span>
                    <button
                      type="button"
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: `${markerSize}px`,
                        height: `${markerSize}px`,
                        borderRadius: '50%',
                        background: `radial-gradient(circle at 35% 35%, #ff8a80 0%, ${markerColor} 60%, #b71c1c 100%)`,
                        border: '1px solid rgba(138, 20, 20, 0.5)',
                        boxShadow: `0 2px 6px ${markerColor}66, 0 1px 3px rgba(0, 0, 0, 0.15)`,
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        audioPlayer.playMarker(item.marker);
                      }}
                      title="Click to test play song"
                    >
                      <span
                        style={{
                          fontFamily: 'Caveat, cursive, sans-serif',
                          fontWeight: 700,
                          fontSize: `${Math.round(markerSize * 0.58)}px`,
                          lineHeight: 1,
                          color: '#ffffff',
                          transform: 'translateY(-0.5px)',
                        }}
                      >
                        ♫
                      </span>
                    </button>
                    <span style={{ fontSize: '0.80rem', color: 'var(--admin-gold-primary)' }}>
                      {item.marker.title || 'Play music'} (Click icon to test)
                    </span>
                  </div>

                  <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-subtle)' }}>
                    Saved automatically to LocalStorage & IndexedDB
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(28, 20, 14, 0.95)',
            border: '1px solid var(--admin-gold-primary)',
            color: 'var(--admin-gold-bright)',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '0.88rem',
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};
