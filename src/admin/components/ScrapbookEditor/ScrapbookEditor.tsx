/**
 * BUTTERFLY — Simplified Scrapbook Content Admin Editor
 * Clean, document-style writing experience for non-technical users:
 * - Direct single-document writing with automatic paragraph recognition & preservation
 * - Formatting toolbar (Font family, size, line spacing, ink color swatches, alignment, bold, italic, reset)
 * - Seamless cursor-based music marker insertion, color & size customization, and test audio playback
 * - Readable live physical book preview with parchment texture, realistic spacing, and full-size toggle
 * - Gentle, human-friendly overflow guidance ("This page looks good." / "This page is getting full.")
 * - Dedicated Left Page photo collage & sticker canvas mode (strictly separated from narrative writing)
 * - Full Undo / Redo history stack and zero data loss for existing confession text
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  ButterflyContent,
  StorySpreadContent,
  PageLeftContent,
  PageRightContent,
  StickerItem,
  MediaAsset,
  PageTypography,
  MusicMarker,
} from '../../../services/content/types';
import { audioPlayer } from '../../../services/audio/audioPlayer';
import { getAllAudioTracks, type AudioTrack } from '../../../services/audio/audioDB';
import { NowPlayingPill } from '../../../components/common/NowPlayingPill';
import { StickerCanvas } from '../Common/StickerCanvas';
import { MediaLibrary } from '../MediaLibrary/MediaLibrary';
import styles from '../../Admin.module.css';

export interface ScrapbookEditorProps {
  content: ButterflyContent;
  onChange: (updater: (prev: ButterflyContent) => ButterflyContent) => void;
}

export const ScrapbookEditor: React.FC<ScrapbookEditorProps> = ({
  content,
  onChange,
}) => {
  const [activeSpreadIdx, setActiveSpreadIdx] = useState(0);
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('right');
  const [viewMode, setViewMode] = useState<'split' | 'preview-only'>('split');
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Undo / Redo history stack
  const historyRef = useRef<ButterflyContent[]>([]);
  const historyIdxRef = useRef<number>(-1);

  const pushHistory = useCallback((currentContent: ButterflyContent) => {
    const newHistory = historyRef.current.slice(0, historyIdxRef.current + 1);
    newHistory.push(JSON.parse(JSON.stringify(currentContent)));
    if (newHistory.length > 25) newHistory.shift();
    historyRef.current = newHistory;
    historyIdxRef.current = newHistory.length - 1;
  }, []);

  const handleUndo = () => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current--;
      const snapshot = historyRef.current[historyIdxRef.current];
      onChange(() => JSON.parse(JSON.stringify(snapshot)));
    }
  };

  const handleRedo = () => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current++;
      const snapshot = historyRef.current[historyIdxRef.current];
      onChange(() => JSON.parse(JSON.stringify(snapshot)));
    }
  };

  const activeSpread = content.spreads[activeSpreadIdx] || content.spreads[0];
  const activeLeft = activeSpread.leftPage;
  const activeRight = activeSpread.rightPage;

  // Audio tracks library
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  useEffect(() => {
    getAllAudioTracks().then((tracks) => setAudioTracks(tracks));
    const handleUpdate = () => {
      getAllAudioTracks().then((tracks) => setAudioTracks(tracks));
    };
    window.addEventListener('butterfly_audio_library_updated', handleUpdate);
    return () => window.removeEventListener('butterfly_audio_library_updated', handleUpdate);
  }, []);

  // Built-in audio track options to complement uploaded tracks
  const availableTracks = useMemo(() => {
    const defaultTrackOptions: AudioTrack[] = [
      {
        id: 'track_remo_first_sight',
        name: 'Remo — First Sight BGM',
        fileName: 'remo_first_sight.mp3',
        type: 'audio/mpeg',
        size: 2150000,
        duration: 48,
        createdAt: 1731000000000,
      },
      {
        id: 'sample_our_evening',
        name: 'Our Evening ♡ (Default Theme)',
        fileName: 'our_evening.mp3',
        type: 'audio/mpeg',
        size: 1587644,
        duration: 32,
        createdAt: 1731070000000,
      },
    ];

    const map = new Map<string, AudioTrack>();
    defaultTrackOptions.forEach((t) => map.set(t.id, t));
    audioTracks.forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [audioTracks]);

  // Main story document local text state (syncs cleanly with storyParagraphs)
  const storyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const savedCursorPos = useRef<number>(0);
  const [documentText, setDocumentText] = useState(() =>
    activeRight.storyParagraphs.join('\n\n')
  );

  // Synchronize documentText when active spread or side changes, or during undo/redo
  useEffect(() => {
    const currentJoined = activeRight.storyParagraphs.join('\n\n');
    const localTrimmed = documentText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const externalTrimmed = activeRight.storyParagraphs.map((p) => p.trim()).filter(Boolean);
    const isDifferent =
      localTrimmed.length !== externalTrimmed.length ||
      localTrimmed.some((p, i) => p !== externalTrimmed[i]);

    if (isDifferent) {
      setDocumentText(currentJoined);
    }
  }, [activeSpreadIdx, activeSide, activeRight.storyParagraphs]);

  // Spread updater helper
  const updateActiveSpread = (
    updater: (spread: StorySpreadContent) => StorySpreadContent
  ) => {
    pushHistory(content);
    onChange((prev) => {
      const nextSpreads = [...prev.spreads];
      nextSpreads[activeSpreadIdx] = updater(nextSpreads[activeSpreadIdx]);
      return {
        ...prev,
        spreads: nextSpreads,
      };
    });
  };

  const updateLeftPage = (updater: (left: PageLeftContent) => PageLeftContent) => {
    updateActiveSpread((sp) => ({
      ...sp,
      leftPage: updater(sp.leftPage),
    }));
  };

  const updateRightPage = (updater: (right: PageRightContent) => PageRightContent) => {
    updateActiveSpread((sp) => ({
      ...sp,
      rightPage: updater(sp.rightPage),
    }));
  };

  // Typography controls
  const typo = activeRight.typography || {};
  const activeFont = typo.fontFamily || 'Caveat';
  const activeFontSize = typo.fontSize || 48;
  const activeColor = typo.color || '#17120F';
  const activeLineHeight = typo.lineHeight || 1.48;
  const activeParaSpacing = typo.paragraphSpacing !== undefined ? typo.paragraphSpacing : 18;
  const activeAlign = typo.textAlign || 'left';

  const updateTypography = (updater: (prev: PageTypography) => PageTypography) => {
    updateRightPage((r) => ({
      ...r,
      typography: updater(r.typography || {
        fontFamily: 'Caveat',
        fontSize: 48,
        color: '#17120F',
        lineHeight: 1.48,
        paragraphSpacing: 18,
        textAlign: 'left',
      }),
    }));
  };

  const handleResetTypography = () => {
    updateTypography(() => ({
      fontFamily: 'Caveat',
      fontSize: 48,
      color: '#17120F',
      lineHeight: 1.48,
      paragraphSpacing: 18,
      textAlign: 'left',
    }));
  };

  // Capacity & human-friendly overflow calculations
  const allWords = activeRight.storyParagraphs.join(' ').trim().split(/\s+/).filter(Boolean);
  const wordsCount = allWords.length;
  const nonBlankParas = activeRight.storyParagraphs.filter((p) => p.trim().length > 0);

  const avgCharW = activeFontSize * 0.43;
  const charsPerLine = Math.max(22, Math.floor(734 / avgCharW));

  let estTotalLines = 0;
  nonBlankParas.forEach((p) => {
    const linesInPara = Math.max(1, Math.ceil(p.length / charsPerLine));
    estTotalLines += linesInPara;
  });

  const linePx = Math.round(activeFontSize * activeLineHeight);
  const totalTextHeightPx =
    estTotalLines * linePx + Math.max(0, nonBlankParas.length - 1) * activeParaSpacing;
  const usableHeightPx = 760;
  const capacityPct = Math.round((totalTextHeightPx / usableHeightPx) * 100);

  // Human-friendly overflow guidance status
  const overflowStatus = useMemo(() => {
    if (capacityPct <= 78) {
      return {
        level: 'good' as const,
        icon: '🟢',
        title: 'This page looks good.',
        subtitle: 'Comfortable breathing room & margins.',
        className: styles.guidancePillGood,
      };
    } else if (capacityPct <= 102) {
      return {
        level: 'warning' as const,
        icon: '🟡',
        title: 'This page is getting full.',
        subtitle: 'Fills the physical page comfortably.',
        className: styles.guidancePillWarning,
      };
    } else {
      return {
        level: 'overflow' as const,
        icon: '🟠',
        title: 'Some text may be cut off. Consider moving a paragraph to the next page.',
        subtitle: 'Text extends beyond boundary.',
        className: styles.guidancePillOverflow,
      };
    }
  }, [capacityPct]);

  // Scaled typography for live preview
  const isPreviewOnly = viewMode === 'preview-only';
  const previewFontSize = isPreviewOnly
    ? `${activeFontSize}px`
    : `${Math.max(16, Math.round(activeFontSize * 0.68))}px`;
  const previewParaGap = isPreviewOnly
    ? `${activeParaSpacing}px`
    : `${Math.max(10, Math.round(activeParaSpacing * 0.55))}px`;

  // Main textarea change handler
  const handleDocumentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setDocumentText(newText);
    const rawParas = newText.split(/\n\s*\n/);
    const paras = rawParas.map((p) => p.trim()).filter(Boolean);
    updateRightPage((r) => ({
      ...r,
      storyParagraphs: paras.length > 0 ? paras : newText.trim() ? [newText.trim()] : [],
    }));
  };

  // Document paragraph helper actions
  const handleAddParagraph = () => {
    const newText = documentText.trimEnd() + '\n\n';
    setDocumentText(newText);
    setTimeout(() => {
      if (storyTextareaRef.current) {
        storyTextareaRef.current.focus();
        storyTextareaRef.current.selectionStart = newText.length;
        storyTextareaRef.current.selectionEnd = newText.length;
      }
    }, 20);
  };

  const handleSplitAtCursor = () => {
    const textarea = storyTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = documentText.substring(0, start) + '\n\n' + documentText.substring(end);
    setDocumentText(newText);
    const paras = newText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    updateRightPage((r) => ({ ...r, storyParagraphs: paras }));
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    }, 20);
  };

  const handleMergeParagraphs = () => {
    const newText = documentText.replace(/\n\s*\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    setDocumentText(newText);
    updateRightPage((r) => ({ ...r, storyParagraphs: [newText] }));
  };

  // Text formatting helpers for Bold and Italic
  const handleFormatWrap = (prefix: string, suffix: string) => {
    const textarea = storyTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = documentText.substring(start, end);

    let newText = '';
    let newCursorPos = start;

    if (
      selected.startsWith(prefix) &&
      selected.endsWith(suffix) &&
      selected.length >= prefix.length + suffix.length
    ) {
      // Unwrap
      newText =
        documentText.substring(0, start) +
        selected.slice(prefix.length, -suffix.length) +
        documentText.substring(end);
      newCursorPos = start + selected.length - prefix.length - suffix.length;
    } else {
      // Wrap
      newText =
        documentText.substring(0, start) +
        `${prefix}${selected}${suffix}` +
        documentText.substring(end);
      newCursorPos = start + selected.length + prefix.length + suffix.length;
    }

    setDocumentText(newText);
    const paras = newText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    updateRightPage((r) => ({ ...r, storyParagraphs: paras }));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
    }, 20);
  };

  // Music Marker Modal State & Handlers
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [musicModalMode, setMusicModalMode] = useState<'create' | 'edit'>('create');
  const [modalMarkerId, setModalMarkerId] = useState<string>('');
  const [modalTrackId, setModalTrackId] = useState<string>('track_remo_first_sight');
  const [modalTitle, setModalTitle] = useState<string>('Remo — First Sight BGM');
  const [modalColor, setModalColor] = useState<string>('#D32F2F');
  const [modalSize, setModalSize] = useState<number>(26);
  const [modalLoop, setModalLoop] = useState<boolean>(true);
  const [modalStart, setModalStart] = useState<number>(0);
  const [modalEnd, setModalEnd] = useState<number | undefined>(undefined);

  const openInsertMusicModal = () => {
    const textarea = storyTextareaRef.current;
    savedCursorPos.current = textarea ? textarea.selectionStart : documentText.length;

    const newId = `m_${Date.now()}`;
    const defaultTrack = availableTracks[0] || {
      id: 'track_remo_first_sight',
      name: 'Remo — First Sight BGM',
    };

    setModalMarkerId(newId);
    setModalTrackId(defaultTrack.id);
    setModalTitle(defaultTrack.name);
    setModalColor('#D32F2F');
    setModalSize(26);
    setModalLoop(true);
    setModalStart(0);
    setModalEnd(undefined);
    setMusicModalMode('create');
    setMusicModalOpen(true);
  };

  const openEditMusicModal = (mId: string) => {
    const marker = activeRight.musicMarkers?.[mId] || {
      id: mId,
      trackId: 'track_remo_first_sight',
      title: 'Our Melody ♡',
      color: '#D32F2F',
      size: 26,
      loop: true,
    };

    setModalMarkerId(mId);
    setModalTrackId(marker.trackId);
    setModalTitle(marker.title || 'Our Melody ♡');
    setModalColor(marker.color || '#D32F2F');
    setModalSize(marker.size || 26);
    setModalLoop(marker.loop !== false);
    setModalStart(marker.startTime || 0);
    setModalEnd(marker.endTime);
    setMusicModalMode('edit');
    setMusicModalOpen(true);
  };

  const handleSaveMusicModal = () => {
    const marker: MusicMarker = {
      id: modalMarkerId,
      trackId: modalTrackId,
      title: modalTitle.trim() || 'Our Melody ♡',
      color: modalColor,
      size: modalSize,
      loop: modalLoop,
      startTime: modalStart,
      endTime: modalEnd,
      enabled: true,
    };

    if (musicModalMode === 'create') {
      const start = savedCursorPos.current;
      const before = documentText.slice(0, start);
      const after = documentText.slice(start);
      const markerTag = `[[music:${modalMarkerId}]]`;

      const needsSpaceBefore =
        before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
      const needsSpaceAfter =
        after.length > 0 &&
        !after.startsWith(' ') &&
        !after.startsWith('\n') &&
        !after.startsWith('.') &&
        !after.startsWith(',');

      const newText =
        before + (needsSpaceBefore ? ' ' : '') + markerTag + (needsSpaceAfter ? ' ' : '') + after;

      setDocumentText(newText);
      const paras = newText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

      updateRightPage((r) => ({
        ...r,
        storyParagraphs: paras,
        musicMarkers: {
          ...(r.musicMarkers || {}),
          [modalMarkerId]: marker,
        },
      }));
    } else {
      updateRightPage((r) => ({
        ...r,
        musicMarkers: {
          ...(r.musicMarkers || {}),
          [modalMarkerId]: marker,
        },
      }));
    }

    setMusicModalOpen(false);
  };

  const handleDeleteMusicMarker = (markerId: string) => {
    const markerTagRegex = new RegExp(`\\[\\[music:${markerId}\\]\\]`, 'g');
    const newText = documentText.replace(markerTagRegex, '').replace(/\s{2,}/g, ' ');
    setDocumentText(newText);

    const paras = newText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    updateRightPage((r) => {
      const remainingMarkers = { ...(r.musicMarkers || {}) };
      delete remainingMarkers[markerId];
      return {
        ...r,
        storyParagraphs: paras,
        musicMarkers: remainingMarkers,
      };
    });
  };

  // Reorder Paragraphs Modal State & Handlers
  const [reorderModalOpen, setReorderModalOpen] = useState(false);

  const handleMoveParagraph = (fromIdx: number, direction: -1 | 1) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= activeRight.storyParagraphs.length) return;

    const nextParas = [...activeRight.storyParagraphs];
    const temp = nextParas[fromIdx];
    nextParas[fromIdx] = nextParas[toIdx];
    nextParas[toIdx] = temp;

    const newText = nextParas.join('\n\n');
    setDocumentText(newText);
    updateRightPage((r) => ({ ...r, storyParagraphs: nextParas }));
  };

  const handleDeleteParagraphFromList = (idx: number) => {
    const nextParas = activeRight.storyParagraphs.filter((_, i) => i !== idx);
    const newText = nextParas.join('\n\n');
    setDocumentText(newText);
    updateRightPage((r) => ({ ...r, storyParagraphs: nextParas }));
  };

  // Render markdown bold and italic in preview
  const renderFormattedText = (text: string) => {
    const tokens = text.split(/(\*\*.*?\*\*|\*[^*]+?\*)/g);
    return tokens.map((tok, i) => {
      if (tok.startsWith('**') && tok.endsWith('**') && tok.length >= 4) {
        return (
          <strong key={i} style={{ fontWeight: 700 }}>
            {tok.slice(2, -2)}
          </strong>
        );
      }
      if (tok.startsWith('*') && tok.endsWith('*') && tok.length >= 2) {
        return (
          <em key={i} style={{ fontStyle: 'italic' }}>
            {tok.slice(1, -1)}
          </em>
        );
      }
      return tok;
    });
  };

  // Render physical preview paragraph with clickable music note badges
  const renderPreviewParagraph = (para: string) => {
    const parts = para.split(/(\[\[music:[a-zA-Z0-9_\-]+\]\][,\.!?;:]*)/g);
    return parts.map((part, pIdx) => {
      const match = part.match(/^\[\[music:([a-zA-Z0-9_\-]+)\]\]([,\.!?;:]*)$/);
      if (!match) {
        return <React.Fragment key={pIdx}>{renderFormattedText(part)}</React.Fragment>;
      }

      const markerId = match[1];
      const punct = match[2] || '';
      const marker = activeRight.musicMarkers?.[markerId] || {
        id: markerId,
        trackId: 'track_remo_first_sight',
        title: 'Remo — First Sight BGM',
        color: '#D32F2F',
        size: 26,
        loop: true,
      };

      const customColor = marker.color || '#D32F2F';
      const badgeSize = isPreviewOnly
        ? marker.size || 26
        : Math.max(18, Math.round((marker.size || 26) * 0.85));

      return (
        <span key={pIdx} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: `${badgeSize}px`,
              height: `${badgeSize}px`,
              borderRadius: '50%',
              margin: '0 4px',
              background: `radial-gradient(circle at 35% 35%, #ff8a80 0%, ${customColor} 60%, #8b0000 100%)`,
              boxShadow: `0 2px 8px ${customColor}88, 0 1px 3px rgba(0, 0, 0, 0.3)`,
              border: '1px solid rgba(255, 255, 255, 0.45)',
              cursor: 'pointer',
              color: '#ffffff',
              fontFamily: "'Caveat', cursive, sans-serif",
              fontWeight: 700,
              fontSize: `${Math.round(badgeSize * 0.58)}px`,
              padding: 0,
              verticalAlign: 'middle',
              position: 'relative',
              transition: 'transform 0.15s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              audioPlayer.playMarker(marker, {
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
            }}
            title={`Play "${marker.title}" (Click to test audio)`}
          >
            ♫
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                fontSize: '9px',
                color: '#fff9c4',
                pointerEvents: 'none',
              }}
            >
              ✧
            </span>
          </button>
          {punct}
        </span>
      );
    });
  };

  // Sticker updates for Left Page canvas
  const handleUpdateStickers = (stickers: StickerItem[]) => {
    if (activeSide === 'left') {
      updateLeftPage((l) => ({ ...l, stickers }));
    } else {
      updateRightPage((r) => ({ ...r, stickers }));
    }
  };

  const handleSelectMediaForSticker = (asset: MediaAsset, url: string) => {
    setShowMediaPicker(false);

    const addStickerWithDimensions = (w: number, h: number) => {
      const newSticker: StickerItem = {
        id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: asset.isGif ? 'gif' : 'image',
        label: asset.name,
        mediaId: asset.id,
        customUrl: url,
        x: 50,
        y: 50,
        width: w,
        height: h,
        rotationDeg: 0,
        zIndex: 10,
      };

      if (activeSide === 'left') {
        updateLeftPage((l) => ({ ...l, stickers: [...l.stickers, newSticker] }));
      } else {
        updateRightPage((r) => ({ ...r, stickers: [...r.stickers, newSticker] }));
      }
    };

    // Pre-calculate natural aspect ratio of image so it doesn't get squashed
    const testImg = new Image();
    testImg.onload = () => {
      const natW = testImg.naturalWidth || 1;
      const natH = testImg.naturalHeight || 1;
      const aspect = natW / natH;
      let w = 180;
      let h = 180;
      if (aspect >= 1) {
        w = 200;
        h = Math.max(40, Math.round(w / aspect));
      } else {
        h = 220;
        w = Math.max(40, Math.round(h * aspect));
      }
      addStickerWithDimensions(w, h);
    };
    testImg.onerror = () => {
      addStickerWithDimensions(180, 180);
    };
    testImg.src = url;
  };

  // Extract all active music markers referenced on the current right page
  const activePageMarkerIds = useMemo(() => {
    const text = activeRight.storyParagraphs.join('\n\n');
    const matchedIds: string[] = [];
    const regex = /\[\[music:([a-zA-Z0-9_\-]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (!matchedIds.includes(m[1])) matchedIds.push(m[1]);
    }
    const registeredIds = Object.keys(activeRight.musicMarkers || {});
    return Array.from(new Set([...matchedIds, ...registeredIds]));
  }, [activeRight.storyParagraphs, activeRight.musicMarkers]);

  return (
    <div>
      {/* Spread & Page Navigator Row */}
      <div className={styles.spreadSelectorRow}>
        <div className={styles.spreadTabs}>
          {content.spreads.map((sp, idx) => (
            <button
              key={sp.id}
              type="button"
              className={`${styles.spreadTab} ${
                activeSpreadIdx === idx ? styles.spreadTabActive : ''
              }`}
              onClick={() => setActiveSpreadIdx(idx)}
            >
              Chapter {idx + 1}
            </button>
          ))}
        </div>

        {/* Side Toggle & View Modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div className={styles.pageSideToggle}>
            <button
              type="button"
              className={`${styles.sideBtn} ${
                activeSide === 'left' ? styles.sideBtnActive : ''
              }`}
              onClick={() => setActiveSide('left')}
            >
              Left Page (Photos & Notes)
            </button>
            <button
              type="button"
              className={`${styles.sideBtn} ${
                activeSide === 'right' ? styles.sideBtnActive : ''
              }`}
              onClick={() => setActiveSide('right')}
            >
              Right Page (Narrative)
            </button>
          </div>

          {/* Right Page View Mode Toggle: Split vs Preview Only */}
          {activeSide === 'right' && (
            <div className={styles.pageSideToggle}>
              <button
                type="button"
                className={`${styles.sideBtn} ${
                  viewMode === 'split' ? styles.sideBtnActive : ''
                }`}
                onClick={() => setViewMode('split')}
                title="Split document editor and live page preview"
              >
                ✍️ Split View
              </button>
              <button
                type="button"
                className={`${styles.sideBtn} ${
                  viewMode === 'preview-only' ? styles.sideBtnActive : ''
                }`}
                onClick={() => setViewMode('preview-only')}
                title="Distraction-free full size reading preview"
              >
                📖 Preview Only
              </button>
            </div>
          )}

          {/* Undo / Redo */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ padding: '6px 10px', fontSize: '0.80rem' }}
              onClick={handleUndo}
              title="Undo last change"
            >
              ↺ Undo
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ padding: '6px 10px', fontSize: '0.80rem' }}
              onClick={handleRedo}
              title="Redo"
            >
              ↻ Redo
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PAGE NARRATIVE MODE (SIMPLIFIED DOCUMENT WRITING EXPERIENCE)
          ========================================================================= */}
      {activeSide === 'right' && (
        <>
          {viewMode === 'preview-only' ? (
            /* ----------------- PREVIEW-ONLY MODE (FULL SIZE READING) ----------------- */
            <div className={styles.narrativeLayoutPreviewOnly}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: '760px',
                }}
              >
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                  onClick={() => setViewMode('split')}
                >
                  <span>←</span> Return to Writing Studio
                </button>
                <div className={`${styles.guidancePill} ${overflowStatus.className}`} style={{ width: 'auto' }}>
                  <span>
                    {overflowStatus.icon} {overflowStatus.title} ({wordsCount} words · {nonBlankParas.length} paragraphs)
                  </span>
                </div>
              </div>

              {/* Full-size readable physical page */}
              <div className={`${styles.readablePhysicalPage} ${styles.readablePhysicalPageFullSize}`}>
                <img
                  src="/storybook/assets/doodle_butterfly.png"
                  alt=""
                  style={{ position: 'absolute', top: '24px', right: '32px', width: '80px', opacity: 0.95 }}
                />

                {activeRight.dateOrLocation && (
                  <div style={{ textAlign: 'right', marginBottom: '14px' }}>
                    <span
                      style={{
                        fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                        fontSize: '32px',
                        color: activeColor,
                        fontWeight: 600,
                      }}
                    >
                      {activeRight.dateOrLocation}
                    </span>
                    <div
                      style={{
                        width: '90px',
                        height: '2px',
                        background: activeColor,
                        marginLeft: 'auto',
                        marginTop: '-2px',
                      }}
                    />
                  </div>
                )}

                {activeRight.chapterNumber && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '6px' }}>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '-6px',
                        width: 'calc(100% + 14px)',
                        height: '18px',
                        background: 'rgba(235, 160, 175, 0.45)',
                        borderRadius: '4px',
                      }}
                    />
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                        fontSize: '30px',
                        fontWeight: 700,
                        color: activeColor,
                      }}
                    >
                      {activeRight.chapterNumber}
                    </span>
                  </div>
                )}

                {activeRight.chapterTitle && (
                  <div style={{ position: 'relative', display: 'block', marginBottom: '22px' }}>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '-8px',
                        width: 'calc(100% + 18px)',
                        height: '22px',
                        background: 'rgba(235, 160, 175, 0.45)',
                        borderRadius: '6px',
                      }}
                    />
                    <h2
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                        fontSize: '40px',
                        fontWeight: 700,
                        color: activeColor,
                        margin: 0,
                      }}
                    >
                      {activeRight.chapterTitle}
                    </h2>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: previewParaGap }}>
                  {activeRight.storyParagraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      style={{
                        fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                        fontSize: previewFontSize,
                        lineHeight: activeLineHeight,
                        color: activeColor,
                        margin: 0,
                        textAlign: activeAlign,
                      }}
                    >
                      {renderPreviewParagraph(para)}
                    </p>
                  ))}
                </div>

                {activeRight.signature && (
                  <div style={{ textAlign: 'right', marginTop: '22px' }}>
                    <span
                      style={{
                        fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                        fontStyle: 'italic',
                        fontSize: `calc(${previewFontSize} * 0.95)`,
                        color: activeColor,
                      }}
                    >
                      {activeRight.signature}
                    </span>
                  </div>
                )}
              </div>

              <NowPlayingPill />
            </div>
          ) : (
            /* ----------------- SPLIT VIEW MODE (EDITOR + LIVE PREVIEW) ----------------- */
            <div className={styles.narrativeLayoutSplit}>
              {/* Left Side: Readable Live Physical Book Preview */}
              <div className={styles.readablePreviewWrapper}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--admin-gold-primary)' }}>
                    Live Physical Page (Page {activeSpreadIdx * 2 + 2})
                  </span>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--admin-gold-bright)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                    onClick={() => setViewMode('preview-only')}
                  >
                    📖 Enlarge Full Page
                  </button>
                </div>

                {/* Scaled Physical Page */}
                <div className={styles.readablePhysicalPage}>
                  <img
                    src="/storybook/assets/doodle_butterfly.png"
                    alt=""
                    style={{ position: 'absolute', top: '16px', right: '20px', width: '55px', opacity: 0.95 }}
                  />

                  {activeRight.dateOrLocation && (
                    <div style={{ textAlign: 'right', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                          fontSize: '22px',
                          color: activeColor,
                          fontWeight: 600,
                        }}
                      >
                        {activeRight.dateOrLocation}
                      </span>
                      <div
                        style={{
                          width: '65px',
                          height: '2px',
                          background: activeColor,
                          marginLeft: 'auto',
                          marginTop: '-2px',
                        }}
                      />
                    </div>
                  )}

                  {activeRight.chapterNumber && (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          left: '-4px',
                          width: 'calc(100% + 10px)',
                          height: '14px',
                          background: 'rgba(235, 160, 175, 0.45)',
                          borderRadius: '4px',
                        }}
                      />
                      <span
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                          fontSize: '20px',
                          fontWeight: 700,
                          color: activeColor,
                        }}
                      >
                        {activeRight.chapterNumber}
                      </span>
                    </div>
                  )}

                  {activeRight.chapterTitle && (
                    <div style={{ position: 'relative', display: 'block', marginBottom: '12px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          left: '-6px',
                          width: 'calc(100% + 14px)',
                          height: '16px',
                          background: 'rgba(235, 160, 175, 0.45)',
                          borderRadius: '6px',
                        }}
                      />
                      <h3
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                          fontSize: '26px',
                          fontWeight: 700,
                          color: activeColor,
                          margin: 0,
                        }}
                      >
                        {activeRight.chapterTitle}
                      </h3>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: previewParaGap }}>
                    {activeRight.storyParagraphs.map((para, pIdx) => (
                      <p
                        key={pIdx}
                        style={{
                          fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                          fontSize: previewFontSize,
                          lineHeight: activeLineHeight,
                          color: activeColor,
                          margin: 0,
                          textAlign: activeAlign,
                        }}
                      >
                        {renderPreviewParagraph(para)}
                      </p>
                    ))}
                  </div>

                  {activeRight.signature && (
                    <div style={{ textAlign: 'right', marginTop: '12px' }}>
                      <span
                        style={{
                          fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                          fontStyle: 'italic',
                          fontSize: `calc(${previewFontSize} * 0.95)`,
                          color: activeColor,
                        }}
                      >
                        {activeRight.signature}
                      </span>
                    </div>
                  )}
                </div>

                {/* Friendly Page Guidance Pill (No scary 300% warning) */}
                <div className={`${styles.guidancePill} ${overflowStatus.className}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{overflowStatus.icon}</span>
                    <span style={{ fontWeight: 600 }}>{overflowStatus.title}</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>
                    {wordsCount} words · {nonBlankParas.length} paras
                  </span>
                </div>

                <NowPlayingPill />
              </div>

              {/* Right Side: Main Document Writing Studio */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* A. Page Settings Card */}
                <div className={styles.pageSettingsCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--admin-gold-primary)', fontWeight: 700 }}>
                      Page Settings
                    </span>
                  </div>
                  <div className={styles.pageSettingsGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Chapter Number</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ padding: '6px 10px', fontSize: '0.84rem' }}
                        value={activeRight.chapterNumber}
                        onChange={(e) => updateRightPage((r) => ({ ...r, chapterNumber: e.target.value }))}
                        placeholder="e.g. Chapter I ♡"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Chapter Title</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ padding: '6px 10px', fontSize: '0.84rem' }}
                        value={activeRight.chapterTitle}
                        onChange={(e) => updateRightPage((r) => ({ ...r, chapterTitle: e.target.value }))}
                        placeholder="e.g. How It All Started"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Date Caption</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ padding: '6px 10px', fontSize: '0.84rem' }}
                        value={activeRight.dateOrLocation || ''}
                        onChange={(e) => updateRightPage((r) => ({ ...r, dateOrLocation: e.target.value }))}
                        placeholder="e.g. 18 March"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Closing Signature</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ padding: '6px 10px', fontSize: '0.84rem' }}
                        value={activeRight.signature || ''}
                        onChange={(e) => updateRightPage((r) => ({ ...r, signature: e.target.value }))}
                        placeholder="e.g. Always yours, Elena ♡"
                      />
                    </div>
                  </div>
                </div>

                {/* B. Basic Formatting Toolbar */}
                <div className={styles.documentToolbar}>
                  {/* Font Family */}
                  <div className={styles.toolbarGroup}>
                    <select
                      className={styles.formSelect}
                      style={{ padding: '4px 8px', fontSize: '0.80rem', height: '32px' }}
                      value={activeFont}
                      onChange={(e) => updateTypography((t) => ({ ...t, fontFamily: e.target.value }))}
                      title="Select handwriting font"
                    >
                      <option value="Caveat">Caveat (Diary Cursive)</option>
                      <option value="Patrick Hand">Patrick Hand (Warm Handwritten)</option>
                      <option value="Kalam">Kalam (Natural Fountain Pen)</option>
                      <option value="Playfair Display">Playfair Display (Serif)</option>
                      <option value="Cormorant Garamond">Cormorant Garamond (Romantic)</option>
                    </select>
                  </div>

                  <div className={styles.toolbarDivider} />

                  {/* Font Size (+ / - / slider) */}
                  <div className={styles.toolbarGroup}>
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => updateTypography((t) => ({ ...t, fontSize: Math.max(20, (t.fontSize || 34) - 2) }))}
                      title="Decrease font size"
                    >
                      A-
                    </button>
                    <span style={{ fontSize: '0.80rem', fontFamily: 'monospace', color: 'var(--admin-gold-bright)', minWidth: '34px', textAlign: 'center' }}>
                      {activeFontSize}px
                    </span>
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => updateTypography((t) => ({ ...t, fontSize: Math.min(52, (t.fontSize || 34) + 2) }))}
                      title="Increase font size"
                    >
                      A+
                    </button>
                  </div>

                  <div className={styles.toolbarDivider} />

                  {/* Line Spacing */}
                  <div className={styles.toolbarGroup} title={`Line spacing: ${activeLineHeight.toFixed(2)}x`}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-subtle)' }}>Line:</span>
                    <input
                      type="range"
                      min={1.2}
                      max={2.2}
                      step={0.05}
                      style={{ width: '65px', accentColor: 'var(--admin-gold-primary)' }}
                      value={activeLineHeight}
                      onChange={(e) => updateTypography((t) => ({ ...t, lineHeight: Number(e.target.value) }))}
                    />
                    <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: 'var(--admin-text-subtle)' }}>
                      {activeLineHeight.toFixed(2)}x
                    </span>
                  </div>

                  <div className={styles.toolbarDivider} />

                  {/* Ink Color Swatches + Native Picker */}
                  <div className={styles.toolbarGroup}>
                    {[
                      { label: 'Deep Black', color: '#17120F' },
                      { label: 'Dark Walnut', color: '#2B1810' },
                      { label: 'Vintage Sepia', color: '#3E2A1E' },
                      { label: 'Indigo Navy', color: '#161C28' },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        type="button"
                        title={swatch.label}
                        className={styles.colorSwatchBtn}
                        style={{
                          background: swatch.color,
                          width: '20px',
                          height: '20px',
                          border:
                            activeColor.toLowerCase() === swatch.color.toLowerCase()
                              ? '2px solid var(--admin-gold-bright)'
                              : '1px solid rgba(255,255,255,0.25)',
                        }}
                        onClick={() => updateTypography((t) => ({ ...t, color: swatch.color }))}
                      />
                    ))}
                    <input
                      type="color"
                      value={activeColor}
                      onChange={(e) => updateTypography((t) => ({ ...t, color: e.target.value }))}
                      style={{ width: '22px', height: '22px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                      title="Custom Ink Color"
                    />
                  </div>

                  <div className={styles.toolbarDivider} />

                  {/* Alignment & Bold / Italic Helpers */}
                  <div className={styles.toolbarGroup}>
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        className={`${styles.toolbarBtn} ${activeAlign === align ? styles.toolbarBtnActive : ''}`}
                        onClick={() => updateTypography((t) => ({ ...t, textAlign: align }))}
                        title={`Align ${align}`}
                      >
                        {align === 'left' ? '⯸' : align === 'center' ? '⯹' : '⯺'}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => handleFormatWrap('**', '**')}
                      title="Bold selection"
                      style={{ fontWeight: 800 }}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => handleFormatWrap('*', '*')}
                      title="Italicize selection"
                      style={{ fontStyle: 'italic' }}
                    >
                      I
                    </button>
                  </div>

                  <div className={styles.toolbarDivider} />

                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--admin-text-subtle)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                    onClick={handleResetTypography}
                    title="Reset typography to defaults"
                  >
                    Reset
                  </button>
                </div>

                {/* C. Main Writing Editor */}
                <div className={styles.writingEditorCard}>
                  <div className={styles.writingEditorHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.80rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--admin-gold-primary)', fontWeight: 700 }}>
                        Page Narrative
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-subtle)' }}>
                        (Write or paste naturally; paragraphs separate on empty lines)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Insert Music Note Button (Prominent Action) */}
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #e5bd75 0%, #db8a2a 100%)',
                          color: '#2b1504',
                          fontWeight: 700,
                        }}
                        onClick={openInsertMusicModal}
                        title="Place cursor where music should start, then click to insert a clickable note"
                      >
                        <span style={{ fontSize: '1rem' }}>♫</span>
                        <span>Insert Music Note</span>
                      </button>

                      {/* Paragraph Helpers */}
                      <button
                        type="button"
                        className={styles.toolbarBtn}
                        onClick={handleAddParagraph}
                        title="Append a new blank paragraph at the end"
                      >
                        + Add Para
                      </button>
                      <button
                        type="button"
                        className={styles.toolbarBtn}
                        onClick={handleSplitAtCursor}
                        title="Split paragraph at cursor position"
                      >
                        Split Cursor
                      </button>
                      <button
                        type="button"
                        className={styles.toolbarBtn}
                        onClick={() => setReorderModalOpen(true)}
                        title="Organize, reorder or delete individual paragraphs"
                      >
                        ↕ Organize ({nonBlankParas.length})
                      </button>
                    </div>
                  </div>

                  {/* Single Document Textarea */}
                  <textarea
                    ref={storyTextareaRef}
                    className={styles.documentTextarea}
                    style={{
                      fontFamily: `"${activeFont}", 'Caveat', cursive, sans-serif`,
                    }}
                    value={documentText}
                    onChange={handleDocumentTextChange}
                    placeholder="Write your story freely across the page. Separate paragraphs with an empty line..."
                  />
                </div>

                {/* D. Active Music Notes on this Page Tray */}
                {activePageMarkerIds.length > 0 && (
                  <div className={styles.musicTrayCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-gold-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎵</span> Active Music Notes on this Page ({activePageMarkerIds.length})
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle)' }}>
                        Embedded in text at cursor position
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activePageMarkerIds.map((mId) => {
                        const marker = activeRight.musicMarkers?.[mId] || {
                          id: mId,
                          trackId: 'track_remo_first_sight',
                          title: 'Remo — First Sight BGM',
                          color: '#D32F2F',
                          size: 26,
                          loop: true,
                        };
                        const markerColor = marker.color || '#D32F2F';

                        return (
                          <div key={mId} className={styles.musicMarkerItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  background: `radial-gradient(circle at 35% 35%, #ff8a80 0%, ${markerColor} 60%, #8b0000 100%)`,
                                  color: '#ffffff',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  boxShadow: `0 2px 6px ${markerColor}66`,
                                }}
                              >
                                ♫
                              </span>
                              <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)' }}>
                                  {marker.title || 'Untitled Melody'}
                                </div>
                                <div style={{ fontSize: '0.70rem', color: 'var(--admin-text-subtle)' }}>
                                  Track ID: {marker.trackId} · Color: {markerColor}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                className={styles.toolbarBtn}
                                style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                onClick={() => audioPlayer.playMarker(marker)}
                                title="Test play audio snippet"
                              >
                                ▶ Test Play
                              </button>
                              <button
                                type="button"
                                className={styles.toolbarBtn}
                                style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                onClick={() => openEditMusicModal(mId)}
                                title="Edit song, title, color or size"
                              >
                                ⚙ Edit
                              </button>
                              <button
                                type="button"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--admin-danger)',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  padding: '2px 6px',
                                }}
                                onClick={() => handleDeleteMusicMarker(mId)}
                                title="Remove note from text and page"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          LEFT PAGE (PHOTOS & NOTES COLLAGE MODE)
          ========================================================================= */}
      {activeSide === 'left' && (
        <div className={styles.editorWorkspace}>
          {/* Left Column: Interactive Visual Canvas for Stickers & GIFs */}
          <div className={styles.canvasColumn}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-gold-primary)' }}>
                Left Page Scrapbook Collage (Page {activeSpreadIdx * 2 + 1})
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {(activeLeft.stickers.length > 0 || (activeLeft.photos && activeLeft.photos.length > 0)) && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => {
                      if (window.confirm('Clear all stickers and images from this left page?')) {
                        updateLeftPage((l) => ({ ...l, stickers: [], photos: [], handwrittenNotes: [] }));
                      }
                    }}
                    title="Remove all items and keep page blank"
                  >
                    Clear Page
                  </button>
                )}
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  onClick={() => setShowMediaPicker(true)}
                >
                  + Add Image / Sticker / GIF
                </button>
              </div>
            </div>

            <div className={styles.canvasBoardWrapper}>
              <StickerCanvas
                stickers={activeLeft.stickers}
                onUpdateStickers={handleUpdateStickers}
                backgroundSrc="/storybook/studio_page_blank_left.jpg"
              >
                {/* Empty State Watermark for Blank Left Page */}
                {activeLeft.stickers.length === 0 && (!activeLeft.photos || activeLeft.photos.length === 0) && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      padding: '24px',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '32px', opacity: 0.35, marginBottom: '6px' }}>✨</span>
                    <p
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: '22px',
                        color: '#6e5847',
                        margin: 0,
                        opacity: 0.75,
                      }}
                    >
                      Blank Scrapbook Page
                    </p>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#8c735d',
                        marginTop: '6px',
                        maxWidth: '240px',
                        opacity: 0.8,
                        lineHeight: 1.4,
                      }}
                    >
                      Click &ldquo;+ Add Image / Sticker / GIF&rdquo; to place your own memories here.
                    </p>
                  </div>
                )}

                {/* Legacy polaroid support if present */}
                {activeLeft.photos && activeLeft.photos.length > 0 && (
                  <div style={{ padding: '24px 16px', pointerEvents: 'none', userSelect: 'none', height: '100%', position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '14px',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {activeLeft.photos.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            background: '#fffefb',
                            border: '1px solid #ede4d3',
                            padding: '6px 6px 14px',
                            boxShadow: '0 8px 18px rgba(25,14,6,0.22)',
                            width: activeLeft.photos.length === 3 ? '120px' : '145px',
                            transform: `rotate(${p.rotationDeg}deg)`,
                            borderRadius: '2px',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '55px',
                              height: '14px',
                              background:
                                p.tapeStyle === 'washi-gold'
                                  ? 'rgba(235, 215, 185, 0.9)'
                                  : 'rgba(245, 175, 190, 0.9)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                            }}
                          />

                          <div
                            style={{
                              width: '100%',
                              height: activeLeft.photos.length === 3 ? '85px' : '105px',
                              background: p.bgGradient || '#fdfbf7',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {p.customUrl ? (
                              <img
                                src={p.customUrl}
                                alt={p.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontSize: '24px' }}>{p.doodle || '📷'}</span>
                            )}
                          </div>

                          <div
                            style={{
                              fontFamily: "'Caveat', 'Patrick Hand', cursive",
                              fontSize: '14px',
                              color: '#161311',
                              fontWeight: 600,
                              marginTop: '6px',
                              textAlign: 'left',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {p.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </StickerCanvas>
              <NowPlayingPill />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', textAlign: 'center' }}>
              Tip: Click a sticker to select it. Drag to reposition, use bottom-right corner to resize, top handle to rotate.
            </span>
          </div>

          {/* Right Column: Polaroid Photos & Handwritten Quotes Inspector */}
          <div className={styles.inspectorColumn}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', margin: 0, color: 'var(--admin-gold-primary)' }}>
              Left Page Memories & Notes
            </h3>

            {activeLeft.photos.map((photo, pIdx) => (
              <div
                key={photo.id}
                style={{
                  background: 'rgba(28, 22, 16, 0.6)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--admin-gold-primary)' }}>
                  Polaroid Memory {pIdx + 1}
                </span>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Photo Title / Caption</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={photo.title}
                    onChange={(e) =>
                      updateLeftPage((l) => {
                        const nextPhotos = [...l.photos];
                        nextPhotos[pIdx] = { ...nextPhotos[pIdx], title: e.target.value };
                        return { ...l, photos: nextPhotos };
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date Caption</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={photo.date || ''}
                    onChange={(e) =>
                      updateLeftPage((l) => {
                        const nextPhotos = [...l.photos];
                        nextPhotos[pIdx] = { ...nextPhotos[pIdx], date: e.target.value };
                        return { ...l, photos: nextPhotos };
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Washi Tape Style</label>
                  <select
                    className={styles.formSelect}
                    value={photo.tapeStyle}
                    onChange={(e) =>
                      updateLeftPage((l) => {
                        const nextPhotos = [...l.photos];
                        nextPhotos[pIdx] = {
                          ...nextPhotos[pIdx],
                          tapeStyle: e.target.value as any,
                        };
                        return { ...l, photos: nextPhotos };
                      })
                    }
                  >
                    <option value="washi-pink">Washi Pink Ribbon</option>
                    <option value="washi-gold">Washi Gold Leaf</option>
                    <option value="corner-tabs">Corner Photo Tabs</option>
                  </select>
                </div>
              </div>
            ))}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Handwritten Notes & Quotes (One per line)</label>
              <textarea
                className={styles.formTextarea}
                style={{ minHeight: '120px' }}
                value={activeLeft.handwrittenNotes.join('\n')}
                placeholder="Enter quotes or handwritten notes..."
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  updateLeftPage((l) => ({ ...l, handwrittenNotes: lines }));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MUSIC MARKER MODAL (INSERT OR EDIT MUSIC NOTE)
          ========================================================================= */}
      {musicModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setMusicModalOpen(false)}>
          <div
            className={styles.modalContent}
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: modalColor }}>♫</span>
                <span>{musicModalMode === 'create' ? 'Insert Interactive Music Note' : 'Edit Music Note'}</span>
              </h3>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setMusicModalOpen(false)}
              >
                ✕ Close
              </button>
            </div>

            <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Audio Track Selector */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Song from Audio Library</label>
                <select
                  className={styles.formSelect}
                  value={modalTrackId}
                  onChange={(e) => {
                    const trkId = e.target.value;
                    setModalTrackId(trkId);
                    const matched = availableTracks.find((t) => t.id === trkId);
                    if (matched) setModalTitle(matched.name);
                  }}
                >
                  {availableTracks.map((trk) => (
                    <option key={trk.id} value={trk.id}>
                      {trk.name} ({trk.type?.replace('audio/', '') || 'song'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Title */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Display Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Remo — First Sight BGM"
                />
              </div>

              {/* Marker Color Swatches & Custom Picker */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Note Color (Default: Crimson Red)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Crimson Red (Default)', color: '#D32F2F' },
                    { label: 'Amber Gold', color: '#E5BD75' },
                    { label: 'Sunset Rose', color: '#E05275' },
                    { label: 'Royal Indigo', color: '#3F51B5' },
                    { label: 'Forest Green', color: '#2E7D32' },
                  ].map((swatch) => (
                    <button
                      key={swatch.color}
                      type="button"
                      title={swatch.label}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: swatch.color,
                        border:
                          modalColor.toLowerCase() === swatch.color.toLowerCase()
                            ? '3px solid #ffffff'
                            : '1.5px solid rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                      }}
                      onClick={() => setModalColor(swatch.color)}
                    />
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="color"
                      value={modalColor}
                      onChange={(e) => setModalColor(e.target.value)}
                      style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }}
                      title="Custom color picker"
                    />
                    <input
                      type="text"
                      className={styles.formInput}
                      style={{ width: '85px', padding: '4px 8px', fontSize: '0.78rem', fontFamily: 'monospace' }}
                      value={modalColor}
                      onChange={(e) => setModalColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Marker Size */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.formLabel}>Note Size</label>
                  <span style={{ fontSize: '0.76rem', color: 'var(--admin-gold-bright)', fontFamily: 'monospace' }}>
                    {modalSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={36}
                  step={1}
                  value={modalSize}
                  onChange={(e) => setModalSize(Number(e.target.value))}
                  style={{ accentColor: modalColor }}
                />
              </div>

              {/* Live Note Preview */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: `${modalSize}px`,
                      height: `${modalSize}px`,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, #ff8a80 0%, ${modalColor} 60%, #8b0000 100%)`,
                      boxShadow: `0 2px 10px ${modalColor}88`,
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: `${Math.round(modalSize * 0.58)}px`,
                      position: 'relative',
                    }}
                  >
                    ♫
                    <span style={{ position: 'absolute', top: '-3px', right: '-3px', fontSize: '9px', color: '#fff9c4' }}>✧</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--admin-text-main)' }}>
                      Preview: {modalTitle || 'Song Title'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle)' }}>
                      How it will appear between handwritten lines
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.toolbarBtn}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={() =>
                    audioPlayer.playMarker({
                      id: modalMarkerId,
                      trackId: modalTrackId,
                      title: modalTitle,
                      loop: modalLoop,
                      startTime: modalStart,
                      endTime: modalEnd,
                    })
                  }
                >
                  ▶ Test Audio
                </button>
              </div>

              {/* Playback Controls: Loop & Timing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--admin-text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalLoop}
                    onChange={(e) => setModalLoop(e.target.checked)}
                  />
                  <span>Loop Audio continuously</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
                  <span>Start:</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    style={{ width: '50px', padding: '3px 6px', fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', borderRadius: '4px', color: '#fff' }}
                    value={modalStart}
                    onChange={(e) => setModalStart(Number(e.target.value))}
                  />
                  <span>s</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
                  <span>End:</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    style={{ width: '50px', padding: '3px 6px', fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', borderRadius: '4px', color: '#fff' }}
                    value={modalEnd || ''}
                    onChange={(e) => setModalEnd(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Full"
                  />
                  <span>s</span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setMusicModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSaveMusicModal}
                style={{ background: 'linear-gradient(135deg, #e5bd75 0%, #db8a2a 100%)', color: '#2b1504', fontWeight: 700 }}
              >
                {musicModalMode === 'create' ? 'Insert at Cursor ♫' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REORDER PARAGRAPHS MODAL
          ========================================================================= */}
      {reorderModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setReorderModalOpen(false)}>
          <div
            className={styles.modalContent}
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Organize & Reorder Paragraphs ({activeRight.storyParagraphs.length})</h3>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setReorderModalOpen(false)}
              >
                ✕ Close
              </button>
            </div>

            <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {activeRight.storyParagraphs.map((para, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--admin-gold-primary)', minWidth: '32px', fontSize: '0.80rem' }}>
                    P{idx + 1}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      fontSize: '0.84rem',
                      color: 'var(--admin-text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={para}
                  >
                    {para || <em style={{ color: 'var(--admin-text-subtle)' }}>(Empty paragraph)</em>}
                  </div>
                  <button
                    type="button"
                    className={styles.toolbarBtn}
                    style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                    disabled={idx === 0}
                    onClick={() => handleMoveParagraph(idx, -1)}
                    title="Move paragraph up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className={styles.toolbarBtn}
                    style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                    disabled={idx === activeRight.storyParagraphs.length - 1}
                    onClick={() => handleMoveParagraph(idx, 1)}
                    title="Move paragraph down"
                  >
                    ▼
                  </button>
                  {activeRight.storyParagraphs.length > 1 && (
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--admin-danger)',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        fontSize: '0.86rem',
                      }}
                      onClick={() => handleDeleteParagraphFromList(idx)}
                      title="Delete paragraph"
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={handleMergeParagraphs}
                title="Merge all paragraphs into a single paragraph"
              >
                Merge All into One
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setReorderModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MEDIA PICKER MODAL (FOR LEFT PAGE STICKERS & MEMORIES)
          ========================================================================= */}
      {showMediaPicker && (
        <div className={styles.modalBackdrop} onClick={() => setShowMediaPicker(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Select Sticker or Animated GIF</h3>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowMediaPicker(false)}
              >
                ✕ Close
              </button>
            </div>
            <div className={styles.modalBody}>
              <MediaLibrary isPickerMode onSelectMedia={handleSelectMediaForSticker} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
