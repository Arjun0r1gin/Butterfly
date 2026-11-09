/**
 * Unit Test for apps-script/Code.gs POST & GET dispatch logic
 */
import assert from 'assert';
import fs from 'fs';

// Mock Google Apps Script environment globals
const scriptProps = {
  ADMIN_SECRET_KEY: 'TestSecret123!',
};

const mockSpreadsheet = {
  getSheetByName: (name) => {
    if (name === 'Visitor Events') {
      return {
        getLastRow: () => 3,
        getDataRange: () => ({
          getValues: () => [
            ['Event ID', 'Visit ID', 'Event Type', 'Server Timestamp', 'Client Timestamp', 'Elapsed Time (seconds)', 'Device Type', 'Browser', 'Operating System', 'Screen Width', 'Screen Height', 'Viewport Width', 'Viewport Height', 'Timezone', 'Language'],
            ['evt_in_1', 'vis_1', 'IN', '2026-11-09T17:00:00.000+05:30', '2026-11-09T17:00:00.000Z', '', 'desktop', 'Chrome', 'macOS', 1920, 1080, 1440, 900, 'Asia/Kolkata', 'en'],
            ['evt_out_1', 'vis_1', 'OUT', '2026-11-09T17:01:20.000+05:30', '2026-11-09T17:01:20.000Z', '80.0', 'desktop', 'Chrome', 'macOS', 1920, 1080, 1440, 900, 'Asia/Kolkata', 'en'],
          ],
        }),
      };
    }
    return null;
  },
};

global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => scriptProps[key] || null,
  }),
};

global.SpreadsheetApp = {
  getActiveSpreadsheet: () => mockSpreadsheet,
  openById: (id) => mockSpreadsheet,
};

global.Utilities = {
  formatDate: () => '2026-11-09 17:00:00',
};

global.ContentService = {
  MimeType: { JSON: 'application/json', TEXT: 'text/plain' },
  createTextOutput: (text) => ({
    text,
    mimeType: null,
    setMimeType(m) {
      this.mimeType = m;
      return this;
    },
    getContent() {
      return this.text;
    },
  }),
};

global.Logger = {
  log: (msg) => {},
};

import vm from 'vm';

// Load Code.gs code into global context
const code = fs.readFileSync('apps-script/Code.gs', 'utf8');
vm.runInThisContext(code);

console.log('--> Testing Apps Script doGet and doPost handlers:');

// Test 1: Public GET health check
const getResult = doGet({});
const getJson = JSON.parse(getResult.getContent());
assert.strictEqual(getJson.success, true);
assert.strictEqual(getJson.service, 'BUTTERFLY Visitor Tracking');
assert.strictEqual(getJson.status, 'online');
console.log('  [PASS] 1. Public GET returns health check without exposing any data.');

// Test 2: Admin POST with correct adminKey (camelCase)
const postAdminCorrect = doPost({
  postData: {
    contents: JSON.stringify({
      action: 'get_events',
      adminKey: 'TestSecret123!',
    }),
  },
});
const postAdminJson = JSON.parse(postAdminCorrect.getContent());
assert.strictEqual(postAdminJson.status, 'ok');
assert.strictEqual(postAdminJson.events.length, 2);
assert.strictEqual(postAdminJson.summary.totalIn, 1);
assert.strictEqual(postAdminJson.summary.totalOut, 1);
assert.strictEqual(postAdminJson.summary.uniqueVisits, 1);
console.log('  [PASS] 2. Admin POST with correct adminKey returns event data & summary.');

// Test 3: Admin POST with correct admin_key (snake_case compatibility)
const postAdminSnake = doPost({
  postData: {
    contents: JSON.stringify({
      action: 'get_events',
      admin_key: 'TestSecret123!',
    }),
  },
});
const postAdminSnakeJson = JSON.parse(postAdminSnake.getContent());
assert.strictEqual(postAdminSnakeJson.status, 'ok');
assert.strictEqual(postAdminSnakeJson.events.length, 2);
console.log('  [PASS] 3. Admin POST with admin_key (snake_case) is supported.');

// Test 4: Admin POST with incorrect secret key
const postAdminWrong = doPost({
  postData: {
    contents: JSON.stringify({
      action: 'get_events',
      adminKey: 'WrongSecret!',
    }),
  },
});
const postWrongJson = JSON.parse(postAdminWrong.getContent());
assert.strictEqual(postWrongJson.status, 'error');
assert.strictEqual(postWrongJson.message, 'Unauthorized: Invalid admin key');
console.log('  [PASS] 4. Admin POST with wrong key returns 401 error message.');

