/**
 * BUTTERFLY — Visitor Tracking Admin Data Types
 */

export interface VisitorEventRecord {
  eventId: string;
  visitId: string;
  eventType: 'IN' | 'OUT';
  serverTimestamp: string;
  clientTimestamp: string;
  elapsedTime: number | string;
  deviceType: 'desktop' | 'tablet' | 'mobile' | string;
  browser: string;
  operatingSystem?: string;
  os?: string;
  screenWidth: number | string;
  screenHeight: number | string;
  viewportWidth: number | string;
  viewportHeight: number | string;
  timezone: string;
  language: string;
}

export interface VisitorTrackingSummary {
  totalIn: number;
  totalOut: number;
  uniqueVisits: number;
  abandonedVisits: number;
  conversionRatePercent: string;
  averageDurationSeconds: string;
  lastUpdated: string;
}

export interface VisitTimelineGroup {
  visitId: string;
  deviceType: string;
  browser: string;
  os: string;
  inEvent?: VisitorEventRecord;
  outEvent?: VisitorEventRecord;
  startTime?: string;
  endTime?: string;
  elapsedSeconds?: number;
  status: 'Completed (YES)' | 'Browsing / Incomplete';
}

