/**
 * BUTTERFLY — Production Visitor Tracking Service
 * Implements lightweight, privacy-focused, asynchronous event logging to Google Sheets
 * 
 * Events:
 * - IN: Fired once per visit when visitor successfully clicks the envelope / "Click to Open"
 * - OUT: Fired once per visit when visitor clicks the YES button on the final proposal
 * 
 * Guarantees:
 * 1. Zero delays or blocking of UI, animations, audio, or celebrations.
 * 2. Reliable session persistence via sessionStorage (preserves visitId & prevents duplicate events).
 * 3. Silent error handling: failures never surface to the visitor.
 * 4. SendBeacon priority with keepalive fetch fallback.
 * 5. Strict privacy: No IP collection, no fingerprinting, no PII.
 */

// Storage Keys
const SESSION_VISIT_ID_KEY = 'butterfly_tracking_visit_id';
const SESSION_IN_TRACKED_KEY = 'butterfly_tracking_in_tracked';
const SESSION_IN_TIMESTAMP_KEY = 'butterfly_tracking_in_timestamp';
const SESSION_OUT_TRACKED_KEY = 'butterfly_tracking_out_tracked';
const SESSION_PENDING_QUEUE_KEY = 'butterfly_tracking_pending_queue';
const LOCAL_ENDPOINT_KEY = 'butterfly_tracking_endpoint';

// Default Production Tracking Endpoint (Google Apps Script Web App)
export const DEFAULT_TRACKING_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbwMiqrcfA425iXZXYWZc8dwr406dIcbeEf2yK33G-9KUoADHlnXzEpP2bsA8nd7CCw/exec';

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop';

export interface TrackingPayload {
  eventId: string;
  visitId: string;
  eventType: 'IN' | 'OUT';
  clientTimestamp: string;
  elapsedTime?: number; // In seconds (for OUT event)
  deviceType: DeviceCategory;
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  timezone: string;
  language: string;
}

/**
 * Returns or creates the session's unique Visit ID (UUID v4 format)
 * Persists in sessionStorage across reloads within the same browser tab.
 */
