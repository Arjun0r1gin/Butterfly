/**
 * BUTTERFLY — Global Scrapbook Audio Player Engine
 * Controls playback for inline scrapbook music markers and floating "Now Playing" UI.
 * Handles lazy on-demand streaming, timestamp trimming (start/end), looping,
 * single-track exclusivity (stops previous song on new selection), and mobile interaction.
 */

import { getAudioUrl, getAudioTrack, type AudioTrack } from './audioDB';
import type { MusicMarker } from '../content/types';
import { assetUrl } from '../../utils/assets';

export interface AudioPlayerState {
  activeMarkerId: string | null;
  activeTrackId: string | null;
  title: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loop: boolean;
  anchorPosition?: { x: number; y: number }; // Screen coordinate for floating pill
}

type StateListener = (state: AudioPlayerState) => void;

class ScrapbookAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentMarker: MusicMarker | null = null;
  private currentTrack: AudioTrack | null = null;
  private listeners = new Set<StateListener>();

  private state: AudioPlayerState = {
    activeMarkerId: null,
    activeTrackId: null,
    title: '',
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    loop: false,
    anchorPosition: undefined,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'none';

    this.audio.addEventListener('play', () => {
      this.updateState({ isPlaying: true });
    });

    this.audio.addEventListener('pause', () => {
      this.updateState({ isPlaying: false });
    });

    this.audio.addEventListener('ended', () => {
      if (!this.state.loop) {
        this.updateState({ isPlaying: false, currentTime: 0 });
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return;
      const cur = this.audio.currentTime;

      // Handle custom end timestamp
      if (this.currentMarker?.endTime && cur >= this.currentMarker.endTime) {
        if (this.currentMarker.loop) {
          this.audio.currentTime = this.currentMarker.startTime || 0;
        } else {
          this.audio.pause();
          this.audio.currentTime = this.currentMarker.startTime || 0;
          this.updateState({ isPlaying: false, currentTime: this.audio.currentTime });
          return;
        }
      }

      this.updateState({ currentTime: cur, duration: this.audio.duration || 0 });
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('[AudioPlayer] Audio playback error', e);
      this.updateState({ isPlaying: false });
    });
  }

  public getState(): AudioPlayerState {
    return { ...this.state };
  }

  public getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('butterfly_audio_state_change', { detail: s }));
    }
  }

  private updateState(partial: Partial<AudioPlayerState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Plays or toggles a music marker
   */
  public async playMarker(
    marker: MusicMarker,
    screenPos?: { x: number; y: number }
  ): Promise<void> {
    this.initAudioElement();
    if (!this.audio) return;

    // Toggle if clicking the currently active marker
    if (this.state.activeMarkerId === marker.id) {
      if (this.state.isPlaying) {
        this.pause();
      } else {
        await this.resume();
      }
      if (screenPos) {
        this.updateState({ anchorPosition: screenPos });
      }
      return;
    }

    // Stop current track before switching
    this.stopInternal();

    this.currentMarker = marker;

    // Fetch track metadata and URL
    const track = await getAudioTrack(marker.trackId);
    this.currentTrack = track;

    // Title resolution: marker title override > track name > default fallback
    const title = marker.title || track?.name || 'Our Storybook Melody ♡';

    let url: string | null = null;
    if (track) {
      url = await getAudioUrl(track.id);
    }

    // Fallback: Check if trackId is a direct asset URL or canonical sample
    if (!url) {
      if (marker.trackId && (marker.trackId.startsWith('/') || marker.trackId.startsWith('http'))) {
        url = marker.trackId;
      } else if (marker.trackId === 'sample_our_evening' || marker.trackId === 'm_whispering_garden') {
        url = assetUrl('/storybook/assets/our_evening_melody.mp3');
      } else if (marker.trackId) {
        url = await getAudioUrl(marker.trackId);
      }
    }

    // Ultimate fallback if trackId was empty or unresolved
    if (!url) {
      url =
        (await getAudioUrl('track_remo_first_sight')) ||
        assetUrl('/storybook/assets/our_evening_melody.mp3');
    }

    const resolvedUrl = assetUrl(url);
    if (!resolvedUrl) {
      console.warn(`[AudioPlayer] Could not resolve audio URL for track ${marker.trackId}`);
      return;
    }

    this.audio.src = resolvedUrl;
    this.audio.loop = marker.loop !== false;
    this.audio.volume = 1.0;
    this.audio.muted = false;

    const start = marker.startTime || 0;
    this.audio.currentTime = start;

    this.updateState({
      activeMarkerId: marker.id,
      activeTrackId: marker.trackId,
      title,
      isPlaying: true,
      currentTime: start,
      duration: track?.duration || 0,
      loop: marker.loop !== false,
      anchorPosition: screenPos || this.state.anchorPosition,
    });

    try {
      await this.audio.play();
    } catch (err) {
      console.warn('[AudioPlayer] Playback was prevented by browser policy', err);
      this.updateState({ isPlaying: false });
    }
  }

  public async resume(): Promise<void> {
    if (this.audio && this.audio.src) {
      this.audio.volume = 1.0;
      this.audio.muted = false;
      try {
        await this.audio.play();
        this.updateState({ isPlaying: true });
      } catch (err) {
        console.warn('[AudioPlayer] Resume failed', err);
      }
    }
  }

  public pause(): void {
    if (this.audio) {
      this.audio.pause();
      this.updateState({ isPlaying: false });
    }
  }

  public toggle(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  private stopInternal() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  public stop(): void {
    this.stopInternal();
    this.currentMarker = null;
    this.currentTrack = null;
    this.updateState({
      activeMarkerId: null,
      activeTrackId: null,
      title: '',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      anchorPosition: undefined,
    });
  }

  public updateAnchorPosition(pos: { x: number; y: number } | undefined) {
    this.updateState({ anchorPosition: pos });
  }
}

// Global singleton instance
export const audioPlayer = new ScrapbookAudioPlayer();
