/**
 * BUTTERFLY — IN/OUT Visitor Tracking Engine
 * Google Apps Script Web App for Private Google Spreadsheet Storage
 * 
 * Features:
 * 1. Anonymous Event Ingestion (doPost) for IN and OUT events.
 * 2. Concurrency-safe row appends via LockService.
 * 3. Authoritative server timestamps (Asia/Kolkata timezone).
 * 4. Strict payload validation and duplicate event ID suppression.
 * 5. Private spreadsheet protection (zero spreadsheet data exposed to anonymous callers).
 * 6. Authenticated Admin Read endpoint (doGet / doPost with adminKey verification).
 * 7. Multi-sheet support: 'Visitor Events', 'Dashboard', 'Visit Details'.
 */

// Timezone configuration (Asia/Kolkata per user requirement)
var TIMEZONE = "Asia/Kolkata";
var SHEET_EVENTS = "Visitor Events";
var SHEET_DASHBOARD = "Dashboard";
var SHEET_VISITS = "Visit Details";
var SPREADSHEET_ID_FALLBACK = "17pQ9M5g5_7Z94bu6vF4ii_rLx3IRLShVqlq6knWDtLg";

/**
 * 1. Anonymous Event Ingestion Endpoint (doPost)
 * Called via navigator.sendBeacon or fetch(..., { mode: 'no-cors' }) from client.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      console.warn("[doPost] Empty payload received");
      return createJsonResponse({ success: false, status: "error", message: "Empty payload" }, 400);
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      console.error("[doPost] JSON parse error: " + (parseErr.message || String(parseErr)));
      return createJsonResponse({ success: false, status: "error", message: "Invalid JSON format: " + (parseErr.message || String(parseErr)) }, 400);
    }

    // Check if this is an Authenticated Admin Request submitted via POST
    var action = (payload.action || "").toString().trim();
    if (action === "get_events") {
      console.log("[doPost] Checkpoint: Admin action 'get_events' recognized.");
      var adminKey = payload.adminKey || payload.admin_key;
      return handleAdminRead(adminKey);
    }

    // Otherwise, process as a Visitor Tracking Event
    console.log("[doPost] Visitor tracking event received: " + (payload.eventType || "unknown"));
    return processTrackingEvent(payload);

  } catch (err) {
    var errorDetails = err.stack || err.message || String(err);
    console.error("[doPost Error] " + errorDetails);
    // Return safe actual error message to client
    return createJsonResponse({
      success: false,
      status: "error",
      message: "Apps Script error: " + (err.message || String(err))
    }, 500);
  }
}

/**
 * 2. Public GET Endpoint — Health Check
 * Safe, unauthenticated endpoint that confirms the web app is online.
 * Never exposes spreadsheet data, IDs, admin credentials, or visitor records.
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      service: "BUTTERFLY Visitor Tracking",
      status: "online"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Validates, deduplicates, and appends incoming IN or OUT events
 */
