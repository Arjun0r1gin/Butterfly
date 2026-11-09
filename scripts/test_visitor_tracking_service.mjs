import assert from 'assert';

// Mock browser globals
const sessionStorageStore = {};
global.sessionStorage = {
  getItem: (key) => sessionStorageStore[key] || null,
  setItem: (key, val) => {
    sessionStorageStore[key] = String(val);
  },
  removeItem: (key) => {
    delete sessionStorageStore[key];
  },
  clear: () => {
    for (const k in sessionStorageStore) delete sessionStorageStore[k];
  },
};

const localStorageStore = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => {
    localStorageStore[key] = String(val);
  },
  removeItem: (key) => {
    delete localStorageStore[key];
  },
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  screen: { width: 1920, height: 1080 },
};

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    language: 'en-US',
    maxTouchPoints: 0,
    sendBeacon: null,
  },
  configurable: true,
});

global.performance = {
  now: () => Date.now(),
};

// Import visitorTracking functions
import {
  recordEventIn,
  recordEventOut,
  getTrackingEndpoint,
  setTrackingEndpoint,
  getSessionTrackingStatus,
  DEFAULT_TRACKING_ENDPOINT,
} from '../src/services/tracking/visitorTracking.ts';

console.log('--> Testing Visitor Tracking 5-Stage Architecture & Flag Reliability:');

// Test 1: When endpoint is placeholder, recordEventIn does NOT set tracked flag
sessionStorage.clear();
const initialInSuccess = await recordEventIn();
assert.strictEqual(initialInSuccess, false, 'Expected recordEventIn to return false when endpoint is placeholder');
assert.strictEqual(sessionStorage.getItem('butterfly_tracking_in_tracked'), null, 'sessionStorage flag must NOT be set when endpoint is placeholder');
console.log('  [PASS] 1. Failed/placeholder dispatch does not leave stale "in_tracked: true" in sessionStorage.');

// Test 2: Configuring a mock endpoint and simulating successful server ingestion
let fetchCalls = [];
global.fetch = async (url, opts) => {
  fetchCalls.push({ url, opts });
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'ok',
      eventId: 'evt_test_123',
      serverTimestamp: '2026-11-09T21:00:00.000+05:30',
    }),
  };
};

setTrackingEndpoint('https://script.google.com/macros/s/AKfyc_MOCK_TEST_ENDPOINT/exec');
assert.strictEqual(getTrackingEndpoint(), 'https://script.google.com/macros/s/AKfyc_MOCK_TEST_ENDPOINT/exec');

// Dispatch IN with mock server
const confirmedInSuccess = await recordEventIn();
assert.strictEqual(confirmedInSuccess, true, 'Expected recordEventIn to succeed with valid server ingestion');
assert.strictEqual(fetchCalls.length, 1, 'Expected fetch to be called exactly once');
assert.strictEqual(fetchCalls[0].opts.method, 'POST');
assert.strictEqual(sessionStorage.getItem('butterfly_tracking_in_tracked'), 'true', 'Flag must be set ONLY upon confirmed server ingestion');
console.log('  [PASS] 2. Flag is set to "true" only when Apps Script server ingestion is confirmed.');

// Test 3: Subsequent IN calls return early without calling fetch again
const duplicateInCall = await recordEventIn();
assert.strictEqual(duplicateInCall, false, 'Duplicate IN call must return early');
assert.strictEqual(fetchCalls.length, 1, 'Duplicate call must NOT make a second network request');
console.log('  [PASS] 3. Subsequent IN calls return early when already tracked in session.');

// Test 4: OUT event records elapsed time and confirms ingestion
const confirmedOutSuccess = await recordEventOut();
assert.strictEqual(confirmedOutSuccess, true, 'Expected recordEventOut to succeed');
assert.strictEqual(fetchCalls.length, 2, 'Expected fetch to be called for OUT');
const outPayload = JSON.parse(fetchCalls[1].opts.body);
assert.strictEqual(outPayload.eventType, 'OUT');
assert.strictEqual(sessionStorage.getItem('butterfly_tracking_out_tracked'), 'true');
assert.ok(typeof outPayload.elapsedTime === 'number');
console.log('  [PASS] 4. OUT event accurately calculates elapsed time and updates session flag upon server confirmation.');

// Test 5: Verify status helper
const status = getSessionTrackingStatus();
assert.strictEqual(status.hasOpenedEnvelope, true);
assert.strictEqual(status.hasClickedYes, true);
assert.ok(status.visitId.startsWith('vis_'));
console.log('  [PASS] 5. Session tracking status reports correct confirmed state.');

console.log('✓ All 5 tracking service tests passed successfully!');