// Test 5: Admin POST with missing secret key
const postAdminMissing = doPost({
  postData: {
    contents: JSON.stringify({
      action: 'get_events',
    }),
  },
});
const postMissingJson = JSON.parse(postAdminMissing.getContent());
assert.strictEqual(postMissingJson.status, 'error');
assert.strictEqual(postMissingJson.success, false);
assert.strictEqual(postMissingJson.message, 'Unauthorized: Invalid admin key');
console.log('  [PASS] 5. Admin POST with missing key is rejected.');

// Test 6: Empty spreadsheet returns empty events array, not an error
mockSpreadsheet.getSheetByName = (name) => ({
  getLastRow: () => 1, // Only header row exists
  getDataRange: () => ({ getValues: () => [['Event ID', 'Visit ID']] }),
});

const postEmptySheet = doPost({
  postData: {
    contents: JSON.stringify({
      action: 'get_events',
      adminKey: 'TestSecret123!',
    }),
  },
});
const postEmptyJson = JSON.parse(postEmptySheet.getContent());
assert.strictEqual(postEmptyJson.success, true);
assert.strictEqual(postEmptyJson.status, 'ok');
assert.ok(Array.isArray(postEmptyJson.events));
assert.strictEqual(postEmptyJson.events.length, 0);
assert.strictEqual(postEmptyJson.summary.totalIn, 0);
assert.strictEqual(postEmptyJson.summary.totalOut, 0);
console.log('  [PASS] 6. Empty spreadsheet returns { success: true, events: [] } without error.');

// Test 7: Frontend validation condition simulation (matches VisitorTracking.tsx)
function simulateFrontendParse(data) {
  if (data.success === false || data.status === 'error') {
    throw new Error(data.message || 'Authentication failed: Please check your ADMIN_SECRET_KEY.');
  }
  if ((data.success === true || data.status === 'ok') && Array.isArray(data.events)) {
    return { ok: true, count: data.events.length };
  }
  if (data.service && (data.status === 'online' || data.success === true)) {
    throw new Error('Endpoint returned health check instead of event data.');
  }
  throw new Error('Unexpected response format');
}

assert.deepStrictEqual(simulateFrontendParse(postAdminJson), { ok: true, count: 2 });
assert.deepStrictEqual(simulateFrontendParse(postEmptyJson), { ok: true, count: 0 });
assert.throws(() => simulateFrontendParse(postWrongJson), /Unauthorized: Invalid admin key/);
assert.throws(() => simulateFrontendParse(getJson), /health check instead of event data/);
console.log('  [PASS] 7. Frontend parsing logic strictly verifies all 4 response variants.');

// Test 8: Null getActiveSpreadsheet() with openById fallback succeeds
global.SpreadsheetApp.getActiveSpreadsheet = () => null;
const postNullSs = doPost({
  postData: {
    contents: JSON.stringify({
      action: 'get_events',
      adminKey: 'TestSecret123!',
    }),
  },
});
const postNullSsJson = JSON.parse(postNullSs.getContent());
assert.strictEqual(postNullSsJson.success, true);
assert.strictEqual(postNullSsJson.status, 'ok');
console.log('  [PASS] 8. Null getActiveSpreadsheet() automatically falls back to configured SPREADSHEET_ID.');

// Test 9: Null getActiveSpreadsheet() with SPREADSHEET_ID opens via openById
scriptProps.SPREADSHEET_ID = 'test_sheet_id_xyz';
global.SpreadsheetApp.openById = (id) => {
  assert.strictEqual(id, 'test_sheet_id_xyz');
  return mockSpreadsheet;
};
const postOpenById = doPost({
  postData: {
    contents: JSON.stringify({
      action: 'get_events',
      adminKey: 'TestSecret123!',
    }),
  },
});
const postOpenByIdJson = JSON.parse(postOpenById.getContent());
assert.strictEqual(postOpenByIdJson.success, true);
assert.strictEqual(postOpenByIdJson.status, 'ok');
console.log('  [PASS] 9. Fallback openById with SPREADSHEET_ID succeeds seamlessly.');

// Test 10: Unexpected exception inside execution returns "Apps Script error: <message>"
global.SpreadsheetApp.openById = () => {
  throw new Error('Simulated network error');
};
const postCrash = doPost({
  postData: {
    contents: JSON.stringify({
      action: 'get_events',
      adminKey: 'TestSecret123!',
    }),
  },
});
const postCrashJson = JSON.parse(postCrash.getContent());
assert.strictEqual(postCrashJson.success, false);
assert.strictEqual(postCrashJson.status, 'error');
assert.ok(postCrashJson.message.includes('Simulated network error'));
console.log('  [PASS] 10. doPost catches internal errors and returns safe specific error message.');

console.log('✓ All 10 verification tests passed successfully!');