function processTrackingEvent(data) {
  // A. Validation
  if (!data || typeof data !== "object") {
    return createJsonResponse({ status: "error", message: "Payload must be an object" }, 400);
  }

  var eventType = (data.eventType || "").toString().toUpperCase().trim();
  if (eventType !== "IN" && eventType !== "OUT") {
    return createJsonResponse({ status: "error", message: "Unsupported eventType: must be IN or OUT" }, 400);
  }

  var eventId = sanitizeString(data.eventId, 64);
  var visitId = sanitizeString(data.visitId, 64);

  if (!eventId || !visitId) {
    return createJsonResponse({ status: "error", message: "Missing required eventId or visitId" }, 400);
  }

  // B. Concurrency Locking to prevent race conditions during high visitor bursts
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for concurrent write locks
    lock.waitLock(10000);
  } catch (lockErr) {
    Logger.log("[Lock Timeout] Could not obtain lock: " + lockErr.toString());
    return createJsonResponse({ status: "error", message: "Server busy, please retry" }, 429);
  }

  try {
    var ss = getTargetSpreadsheet();
    var eventsSheet = getOrCreateSheet(ss, SHEET_EVENTS, getEventsHeaders());

    // C. Duplicate Prevention (check last 200 rows for matching eventId)
    if (isDuplicateEventId(eventsSheet, eventId)) {
      Logger.log("[Duplicate Suppressed] eventId already exists: " + eventId);
      return createJsonResponse({ status: "ok", deduplicated: true });
    }

    // D. Assemble authoritative server event record
    var now = new Date();
    var serverTimestamp = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    var clientTimestamp = sanitizeString(data.clientTimestamp, 64) || serverTimestamp;
    var elapsedTime = eventType === "OUT" ? parseNumeric(data.elapsedTime, 0) : "";

    var deviceType = sanitizeString(data.deviceType, 32) || "desktop";
    var browser = sanitizeString(data.browser, 64) || "Unknown";
    var os = sanitizeString(data.os, 64) || "Unknown";
    var screenWidth = parseNumeric(data.screenWidth, "");
    var screenHeight = parseNumeric(data.screenHeight, "");
    var viewportWidth = parseNumeric(data.viewportWidth, "");
    var viewportHeight = parseNumeric(data.viewportHeight, "");
    var timezone = sanitizeString(data.timezone, 64) || TIMEZONE;
    var language = sanitizeString(data.language, 32) || "en";

    var row = [
      eventId,
      visitId,
      eventType,
      serverTimestamp,
      clientTimestamp,
      elapsedTime,
      deviceType,
      browser,
      os,
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      timezone,
      language
    ];

    eventsSheet.appendRow(row);

    // E. Update Visit Details and Dashboard sheets synchronously
    updateVisitDetails(ss, visitId, eventType, serverTimestamp, elapsedTime, deviceType, browser, os);
    updateDashboardSummary(ss);

    // Return minimal confirmation without exposing spreadsheet internals
    return createJsonResponse({ status: "ok", eventId: eventId });

  } finally {
    lock.releaseLock();
  }
}

/**
 * Safely retrieves the target spreadsheet:
 * 1. Checks container-bound active spreadsheet (SpreadsheetApp.getActiveSpreadsheet()).
 * 2. If null (e.g. standalone script or unattached execution context), checks Script Property 'SPREADSHEET_ID' via SpreadsheetApp.openById().
 */
function getTargetSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    console.warn("[getTargetSpreadsheet] getActiveSpreadsheet() exception: " + (e.message || String(e)));
  }

  if (ss) {
    return ss;
  }

  console.warn("[getTargetSpreadsheet] SpreadsheetApp.getActiveSpreadsheet() returned null. Checking SPREADSHEET_ID script property or fallback...");
  var sheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!sheetId || sheetId.trim() === "") {
    sheetId = SPREADSHEET_ID_FALLBACK;
  }

  if (sheetId && sheetId.trim() !== "") {
    try {
      ss = SpreadsheetApp.openById(sheetId.trim());
      console.log("[getTargetSpreadsheet] Successfully opened spreadsheet via ID: " + sheetId.trim());
      return ss;
    } catch (openErr) {
      console.error("[getTargetSpreadsheet] Failed to open spreadsheet by ID: " + (openErr.stack || openErr.message || String(openErr)));
      throw new Error("Unable to open spreadsheet with ID: " + (openErr.message || String(openErr)));
    }
  }

  throw new Error("Spreadsheet inaccessible: SpreadsheetApp.getActiveSpreadsheet() returned null. If this Apps Script project is not container-bound, please add the 'SPREADSHEET_ID' Script Property in Project Settings.");
}

/**
 * Authenticates admin requests against Script Properties and returns spreadsheet event records.
 * Includes explicit diagnostic checkpoints and safe error tracing.
 */