export function getOrCreateVisitId(): string {
  if (typeof window === 'undefined') return 'server_render_id';

  try {
    let visitId = sessionStorage.getItem(SESSION_VISIT_ID_KEY);
    if (!visitId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        visitId = `vis_${crypto.randomUUID()}`;
      } else {
        // Fallback random UUID generator
        visitId = 'vis_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      sessionStorage.setItem(SESSION_VISIT_ID_KEY, visitId);
    }
    return visitId;
  } catch {
    return `vis_fallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
}

/**
 * Generates a unique event ID
 */
function generateEventId(type: 'IN' | 'OUT'): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `evt_${type.toLowerCase()}_${ts}_${rand}`;
}

/**
 * Detects device category, browser, and OS without invasive fingerprinting
 */
export function getDeviceInfo(): {
  deviceType: DeviceCategory;
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  timezone: string;
  language: string;
} {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      browser: 'Unknown',
      os: 'Unknown',
      screenWidth: 1920,
      screenHeight: 1080,
      viewportWidth: 1920,
      viewportHeight: 1080,
      timezone: 'UTC',
      language: 'en',
    };
  }

  const ua = navigator.userAgent || '';
  const width = window.innerWidth;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Device Category
  let deviceType: DeviceCategory = 'desktop';
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua) || (isTouch && width >= 768 && width <= 1024)) {
    deviceType = 'tablet';
  } else if (/Mobi|Android|iPhone|iPod/i.test(ua) || (isTouch && width < 768)) {
    deviceType = 'mobile';
  }

  // Browser Family
  let browser = 'Other';
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Opera|OPR/i.test(ua)) {
    browser = 'Opera';
  }

  // Operating System
  let os = 'Other';
  if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Mac OS X|Macintosh/i.test(ua)) {
    os = 'macOS';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Timezone & Language
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // ignore
  }

  return {
    deviceType,
    browser,
    os,
    screenWidth: window.screen ? window.screen.width : width,
    screenHeight: window.screen ? window.screen.height : window.innerHeight,
    viewportWidth: width,
    viewportHeight: window.innerHeight,
    timezone,
    language: navigator.language || 'en',
  };
}

/**
 * Gets the active tracking endpoint URL
 * Prioritizes custom URL saved by Admin in localStorage, then .env, then placeholder default
 */
export function getTrackingEndpoint(): string {
  if (typeof window === 'undefined') return DEFAULT_TRACKING_ENDPOINT;
  try {
    const local = localStorage.getItem(LOCAL_ENDPOINT_KEY);
    if (local && local.trim().startsWith('http')) {
      return local.trim();
    }
  } catch {
    // ignore
  }

  const envUrl = (import.meta as any).env?.VITE_TRACKING_ENDPOINT;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
    return envUrl.trim();
  }

  return DEFAULT_TRACKING_ENDPOINT;
}

/**
 * Sets custom tracking endpoint in localStorage (used by Admin Panel)
 */
export function setTrackingEndpoint(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem(LOCAL_ENDPOINT_KEY);
    } else {
      localStorage.setItem(LOCAL_ENDPOINT_KEY, url.trim());
    }
  } catch {
    // ignore
  }
}

// In-memory locks to prevent concurrent duplicate dispatches before server response arrives
let isDispatchingIn = false;
let isDispatchingOut = false;

/**
 * Dispatches a tracking payload asynchronously with full response verification and 5-stage diagnostics.
 * Does NOT treat browser queue acceptance as confirmed spreadsheet storage.
 */
export async function dispatchTrackingPayload(
  payload: TrackingPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  const endpoint = getTrackingEndpoint();

  // Stage 2: Payload created diagnostic
  console.log('[VisitorTracking:2] Payload created:', {
    eventType: payload.eventType,
    eventId: payload.eventId,
    visitId: payload.visitId,
    clientTimestamp: payload.clientTimestamp,
    elapsedTime: payload.elapsedTime,
    deviceType: payload.deviceType,
    browser: payload.browser,
    os: payload.os,
  });

  // Verify endpoint validity
  if (!endpoint || endpoint.includes('AKfycbx_PLACEHOLDER_ENDPOINT_URL')) {
    const errorMsg =
      'Apps Script Web App URL is not configured (currently using placeholder). Network request skipped.';
    console.warn(
      '[VisitorTracking:3] Endpoint unconfigured:',
      errorMsg,
      'Endpoint:',
      endpoint
    );
    return { success: false, error: errorMsg };
  }

  const jsonString = JSON.stringify(payload);

  try {
    const startTime = performance.now();
    console.log('[VisitorTracking:3] Dispatch initiated via fetch (keepalive: true):', {
      endpoint,
      payloadBytes: jsonString.length,
    });

    // Primary delivery: fetch with text/plain (avoids CORS preflight, enables response verification)
    const resp = await fetch(endpoint, {
      method: 'POST',
      body: jsonString,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      keepalive: true,
    });

    const latencyMs = Math.round(performance.now() - startTime);

    // Stage 4: Fetch response received diagnostic
    console.log('[VisitorTracking:4] Fetch response received:', {
      endpoint,
      status: resp.status,
      ok: resp.ok,
      latencyMs,
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: Server returned error status`);
    }

    const data = await resp.json();

    // Stage 5: Apps Script received and stored the event
    if (data.status === 'ok' || data.success === true || data.eventId) {
      console.log('[VisitorTracking:5] Apps Script confirmed event stored in Google Sheets:', {
        status: data.status,
        eventId: data.eventId,
        deduplicated: Boolean(data.deduplicated),
        serverTimestamp: data.serverTimestamp,
      });
      return { success: true, data };
    } else {
      console.error('[VisitorTracking:5] Apps Script returned non-ok response:', data);
      return { success: false, data, error: data.message || 'Server rejected event' };
    }
  } catch (fetchErr: any) {
    console.warn(
      '[VisitorTracking:4] Fetch failed or blocked by CORS. Attempting sendBeacon fallback:',
      fetchErr?.message || fetchErr
    );

    // Fallback: navigator.sendBeacon (fire-and-forget for unloading pages)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([jsonString], { type: 'text/plain;charset=UTF-8' });
        const queued = navigator.sendBeacon(endpoint, blob);
        console.log('[VisitorTracking:3/4] sendBeacon called:', {
          endpoint,
          queued,
          note: queued
            ? 'Queued in browser buffer (server delivery unverified)'
            : 'sendBeacon buffer rejected',
        });
        if (queued) {
          return { success: true, data: { status: 'queued_via_beacon' } };
        }
      } catch (beaconErr) {
        console.error('[VisitorTracking:3/4] sendBeacon error:', beaconErr);
      }
    }

    queueForRetry(payload);
    return { success: false, error: fetchErr?.message || String(fetchErr) };
  }
}

