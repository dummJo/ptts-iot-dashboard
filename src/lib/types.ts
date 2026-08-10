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
  time: string;         // HH:MM
  temp: number;         // °C  — Bearing/ambient temperature
  vib: number;          // mm/s RMS — Overall vibration
  rms?: number;         // mm/s — Vibration RMS (detailed)
  powerKW?: number;     // kW  — Motor load
  freq?: number;        // Hz  — Dominant vibration frequency
  velocity?: number;    // mm/s peak — Velocity (envelope)
  current?: number;     // A   — Motor current draw
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
  // ISO 10816 parameters
  powerKW?: number;
  foundation?: 'rigid' | 'flexible';
  // Manual overrides
  vibrationThresholds?: { warning: number; fault: number };
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
  notifications: {
    telegramToken: string;
    telegramChatId: string;
    whatsappApiUrl: string;
    whatsappToken: string;
    isNotifyEnabled: boolean;
  };
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
  assetTrends?: Record<string, TrendPoint[]>; // per-asset trend history
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
}

// ── Energy Management ─────────────────────────────────────────────────
/**
 * PLN industrial tariffs are split into two windows:
 *   WBP  (Waktu Beban Puncak)      — peak window, billed at `peakMultiplier` × base
 *   LWBP (Luar Waktu Beban Puncak) — everything else, billed at base rate
 *
 * Every numeric default in DEFAULT_TARIFF is a PLACEHOLDER, not a quoted rate.
 * PTTS must enter the figures from its own PLN invoice before any cost shown by
 * this console is treated as money. `isDefault` propagates that to the UI.
 */
export interface TariffConfig {
  currency: string;
  baseRatePerKwh: number;     // LWBP rate, currency units per kWh
  peakMultiplier: number;     // "K factor" applied to the WBP window
  peakStartHour: number;      // local hour, inclusive
  peakEndHour: number;        // local hour, exclusive
  utcOffsetMinutes: number;   // 420 = WIB (UTC+7)
  co2FactorKgPerKwh: number;
  isDefault: boolean;
}

export type TariffWindow = 'wbp' | 'lwbp';

export interface EnergyPoint {
  t: string;            // ISO timestamp of bucket start
  label: string;        // axis label
  kw: number;           // mean demand across the bucket
  kwh: number;          // energy attributed to the bucket
  window: TariffWindow;
}

export interface AssetEnergyRow {
  id: string;
  name: string;
  type: string;
  kwh: number;
  kwhWbp: number;
  kwhLwbp: number;
  cost: number;
  sharePct: number;
  peakKw: number;
  coveragePct: number;  // share of hours in range with at least one sample
}

export interface EnergyTotals {
  kwh: number;
  kwhWbp: number;
  kwhLwbp: number;
  cost: number;
  costWbp: number;
  costLwbp: number;
  co2Kg: number;
  peakKw: number;
  peakAt: string | null;
  avgKw: number;
  loadFactor: number;      // avgKw / peakKw — 0 when peak is unknown
  coveragePct: number;
  specificEnergy: number | null;  // kWh/m³ — null when no flow data exists
}

export interface EnergySummary {
  range: { from: string; to: string; label: string };
  /** True when the payload is a deterministic stand-in, not measured data. */
  simulated: boolean;
  tariff: TariffConfig;
  totals: EnergyTotals;
  previous: { kwh: number; cost: number; co2Kg: number } | null;
  profile: EnergyPoint[];
  assets: AssetEnergyRow[];
  generatedAt: string;
}

export type EnergyRangeKey = 'today' | '7d' | '30d' | 'custom';

export const EMPTY_ENERGY: EnergySummary = {
  range: { from: '', to: '', label: '' },
  simulated: false,
  tariff: {
    currency: 'IDR',
    baseRatePerKwh: 0,
    peakMultiplier: 1,
    peakStartHour: 18,
    peakEndHour: 22,
    utcOffsetMinutes: 420,
    co2FactorKgPerKwh: 0,
    isDefault: true,
  },
  totals: {
    kwh: 0, kwhWbp: 0, kwhLwbp: 0,
    cost: 0, costWbp: 0, costLwbp: 0,
    co2Kg: 0, peakKw: 0, peakAt: null,
    avgKw: 0, loadFactor: 0, coveragePct: 0,
    specificEnergy: null,
  },
  previous: null,
  profile: [],
  assets: [],
  generatedAt: '',
};

// ── MQTT Inbound Data Contract ────────────────────────────────────────
/**
 * Shape of the data received from an MQTT-to-HTTP bridge.
 * Complies with the 'gateway-data-v1' specification.
 */
export interface InboundTelemetryEntry {
  tagId: string;
  timestamp: string;      // ISO 8601
  temp: number;
  vibOverall: number;
  vibVelocity?: number;
  vibRms?: number;
  vibFreq?: number;
  motorCurrent?: number;
  motorKw?: number;
  raw?: any;             // Optional original packet for debugging
}

export interface InboundTelemetryPayload {
  gatewayId: string;
  data: InboundTelemetryEntry[];
}
