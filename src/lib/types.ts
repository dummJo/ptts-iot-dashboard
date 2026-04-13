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
export type AssetStatus = 'online' | 'warning' | 'fault' | 'offline';

export interface Asset {
  id: string;
  name: string;
  type: string;
  temp: number;    // °C
  vib: number;     // mm/s
  status: AssetStatus;
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
  statusData: StatusSegment[];
  topAssets: Asset[];
  recentAlerts: Alarm[];
  vibrationBarData: VibrationEntry[];
  system: SystemState;
}
