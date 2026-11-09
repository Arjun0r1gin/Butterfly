/**
 * BUTTERFLY — Visitor Tracking Admin Dashboard Component
 * Independent local-only analytics interface.
 * Connects securely to the private Google Apps Script Web App using an authenticated adminKey,
 * with full CSV export, visit timeline grouping, multi-parameter filtering, and offline mock support.
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { VisitorEventRecord, VisitorTrackingSummary, VisitTimelineGroup } from './types';
import { getTrackingEndpoint, setTrackingEndpoint } from '../../../services/tracking/visitorTracking';
import styles from './VisitorTracking.module.css';

const LOCAL_ADMIN_KEY_STORAGE = 'butterfly_tracking_admin_key';

// Sample Mock Data for Instant Preview / Offline Testing
const MOCK_EVENTS: VisitorEventRecord[] = [
  {
    eventId: 'evt_in_1731174000123_abc123',
    visitId: 'vis_8a49c2d1-e6f7-41ab-8c90-123456789abc',
    eventType: 'IN',
    serverTimestamp: '2026-11-09T17:10:00.123+05:30',
    clientTimestamp: '2026-11-09T17:09:59.850Z',
    elapsedTime: '',
    deviceType: 'desktop',
    browser: 'Chrome',
    operatingSystem: 'macOS',
    screenWidth: 1920,
    screenHeight: 1080,
    viewportWidth: 1440,
    viewportHeight: 900,
    timezone: 'Asia/Kolkata',
    language: 'en-US',
  },
  {
    eventId: 'evt_out_1731174120456_def456',
    visitId: 'vis_8a49c2d1-e6f7-41ab-8c90-123456789abc',
    eventType: 'OUT',
    serverTimestamp: '2026-11-09T17:12:00.456+05:30',
    clientTimestamp: '2026-11-09T17:12:00.100Z',
    elapsedTime: 120.3,
    deviceType: 'desktop',
    browser: 'Chrome',
    operatingSystem: 'macOS',
    screenWidth: 1920,
    screenHeight: 1080,
    viewportWidth: 1440,
    viewportHeight: 900,
    timezone: 'Asia/Kolkata',
    language: 'en-US',
  },
  {
    eventId: 'evt_in_1731174200789_ghi789',
    visitId: 'vis_1b23f456-7890-4abc-def1-234567890def',
    eventType: 'IN',
    serverTimestamp: '2026-11-09T17:15:00.789+05:30',
    clientTimestamp: '2026-11-09T17:15:00.400Z',
    elapsedTime: '',
    deviceType: 'mobile',
    browser: 'Safari',
    operatingSystem: 'iOS',
    screenWidth: 390,
    screenHeight: 844,
    viewportWidth: 390,
    viewportHeight: 844,
    timezone: 'Asia/Kolkata',
    language: 'en-GB',
  },
  {
    eventId: 'evt_out_1731174290111_jkl012',
    visitId: 'vis_1b23f456-7890-4abc-def1-234567890def',
    eventType: 'OUT',
    serverTimestamp: '2026-11-09T17:16:30.111+05:30',
    clientTimestamp: '2026-11-09T17:16:29.800Z',
    elapsedTime: 89.4,
    deviceType: 'mobile',
    browser: 'Safari',
    operatingSystem: 'iOS',
    screenWidth: 390,
    screenHeight: 844,
    viewportWidth: 390,
    viewportHeight: 844,
    timezone: 'Asia/Kolkata',
    language: 'en-GB',
  },
  {
    eventId: 'evt_in_1731174400333_mno345',
    visitId: 'vis_9c87b654-3210-4fed-cba9-876543210fed',
    eventType: 'IN',
    serverTimestamp: '2026-11-09T17:20:00.333+05:30',
    clientTimestamp: '2026-11-09T17:20:00.100Z',
    elapsedTime: '',
    deviceType: 'tablet',
    browser: 'Safari',
    operatingSystem: 'iOS',
    screenWidth: 810,
    screenHeight: 1080,
    viewportWidth: 810,
    viewportHeight: 1080,
    timezone: 'Asia/Kolkata',
    language: 'en-US',
  },
];

export const VisitorTracking: React.FC = () => {
  const [endpointUrl, setEndpointUrlState] = useState(() => getTrackingEndpoint());
  const [adminKey, setAdminKey] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_ADMIN_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  const [events, setEvents] = useState<VisitorEventRecord[]>(MOCK_EVENTS);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>('Showing preview mock data');

  // Filter States
  const [activeTab, setActiveTab] = useState<'timelines' | 'table'>('timelines');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Persist settings locally
  const handleSaveEndpoint = (url: string) => {
    setEndpointUrlState(url);
    setTrackingEndpoint(url);
  };

  const handleSaveAdminKey = (key: string) => {
    setAdminKey(key);
    try {
      localStorage.setItem(LOCAL_ADMIN_KEY_STORAGE, key.trim());
    } catch {
      // ignore
    }
  };

  // Fetch Live Data from Google Apps Script Web App
  const handleFetchLiveData = useCallback(async () => {
    if (!endpointUrl || endpointUrl.includes('AKfycbx_PLACEHOLDER_ENDPOINT_URL')) {
      setErrorMessage('Please enter your deployed Apps Script Web App URL first.');
      return;
    }
    if (!adminKey) {
      setErrorMessage('Please enter your secret Admin Key to authenticate.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Authenticated admin read via POST with text/plain (avoids CORS preflight OPTIONS rejection)
      const resp = await fetch(endpointUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
        },
        body: JSON.stringify({
          action: 'get_events',
          adminKey: adminKey.trim(),
        }),
      });

      const data = await resp.json();

      // 1. Explicit Error Response (Authentication failure or server message)
      if (data.success === false || data.status === 'error') {
        throw new Error(data.message || 'Authentication failed: Please check your ADMIN_SECRET_KEY.');
      }

      // 2. Successful Admin Events Response
      if ((data.success === true || data.status === 'ok') && Array.isArray(data.events)) {
        setEvents(data.events);
        setIsLiveConnected(true);
        setStatusMessage(`Live connected • ${data.events.length} events retrieved from Google Sheets`);
        return;
      }

      // 3. Health Check response guard (if endpoint was hit with GET or old deployment)
      if (data.service && (data.status === 'online' || data.success === true)) {
        throw new Error('Endpoint returned health check instead of event data. Please ensure the latest Apps Script code is deployed.');
      }

      // 4. Unexpected response format
      const snippet = typeof data === 'object' ? JSON.stringify(data).slice(0, 80) : String(data).slice(0, 80);
      throw new Error(`Unexpected response format from Apps Script endpoint: ${snippet}`);
    } catch (err: any) {
      console.error('[VisitorTracking] Fetch error:', err);
      setIsLiveConnected(false);
      setErrorMessage(
        err.message?.includes('Failed to fetch')
          ? 'Network / CORS error: Unable to reach Google Apps Script. Please verify the Web App URL.'
          : err.message || 'Failed to connect to Google Sheets.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [endpointUrl, adminKey]);

  // Load Sample Mock Data
  const handleLoadMockData = () => {
    setEvents(MOCK_EVENTS);
    setIsLiveConnected(false);
    setErrorMessage(null);
    setStatusMessage('Showing preview mock data (3 visits, 5 events)');
  };

  // Calculated Metrics
  const summary: VisitorTrackingSummary = useMemo(() => {
    const visitsMap: Record<string, { in?: VisitorEventRecord; out?: VisitorEventRecord }> = {};
    let totalIn = 0;
    let totalOut = 0;
    let totalDuration = 0;
    let completedCount = 0;

    events.forEach((ev) => {
      visitsMap[ev.visitId] = visitsMap[ev.visitId] || {};
      if (ev.eventType === 'IN') {
        totalIn++;
        visitsMap[ev.visitId].in = ev;
      } else if (ev.eventType === 'OUT') {
        totalOut++;
        visitsMap[ev.visitId].out = ev;
        const dur = typeof ev.elapsedTime === 'number' ? ev.elapsedTime : parseFloat(ev.elapsedTime || '0');
        if (!isNaN(dur) && dur > 0) {
          totalDuration += dur;
          completedCount++;
        }
      }
    });

    const uniqueCount = Object.keys(visitsMap).length;
    const conversionRate = uniqueCount > 0 ? ((totalOut / uniqueCount) * 100).toFixed(1) : '0.0';
    const avgDuration = completedCount > 0 ? (totalDuration / completedCount).toFixed(1) : '0.0';

    return {
      totalIn,
      totalOut,
      uniqueVisits: uniqueCount,
      abandonedVisits: Math.max(0, uniqueCount - totalOut),
      conversionRatePercent: conversionRate,
      averageDurationSeconds: avgDuration,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }, [events]);

  // Grouped Visit Timelines
  const visitTimelines: VisitTimelineGroup[] = useMemo(() => {
    const map: Record<string, VisitTimelineGroup> = {};

    events.forEach((ev) => {
      if (!map[ev.visitId]) {
        map[ev.visitId] = {
          visitId: ev.visitId,
          deviceType: ev.deviceType || 'desktop',
          browser: ev.browser || 'Unknown',
          os: ev.operatingSystem || ev.os || 'Unknown',
          status: 'Browsing / Incomplete',
        };
      }

      if (ev.eventType === 'IN') {
        map[ev.visitId].inEvent = ev;
        map[ev.visitId].startTime = ev.serverTimestamp || ev.clientTimestamp;
      } else if (ev.eventType === 'OUT') {
        map[ev.visitId].outEvent = ev;
        map[ev.visitId].endTime = ev.serverTimestamp || ev.clientTimestamp;
        map[ev.visitId].status = 'Completed (YES)';
        const elap = typeof ev.elapsedTime === 'number' ? ev.elapsedTime : parseFloat(ev.elapsedTime || '0');
        if (!isNaN(elap)) {
          map[ev.visitId].elapsedSeconds = elap;
        }
      }
    });

    return Object.values(map).reverse(); // Newest first
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (typeFilter !== 'ALL' && ev.eventType !== typeFilter) return false;
      if (deviceFilter !== 'ALL' && (ev.deviceType || '').toLowerCase() !== deviceFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          ev.visitId.toLowerCase().includes(q) ||
          ev.eventId.toLowerCase().includes(q) ||
          ev.browser.toLowerCase().includes(q) ||
          (ev.operatingSystem || ev.os || '').toLowerCase().includes(q) ||
          ev.timezone.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [events, typeFilter, deviceFilter, searchQuery]);

  // Filtered Visit Timelines
  const filteredTimelines = useMemo(() => {
    return visitTimelines.filter((vt) => {
      if (typeFilter === 'OUT' && vt.status !== 'Completed (YES)') return false;
      if (typeFilter === 'IN' && vt.status !== 'Browsing / Incomplete') return false;
      if (deviceFilter !== 'ALL' && vt.deviceType.toLowerCase() !== deviceFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          vt.visitId.toLowerCase().includes(q) ||
          vt.browser.toLowerCase().includes(q) ||
          vt.os.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [visitTimelines, typeFilter, deviceFilter, searchQuery]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (events.length === 0) return;

    const headers = [
      'Event ID',
      'Visit ID',
      'Event Type',
      'Server Timestamp',
      'Client Timestamp',
      'Elapsed Time (seconds)',
      'Device Type',
      'Browser',
      'Operating System',
      'Screen Width',
      'Screen Height',
      'Viewport Width',
      'Viewport Height',
      'Timezone',
      'Language',
    ];

    const rows = events.map((ev) => [
      ev.eventId,
      ev.visitId,
      ev.eventType,
      ev.serverTimestamp || '',
      ev.clientTimestamp || '',
      ev.elapsedTime !== undefined ? ev.elapsedTime : '',
      ev.deviceType || '',
      ev.browser || '',
      ev.operatingSystem || ev.os || '',
      ev.screenWidth || '',
      ev.screenHeight || '',
      ev.viewportWidth || '',
      ev.viewportHeight || '',
      ev.timezone || '',
      ev.language || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `butterfly_visitor_tracking_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.trackingContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.headerTitle}>
            <span>📈</span>
            <span>Visitor Tracking & Insights</span>
          </h1>
          <p className={styles.headerSubtitle}>
            Real-time event logging to your private Google Sheet. Privacy-first, zero third-party scripts.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.btnSecondary} onClick={handleLoadMockData}>
            ↺ Reset to Mock Data
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handleExportCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Google Sheets Endpoint & Security Credentials Configuration */}
      <div className={styles.configCard}>
        <div className={styles.configHeader}>
          <h2 className={styles.configTitle}>
            <span>🔒</span>
            <span>Private Google Apps Script Endpoint Configuration</span>
          </h2>
          <span
            className={`${styles.statusBadge} ${
              isLiveConnected
                ? styles.statusLive
                : endpointUrl.includes('AKfycbx_PLACEHOLDER')
                ? styles.statusUnconfigured
                : styles.statusMock
            }`}
          >
            {isLiveConnected
              ? '● Live Connected'
              : endpointUrl.includes('AKfycbx_PLACEHOLDER')
              ? '○ Endpoint Not Set'
              : '● Standby / Mock Mode'}
          </span>
        </div>

        <div className={styles.configInputsGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Apps Script Web App URL</label>
            <input
              type="text"
              className={styles.inputField}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={endpointUrl}
              onChange={(e) => handleSaveEndpoint(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Admin Secret Key (Stored locally on your machine)</label>
            <input
              type="password"
              className={styles.inputField}
              placeholder="Enter ADMIN_SECRET_KEY..."
              value={adminKey}
              onChange={(e) => handleSaveAdminKey(e.target.value)}
            />
          </div>

          <div className={styles.configBtnGroup}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleFetchLiveData}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Connecting...' : '⚡ Fetch Live Data'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={{ color: '#f17c70', fontSize: '0.84rem', marginTop: '4px' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {!errorMessage && statusMessage && (
          <div style={{ color: 'var(--admin-text-subtle)', fontSize: '0.82rem' }}>
            ℹ️ {statusMessage}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total IN Events</span>
            <span className={styles.kpiIcon}>📩</span>
          </div>
          <div className={styles.kpiValue}>{summary.totalIn}</div>
          <div className={styles.kpiSubtext}>Envelope opened clicks</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total OUT Events</span>
            <span className={styles.kpiIcon}>💍</span>
          </div>
          <div className={styles.kpiValue}>{summary.totalOut}</div>
          <div className={styles.kpiSubtext}>YES button clicks</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Unique Visits</span>
            <span className={styles.kpiIcon}>👥</span>
          </div>
          <div className={styles.kpiValue}>{summary.uniqueVisits}</div>
          <div className={styles.kpiSubtext}>Distinct visitor sessions</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Opened Without YES</span>
            <span className={styles.kpiIcon}>⏳</span>
          </div>
          <div className={styles.kpiValue}>{summary.abandonedVisits}</div>
          <div className={styles.kpiSubtext}>Incomplete or browsing</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>IN-to-OUT Conversion</span>
            <span className={styles.kpiIcon}>🎯</span>
          </div>
          <div className={styles.kpiValue}>{summary.conversionRatePercent}%</div>
          <div className={styles.kpiSubtext}>Openers who said YES</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Avg Time to YES</span>
            <span className={styles.kpiIcon}>⏱️</span>
          </div>
          <div className={styles.kpiValue}>{summary.averageDurationSeconds}s</div>
          <div className={styles.kpiSubtext}>Time from IN to OUT</div>
        </div>
      </div>

      {/* Filters and View Toggle Bar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarRow}>
          {/* Search Input */}
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by Visit ID, Browser, OS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggles */}
          <div className={styles.viewToggleGroup}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${activeTab === 'timelines' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setActiveTab('timelines')}
            >
              <span>🧭</span>
              <span>Visit Timelines ({filteredTimelines.length})</span>
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${activeTab === 'table' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setActiveTab('table')}
            >
              <span>📋</span>
              <span>Raw Event Log ({filteredEvents.length})</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.toolbarRow}>
          {/* Event Type Filter */}
          <div className={styles.filterPillsGroup}>
            <span className={styles.filterLabel}>Type:</span>
            <button
              type="button"
              className={`${styles.filterPill} ${typeFilter === 'ALL' ? styles.filterPillActive : ''}`}
              onClick={() => setTypeFilter('ALL')}
            >
              All Events
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${typeFilter === 'IN' ? styles.filterPillActive : ''}`}
              onClick={() => setTypeFilter('IN')}
            >
              IN (Opened)
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${typeFilter === 'OUT' ? styles.filterPillActive : ''}`}
              onClick={() => setTypeFilter('OUT')}
            >
              OUT (Said YES)
            </button>
          </div>

          {/* Device Filter */}
          <div className={styles.filterPillsGroup}>
            <span className={styles.filterLabel}>Device:</span>
            {['ALL', 'desktop', 'mobile', 'tablet'].map((dev) => (
              <button
                key={dev}
                type="button"
                className={`${styles.filterPill} ${deviceFilter === dev ? styles.filterPillActive : ''}`}
                onClick={() => setDeviceFilter(dev)}
              >
                {dev.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Timelines vs Table */}
      {activeTab === 'timelines' ? (
        <div className={styles.timelineGrid}>
          {filteredTimelines.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <div>No visits match the current filter criteria.</div>
            </div>
          ) : (
            filteredTimelines.map((vt) => (
              <div key={vt.visitId} className={styles.timelineCard}>
                <div className={styles.timelineHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={styles.visitIdTitle}>{vt.visitId}</span>
                    <span className={styles.deviceBadge}>
                      {vt.deviceType === 'mobile' ? '📱' : vt.deviceType === 'tablet' ? '📟' : '💻'} {vt.browser} on{' '}
                      {vt.os}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {vt.elapsedSeconds !== undefined && (
                      <span className={styles.durationBadge}>⏱️ {vt.elapsedSeconds}s to YES</span>
                    )}
                    <span
                      className={`${styles.eventBadge} ${
                        vt.status === 'Completed (YES)' ? styles.badgeOut : styles.badgeIn
                      }`}
                    >
                      {vt.status}
                    </span>
                  </div>
                </div>

                <div className={styles.timelineStepsRow}>
                  {/* Step 1: IN */}
                  <div className={styles.timelineStep}>
                    <div className={`${styles.stepDot} ${vt.inEvent ? styles.stepDotIn : styles.stepDotNone}`} />
                    <div className={styles.stepInfo}>
                      <span className={styles.stepName}>Envelope Opened (IN)</span>
                      <span className={styles.stepTime}>
                        {vt.inEvent?.serverTimestamp
                          ? new Date(vt.inEvent.serverTimestamp).toLocaleString()
                          : 'Recorded'}
                      </span>
                    </div>
                  </div>

                  {/* Connector */}
                  <div
                    className={
                      vt.status === 'Completed (YES)'
                        ? styles.timelineConnector
                        : styles.timelineConnectorIncomplete
                    }
                  />

                  {/* Step 2: OUT */}
                  <div className={styles.timelineStep}>
                    <div className={`${styles.stepDot} ${vt.outEvent ? styles.stepDotOut : styles.stepDotNone}`} />
                    <div className={styles.stepInfo}>
                      <span className={styles.stepName}>
                        {vt.outEvent ? 'Clicked YES (OUT)' : 'Awaiting YES...'}
                      </span>
                      <span className={styles.stepTime}>
                        {vt.outEvent?.serverTimestamp
                          ? new Date(vt.outEvent.serverTimestamp).toLocaleString()
                          : 'In progress'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Event Log Table */
        <div className={styles.tableContainer}>
          <table className={styles.eventsTable}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Time (Server)</th>
                <th>Visit ID</th>
                <th>Elapsed Time</th>
                <th>Device</th>
                <th>Browser</th>
                <th>OS</th>
                <th>Screen</th>
                <th>Viewport</th>
                <th>Timezone</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>
                    No events found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.eventId}>
                    <td>
                      <span
                        className={`${styles.eventBadge} ${
                          ev.eventType === 'IN' ? styles.badgeIn : styles.badgeOut
                        }`}
                      >
                        {ev.eventType}
                      </span>
                    </td>
                    <td style={{ color: 'var(--admin-text-subtle)' }}>
                      {ev.serverTimestamp ? new Date(ev.serverTimestamp).toLocaleString() : ev.clientTimestamp}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--admin-gold-primary)' }}>
                      {ev.visitId.substring(0, 16)}...
                    </td>
                    <td>{ev.elapsedTime ? `${ev.elapsedTime}s` : '—'}</td>
                    <td>
                      <span className={styles.deviceBadge}>
                        {ev.deviceType === 'mobile' ? '📱' : ev.deviceType === 'tablet' ? '📟' : '💻'}{' '}
                        {ev.deviceType}
                      </span>
                    </td>
                    <td>{ev.browser}</td>
                    <td>{ev.operatingSystem || ev.os || '—'}</td>
                    <td>
                      {ev.screenWidth} &times; {ev.screenHeight}
                    </td>
                    <td>
                      {ev.viewportWidth} &times; {ev.viewportHeight}
                    </td>
                    <td style={{ color: 'var(--admin-text-subtle)' }}>{ev.timezone}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
