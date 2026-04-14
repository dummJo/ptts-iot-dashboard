/**
 * Centralized TypeScript type definitions for PTTS IoT Dashboard
 * ---
 * All data types must be defined here.
 * When integrating with the real backend (NestJS/Express + PostgreSQL),
 * ensure the API response shapes strictly match these interfaces.
 */

// ── KPI Card ──────────────────────────────────────────────────────────
export interface KPIItem {
  label: string;
  value: string;
  unit: string;
  sub: string;
  trend: string;
  trendUp: boolean;
  color: string;
  ledClass: string;
}

// ── Trend Chart ───────────────────────────────────────────────────────
export interface TrendPoint {
  time: string;   // HH:MM
  temp: number;   // °C
  vib: number;    // mm/s RMS
}

// ── Status Donut ──────────────────────────────────────────────────────
export interface StatusSegment {
  name: string;
  value: number;
  color: string;
}

// ── Asset / Equipment ─────────────────────────────────────────────────
export type LinkStatus   = 'online' | 'offline';
export type HealthStatus = 'good' | 'warning' | 'fault';

export interface Asset {
  id: string;
  name: string;
  type: string;
  temp: number;      // °C
  vib: number;       // mm/s
  link: LinkStatus;  // Connectivity status
  health: HealthStatus; // Machine condition health
}

// ── Alarm / Alert ─────────────────────────────────────────────────────
export type AlarmSeverity = 'critical' | 'warning' | 'info';

export interface Alarm {
  id: string;
  asset: string;
  type: string;
  severity: AlarmSeverity;
  message: string;
  time: string;    // HH:MM
}

// ── Vibration Bar ─────────────────────────────────────────────────────
export interface VibrationEntry {
  name: string;
  value: number;   // mm/s
}

// ── System State ──────────────────────────────────────────────────────
export interface SystemState {
  connected: boolean;
  lastSync: string;
}

// ── Config / DB ───────────────────────────────────────────────────────
export interface ConfigState {
  apiKeys: string[];
}

// ── Full Dashboard API Response ───────────────────────────────────────
export interface DashboardData {
  kpiData: KPIItem[];
  trendData: TrendPoint[];
  statusData: StatusSegment[]; // Original for compat, but we'll use below
  linkSummary: { online: number; offline: number };
  healthSummary: { good: number; warning: number; fault: number };
  topAssets: Asset[];
  recentAlerts: Alarm[];
  vibrationBarData: VibrationEntry[];
  system: SystemState;
}

// ── Empty fallback for initial state ─────────────────────────────────
export const EMPTY_DASHBOARD: DashboardData = {
  kpiData: [],
  trendData: [],
  statusData: [],
  linkSummary: { online: 0, offline: 0 },
  healthSummary: { good: 0, warning: 0, fault: 0 },
  topAssets: [],
  recentAlerts: [],
  vibrationBarData: [],
  system: { connected: false, lastSync: new Date().toISOString() },
};

// ── Report ─────────────────────────────────────────────────────────────
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | '3months' | '6months' | '12months';

export interface AssetReportRow {
  id: string;
  name: string;
  type: string;
  avgTemp: number;
  maxTemp: number;
  avgVib: number;
  maxVib: number;
  uptime: number;       // percentage 0-100
  alarmCount: number;
  link: LinkStatus;
  health: HealthStatus;
}

export interface ReportSummary {
  period: ReportPeriod;
  dateRange: { from: string; to: string };
  generatedAt: string;
  totalNodes: number;
  avgUptime: number;
  totalAlarms: number;
  criticalAlarms: number;
  warningAlarms: number;
  avgTemp: number;
  avgVib: number;
  assets: AssetReportRow[];
  trendData: TrendPoint[];
}