function handleAdminRead(providedKey) {
  try {
    console.log("[handleAdminRead] Checkpoint 1: Action recognized, checking Script Properties for ADMIN_SECRET_KEY...");
    var storedSecret = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET_KEY");

    // Fallback default if not configured yet: warn and require setup
    if (!storedSecret) {
      console.error("[handleAdminRead] ADMIN_SECRET_KEY property is not set in Script Properties.");
      return createJsonResponse({
        success: false,
        status: "error",
        message: "ADMIN_SECRET_KEY property is not set in Apps Script Script Properties."
      }, 401);
    }

    console.log("[handleAdminRead] Checkpoint 2: Verifying admin key credentials...");
    if (!providedKey || providedKey !== storedSecret) {
      console.warn("[handleAdminRead] Checkpoint 2: Authentication failed. Provided key did not match stored secret.");
      return createJsonResponse({
        success: false,
        status: "error",
        message: "Unauthorized: Invalid admin key"
      }, 401);
    }
    console.log("[handleAdminRead] Checkpoint 2: Admin secret verified successfully.");

    console.log("[handleAdminRead] Checkpoint 3: Opening target spreadsheet...");
    var ss = getTargetSpreadsheet();
    console.log("[handleAdminRead] Checkpoint 3: Target spreadsheet opened successfully.");

    console.log("[handleAdminRead] Checkpoint 4: Looking up sheet '" + SHEET_EVENTS + "'...");
    var eventsSheet = ss.getSheetByName(SHEET_EVENTS);
    var eventsData = [];

    if (!eventsSheet) {
      console.warn("[handleAdminRead] Checkpoint 4: Sheet '" + SHEET_EVENTS + "' does not exist in spreadsheet. Returning empty dataset.");
    } else {
      var lastRow = eventsSheet.getLastRow();
      console.log("[handleAdminRead] Checkpoint 4: Sheet '" + SHEET_EVENTS + "' found. Total rows: " + lastRow + ".");

      if (lastRow > 1) {
        console.log("[handleAdminRead] Checkpoint 5: Reading data rows from range...");
        var rawValues = eventsSheet.getDataRange().getValues();
        var headers = rawValues[0];
        console.log("[handleAdminRead] Checkpoint 5: Read " + rawValues.length + " total rows (including header). Column count: " + headers.length + ".");

        console.log("[handleAdminRead] Checkpoint 6: Constructing events array from raw sheet rows...");
        for (var r = 1; r < rawValues.length; r++) {
          var row = rawValues[r];
          var item = {};
          for (var c = 0; c < headers.length; c++) {
            var rawHeader = headers[c];
            if (rawHeader !== null && rawHeader !== undefined && String(rawHeader).trim() !== "") {
              var key = toCamelCase(rawHeader);
              if (key) {
                item[key] = row[c];
              }
            }
          }
          eventsData.push(item);
        }
        console.log("[handleAdminRead] Checkpoint 6: Constructed " + eventsData.length + " event records.");
      } else {
        console.log("[handleAdminRead] Checkpoints 5 & 6: Sheet has header row only (0 event rows).");
      }
    }

    // Calculate summary metrics on the fly
    var totalIn = 0;
    var totalOut = 0;
    var uniqueVisits = {};
    var totalDuration = 0;
    var completedVisits = 0;

    for (var i = 0; i < eventsData.length; i++) {
      var ev = eventsData[i];
      uniqueVisits[ev.visitId] = uniqueVisits[ev.visitId] || { in: null, out: null };
      if (ev.eventType === "IN") {
        totalIn++;
        uniqueVisits[ev.visitId].in = ev;
      } else if (ev.eventType === "OUT") {
        totalOut++;
        uniqueVisits[ev.visitId].out = ev;
        var elap = parseFloat(ev.elapsedTime);
        if (!isNaN(elap) && elap > 0) {
          totalDuration += elap;
          completedVisits++;
        }
      }
    }

    var uniqueCount = Object.keys(uniqueVisits).length;
    var conversionRate = uniqueCount > 0 ? ((totalOut / uniqueCount) * 100).toFixed(1) : "0.0";
    var avgDurationSec = completedVisits > 0 ? (totalDuration / completedVisits).toFixed(1) : "0.0";

    console.log("[handleAdminRead] Returning success response with " + eventsData.length + " events.");
    return createJsonResponse({
      success: true,
      status: "ok",
      summary: {
        totalIn: totalIn,
        totalOut: totalOut,
        uniqueVisits: uniqueCount,
        abandonedVisits: Math.max(0, uniqueCount - totalOut),
        conversionRatePercent: conversionRate,
        averageDurationSeconds: avgDurationSec,
        lastUpdated: Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss")
      },
      events: eventsData
    });

  } catch (adminErr) {
    var errString = adminErr.stack || adminErr.message || String(adminErr);
    console.error("[handleAdminRead Error] " + errString);
    throw adminErr; // Propagate to doPost catch block for authoritative error handling
  }
}

