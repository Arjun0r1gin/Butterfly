/**
 * BUTTERFLY — useButterflyContent Hook
 * Reactive state management connecting components to content schema, IndexedDB, and localStorage.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ButterflyContent } from './types';
import {
  loadSavedContent,
  loadDraftContent,
  saveContent,
  saveDraftContent,
  resetToDefaultContent,
  clearDraftContent,
} from './contentStorage';
import { getAllMediaAssets } from './indexedDB';

export function useButterflyContent(enableDrafts = false) {
  const [content, setContent] = useState<ButterflyContent>(() => {
    if (enableDrafts) {
      const draft = loadDraftContent();
      if (draft) return draft;
    }
    return loadSavedContent();
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const draftDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync mediaAssets list from IndexedDB on initial mount
  useEffect(() => {
    getAllMediaAssets()
      .then((assets) => {
        setContent((prev) => ({
          ...prev,
          mediaAssets: assets,
        }));
      })
      .catch((err) => {
        console.warn('[useButterflyContent] Failed to fetch media assets', err);
      });
  }, []);

  // Listen for storage updates across tabs or windows
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ButterflyContent>;
      if (customEvent.detail) {
        setContent(customEvent.detail);
        setHasUnsavedChanges(false);
      }
    };

    window.addEventListener('butterfly_content_updated', handleUpdate);
    return () => window.removeEventListener('butterfly_content_updated', handleUpdate);
  }, []);

  const updateContent = useCallback(
    (updater: (prev: ButterflyContent) => ButterflyContent) => {
      setContent((prev) => {
        const next = updater(prev);
        setHasUnsavedChanges(true);

        if (enableDrafts) {
          if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
          draftDebounceRef.current = setTimeout(() => {
            saveDraftContent(next);
          }, 800);
        }

        return next;
      });
    },
    [enableDrafts]
  );

  const save = useCallback(() => {
    setIsSaving(true);
    const saved = saveContent(content);
    setContent(saved);
    setHasUnsavedChanges(false);
    clearDraftContent();
    setTimeout(() => {
      setIsSaving(false);
    }, 300);
    return saved;
  }, [content]);

  const reset = useCallback(() => {
    const canonical = resetToDefaultContent();
    setContent(canonical);
    setHasUnsavedChanges(false);
    clearDraftContent();
  }, []);

  return {
    content,
    updateContent,
    save,
    reset,
    hasUnsavedChanges,
    isSaving,
    lastSaved: content.lastSaved,
  };
}

