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

// Placeholder Default Endpoint (Configurable in Local Admin Panel or .env)
export const DEFAULT_TRACKING_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbx_PLACEHOLDER_ENDPOINT_URL/exec';

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

/**
 * Dispatches a tracking payload asynchronously without awaiting or blocking
 */
function sendPayload(payload: TrackingPayload): void {
  const endpoint = getTrackingEndpoint();
  const jsonString = JSON.stringify(payload);

  // If endpoint is a placeholder, log for developer debugging and return
  if (endpoint.includes('AKfycbx_PLACEHOLDER_ENDPOINT_URL')) {
    console.debug('[VisitorTracking] Event recorded (Endpoint is placeholder):', payload.eventType, payload);
    return;
  }

  try {
    // 1. Try navigator.sendBeacon first (ideal for non-blocking asynchronous transmission)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([jsonString], { type: 'text/plain;charset=UTF-8' });
      const queued = navigator.sendBeacon(endpoint, blob);
      if (queued) {
        return;
      }
    }

    // 2. Fallback to fetch with keepalive: true and mode: 'no-cors'
    fetch(endpoint, {
      method: 'POST',
      body: jsonString,
      mode: 'no-cors',
      keepalive: true,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
    }).catch(() => {
      // Store in retry queue for later flush
      queueForRetry(payload);
    });
  } catch {
    queueForRetry(payload);
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
      sendPayload(payload);
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
 */
export function recordEventIn(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Duplicate Prevention: only record once per session visit
    if (sessionStorage.getItem(SESSION_IN_TRACKED_KEY) === 'true') {
      return false;
    }

    const now = Date.now();
    sessionStorage.setItem(SESSION_IN_TRACKED_KEY, 'true');
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

    sendPayload(payload);
    flushPendingTrackingQueue();
    return true;
  } catch (err) {
    console.debug('[VisitorTracking] Failed to record IN event:', err);
    return false;
  }
}

/**
 * Records EVENT OUT — YES Button Clicked
 * Called strictly when the visitor clicks the YES button on the proposal.
 * Guarded against duplicate calls within the same visit session.
 */
export function recordEventOut(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Duplicate Prevention: only record once per session visit
    if (sessionStorage.getItem(SESSION_OUT_TRACKED_KEY) === 'true') {
      return false;
    }

    const now = Date.now();
    sessionStorage.setItem(SESSION_OUT_TRACKED_KEY, 'true');

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

    sendPayload(payload);
    flushPendingTrackingQueue();
    return true;
  } catch (err) {
    console.debug('[VisitorTracking] Failed to record OUT event:', err);
    return false;
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