/**
 * Updates the Visit Details sheet: groups events by Visit ID
 */
function updateVisitDetails(ss, visitId, eventType, timestamp, elapsedTime, device, browser, os) {
  try {
    var visitsSheet = getOrCreateSheet(ss, SHEET_VISITS, [
      "Visit ID", "First Seen (IN)", "Completed (OUT)", "Elapsed Time (s)", "Device Type", "Browser", "OS", "Status"
    ]);

    var lastRow = visitsSheet.getLastRow();
    var foundRow = -1;

    if (lastRow > 1) {
      var visitIds = visitsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var r = 0; r < visitIds.length; r++) {
        if (visitIds[r][0] === visitId) {
          foundRow = r + 2;
          break;
        }
      }
    }

    if (foundRow === -1) {
      // New visit record
      var status = eventType === "OUT" ? "Completed (YES)" : "Browsing (Envelope Opened)";
      visitsSheet.appendRow([
        visitId,
        eventType === "IN" ? timestamp : "",
        eventType === "OUT" ? timestamp : "",
        elapsedTime || "",
        device,
        browser,
        os,
        status
      ]);
    } else {
      // Update existing visit record
      if (eventType === "OUT") {
        visitsSheet.getRange(foundRow, 3).setValue(timestamp);
        visitsSheet.getRange(foundRow, 4).setValue(elapsedTime);
        visitsSheet.getRange(foundRow, 8).setValue("Completed (YES)");
      }
    }
  } catch (e) {
    Logger.log("[updateVisitDetails Error] " + e.toString());
  }
}

/**
 * Updates the high-level Dashboard summary sheet
 */
function updateDashboardSummary(ss) {
  try {
    var dashSheet = getOrCreateSheet(ss, SHEET_DASHBOARD, ["Metric", "Value", "Description"]);
    var eventsSheet = ss.getSheetByName(SHEET_EVENTS);
    if (!eventsSheet || eventsSheet.getLastRow() <= 1) return;

    var rows = eventsSheet.getDataRange().getValues();
    var inCount = 0;
    var outCount = 0;
    var visitMap = {};
    var durationSum = 0;
    var outWithDuration = 0;

    for (var i = 1; i < rows.length; i++) {
      var type = rows[i][2];
      var vId = rows[i][1];
      visitMap[vId] = true;
      if (type === "IN") inCount++;
      if (type === "OUT") {
        outCount++;
        var el = parseFloat(rows[i][5]);
        if (!isNaN(el) && el > 0) {
          durationSum += el;
          outWithDuration++;
        }
      }
    }

    var uniqueCount = Object.keys(visitMap).length;
    var abandoned = Math.max(0, uniqueCount - outCount);
    var convRate = uniqueCount > 0 ? ((outCount / uniqueCount) * 100).toFixed(1) + "%" : "0%";
    var avgDur = outWithDuration > 0 ? (durationSum / outWithDuration).toFixed(1) + " s" : "0 s";
    var lastUpdate = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    var summaryData = [
      ["Total IN Events", inCount, "Visitors who clicked to open the envelope"],
      ["Total OUT Events", outCount, "Visitors who clicked YES on final proposal"],
      ["Unique Visits", uniqueCount, "Distinct visitor sessions"],
      ["Opened Without YES", abandoned, "Visitors who opened storybook but did not say YES"],
      ["IN-to-OUT Conversion", convRate, "Percentage of envelope openers who clicked YES"],
      ["Average Time to YES", avgDur, "Mean seconds spent exploring before saying YES"],
      ["Last Updated", lastUpdate, "Authoritative server timestamp (Asia/Kolkata)"]
    ];

    dashSheet.getRange(2, 1, summaryData.length, 3).setValues(summaryData);
  } catch (e) {
    Logger.log("[updateDashboardSummary Error] " + e.toString());
  }
}