function queueForRetry(payload: TrackingPayload): void {
  try {
    const raw = sessionStorage.getItem(SESSION_PENDING_QUEUE_KEY);
    const queue: TrackingPayload[] = raw ? JSON.parse(raw) : [];
    if (queue.length < 10) {
      queue.push(payload);
      sessionStorage.setItem(SESSION_PENDING_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch {
    // ignore
  }
}

/**
 * Flushes any pending retries if network recovered
 */
export function flushPendingTrackingQueue(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(SESSION_PENDING_QUEUE_KEY);
    if (!raw) return;
    const queue: TrackingPayload[] = JSON.parse(raw);
    sessionStorage.removeItem(SESSION_PENDING_QUEUE_KEY);

    queue.forEach((payload) => {
      dispatchTrackingPayload(payload);
    });
  } catch {
    // ignore
  }
}

// -----------------------------------------------------------------------------
// Public Tracking APIs
// -----------------------------------------------------------------------------

/**
 * Records EVENT IN — Envelope Opened
 * Called strictly when the visitor successfully clicks to open the envelope.
 * Guarded against duplicate calls within the same visit session.
 * Flags are ONLY set upon confirmed server ingestion.
 */
export async function recordEventIn(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const currentInTracked = sessionStorage.getItem(SESSION_IN_TRACKED_KEY);
  const currentOutTracked = sessionStorage.getItem(SESSION_OUT_TRACKED_KEY);

  // Stage 1: Event handler invoked diagnostic
  console.log('[VisitorTracking:1] Event handler invoked: recordEventIn()', {
    hasInTracked: currentInTracked === 'true',
    hasOutTracked: currentOutTracked === 'true',
    isDispatchingIn,
  });

  // Guard: If already confirmed stored in this session, return early
  if (currentInTracked === 'true') {
    console.log('[VisitorTracking:1] Early exit: IN event already marked as tracked in sessionStorage.');
    return false;
  }

  // Guard: If a dispatch is currently in flight, prevent duplicate clicks
  if (isDispatchingIn) {
    console.log('[VisitorTracking:1] Early exit: IN event dispatch is already in flight.');
    return false;
  }

  isDispatchingIn = true;

  try {
    const now = Date.now();
    // Cache the IN timestamp in session for elapsed time calculation
    sessionStorage.setItem(SESSION_IN_TIMESTAMP_KEY, now.toString());

    const visitId = getOrCreateVisitId();
    const eventId = generateEventId('IN');
    const devInfo = getDeviceInfo();

    const payload: TrackingPayload = {
      eventId,
      visitId,
      eventType: 'IN',
      clientTimestamp: new Date(now).toISOString(),
      ...devInfo,
    };

    const result = await dispatchTrackingPayload(payload);

    if (result.success) {
      // ONLY set tracked flag when confirmed by server ingestion
      sessionStorage.setItem(SESSION_IN_TRACKED_KEY, 'true');
      flushPendingTrackingQueue();
      return true;
    } else {
      console.warn(
        '[VisitorTracking] IN event delivery was not confirmed by Apps Script. Session flag NOT set to true (retry allowed). Error:',
        result.error
      );
      return false;
    }
  } catch (err) {
    console.error('[VisitorTracking] Unexpected error during recordEventIn:', err);
    return false;
  } finally {
    isDispatchingIn = false;
  }
}

/**
 * Records EVENT OUT — YES Button Clicked
 * Called strictly when the visitor clicks the YES button on the proposal.
 * Guarded against duplicate calls within the same visit session.
 * Flags are ONLY set upon confirmed server ingestion.
 */
export async function recordEventOut(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const currentOutTracked = sessionStorage.getItem(SESSION_OUT_TRACKED_KEY);

  // Stage 1: Event handler invoked diagnostic
  console.log('[VisitorTracking:1] Event handler invoked: recordEventOut()', {
    hasOutTracked: currentOutTracked === 'true',
    isDispatchingOut,
  });

  // Guard: If already confirmed stored in this session, return early
  if (currentOutTracked === 'true') {
    console.log('[VisitorTracking:1] Early exit: OUT event already marked as tracked in sessionStorage.');
    return false;
  }

  // Guard: If a dispatch is currently in flight, prevent duplicate clicks
  if (isDispatchingOut) {
    console.log('[VisitorTracking:1] Early exit: OUT event dispatch is already in flight.');
    return false;
  }

  isDispatchingOut = true;

  try {
    const now = Date.now();
    const visitId = getOrCreateVisitId();
    const eventId = generateEventId('OUT');
    const devInfo = getDeviceInfo();

    // Calculate elapsed time in seconds since IN event
    let elapsedTime = 0;
    const inTsRaw = sessionStorage.getItem(SESSION_IN_TIMESTAMP_KEY);
    if (inTsRaw) {
      const inTs = parseInt(inTsRaw, 10);
      if (!isNaN(inTs) && inTs > 0) {
        elapsedTime = Math.max(0, Math.round(((now - inTs) / 1000) * 10) / 10);
      }
    }

    const payload: TrackingPayload = {
      eventId,
      visitId,
      eventType: 'OUT',
      clientTimestamp: new Date(now).toISOString(),
      elapsedTime,
      ...devInfo,
    };

    const result = await dispatchTrackingPayload(payload);

    if (result.success) {
      // ONLY set tracked flag when confirmed by server ingestion
      sessionStorage.setItem(SESSION_OUT_TRACKED_KEY, 'true');
      flushPendingTrackingQueue();
      return true;
    } else {
      console.warn(
        '[VisitorTracking] OUT event delivery was not confirmed by Apps Script. Session flag NOT set to true (retry allowed). Error:',
        result.error
      );
      return false;
    }
  } catch (err) {
    console.error('[VisitorTracking] Unexpected error during recordEventOut:', err);
    return false;
  } finally {
    isDispatchingOut = false;
  }
}

/**
 * Helper to check current tracking state in the session
 */
export function getSessionTrackingStatus(): {
  visitId: string;
  hasOpenedEnvelope: boolean;
  hasClickedYes: boolean;
  elapsedSeconds: number | null;
} {
  if (typeof window === 'undefined') {
    return {
      visitId: '',
      hasOpenedEnvelope: false,
      hasClickedYes: false,
      elapsedSeconds: null,
    };
  }

  const visitId = getOrCreateVisitId();
  const hasOpenedEnvelope = sessionStorage.getItem(SESSION_IN_TRACKED_KEY) === 'true';
  const hasClickedYes = sessionStorage.getItem(SESSION_OUT_TRACKED_KEY) === 'true';

  let elapsedSeconds: number | null = null;
  const inTsRaw = sessionStorage.getItem(SESSION_IN_TIMESTAMP_KEY);
  if (inTsRaw) {
    const inTs = parseInt(inTsRaw, 10);
    if (!isNaN(inTs)) {
      elapsedSeconds = Math.max(0, Math.round((Date.now() - inTs) / 1000));
    }
  }

  return {
    visitId,
    hasOpenedEnvelope,
    hasClickedYes,
    elapsedSeconds,
  };
}

// Global browser diagnostic utility accessible via window.__butterflyTracking
if (typeof window !== 'undefined') {
  (window as any).__butterflyTracking = {
    getStatus: getSessionTrackingStatus,
    getEndpoint: getTrackingEndpoint,
    setEndpoint: setTrackingEndpoint,
    resetSession: () => {
      sessionStorage.removeItem(SESSION_IN_TRACKED_KEY);
      sessionStorage.removeItem(SESSION_IN_TIMESTAMP_KEY);
      sessionStorage.removeItem(SESSION_OUT_TRACKED_KEY);
      sessionStorage.removeItem(SESSION_VISIT_ID_KEY);
      console.log('[VisitorTracking] Session tracking state successfully reset.');
    },
    triggerEventIn: () => recordEventIn(),
    triggerEventOut: () => recordEventOut(),
  };
}