// -----------------------------------------------------------------------------
// Helper Utilities & Schema Setup
// -----------------------------------------------------------------------------

function getEventsHeaders() {
  return [
    "Event ID",
    "Visit ID",
    "Event Type",
    "Server Timestamp",
    "Client Timestamp",
    "Elapsed Time (seconds)",
    "Device Type",
    "Browser",
    "Operating System",
    "Screen Width",
    "Screen Height",
    "Viewport Width",
    "Viewport Height",
    "Timezone",
    "Language"
  ];
}

function isDuplicateEventId(sheet, eventId) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  var checkDepth = Math.min(200, lastRow - 1);
  var startRow = lastRow - checkDepth + 1;
  var eventIds = sheet.getRange(startRow, 1, checkDepth, 1).getValues();
  for (var i = 0; i < eventIds.length; i++) {
    if (eventIds[i][0] === eventId) {
      return true;
    }
  }
  return false;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#f3ebdc")
        .setFontColor("#5a3622");
    }
  }
  return sheet;
}

function createJsonResponse(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function sanitizeString(str, maxLen) {
  if (str === null || str === undefined) return "";
  var s = str.toString().replace(/[\r\n\t]/g, " ").trim();
  return s.length > maxLen ? s.substring(0, maxLen) : s;
}

function parseNumeric(val, fallback) {
  if (val === null || val === undefined || val === "") return fallback;
  var n = Number(val);
  return isNaN(n) ? fallback : n;
}

function toCamelCase(header) {
  if (header === null || header === undefined) return "";
  return String(header)
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+(.)/g, function(match, grp) {
      return grp.toUpperCase();
    });
}

/**
 * One-click Setup Function
 * Run this function from the Apps Script Editor to initialize all 3 sheets with proper headers,
 * formatting, column sizing, and colors.
 */
function setupSpreadsheet() {
  var ss = getTargetSpreadsheet();
  ss.setSpreadsheetTimeZone(TIMEZONE);

  // 1. Visitor Events
  var evSheet = getOrCreateSheet(ss, SHEET_EVENTS, getEventsHeaders());
  evSheet.getRange(1, 1, 1, getEventsHeaders().length)
    .setBackground("#3b281c")
    .setFontColor("#fae1b8")
    .setFontWeight("bold");

  // 2. Dashboard
  var dashSheet = getOrCreateSheet(ss, SHEET_DASHBOARD, ["Metric", "Value", "Description"]);
  dashSheet.getRange(1, 1, 1, 3)
    .setBackground("#3b281c")
    .setFontColor("#fae1b8")
    .setFontWeight("bold");

  // 3. Visit Details
  var vSheet = getOrCreateSheet(ss, SHEET_VISITS, [
    "Visit ID", "First Seen (IN)", "Completed (OUT)", "Elapsed Time (s)", "Device Type", "Browser", "OS", "Status"
  ]);
  vSheet.getRange(1, 1, 1, 8)
    .setBackground("#3b281c")
    .setFontColor("#fae1b8")
    .setFontWeight("bold");

  updateDashboardSummary(ss);
  Logger.log("✓ BUTTERFLY Spreadsheet Setup Completed Successfully.");
}

/**
 * Diagnostic Connection Test
 * Run this in Apps Script Editor to verify write permissions.
 */
function testConnection() {
  var res = processTrackingEvent({
    eventId: "test_evt_" + new Date().getTime(),
    visitId: "test_visit_diagnostics",
    eventType: "IN",
    clientTimestamp: new Date().toISOString(),
    deviceType: "desktop",
    browser: "Diagnostics Runner",
    os: "Apps Script Runtime",
    screenWidth: 1920,
    screenHeight: 1080,
    viewportWidth: 1920,
    viewportHeight: 1080,
    timezone: TIMEZONE,
    language: "en"
  });
  Logger.log("Connection Test Result: " + res.getContent());
}


