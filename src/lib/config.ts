/**
 * PTTS SmartSensor — Service Registry & Feature Flags
 * ─────────────────────────────────────────────────────
 * Titik kontrol tunggal untuk konfigurasi seluruh sistem.
 *
 * Cara menambah microservice baru:
 *   1. Tambah env var di .env.example (NEXT_PUBLIC_XXX_SERVICE_URL)
 *   2. Tambah entry baru di SERVICES di bawah
 *   3. Gunakan serviceUrl('xxx') di apiClient
 *
 * Frontend tidak perlu diubah sama sekali saat URL berubah.
 */

// ── Service URL Registry ────────────────────────────────────────────────────

const GLOBAL_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/**
 * Resolves the base URL for a named microservice.
 * Falls back to NEXT_PUBLIC_API_BASE_URL if service-specific URL not set.
 *
 * Production example:
 *   telemetry → https://telemetry.ptts.internal
 *   reports   → https://reports.ptts.internal
 *   config    → https://config.ptts.internal
 */
export function serviceUrl(service: keyof typeof SERVICE_MAP): string {
  return SERVICE_MAP[service] || GLOBAL_BASE;
}

const SERVICE_MAP = {
  /** Real-time telemetry data from sensors */
  telemetry: process.env.NEXT_PUBLIC_TELEMETRY_SERVICE_URL ?? GLOBAL_BASE,
  /** Aggregation & report generation (can be a heavy separate worker) */
  reports:   process.env.NEXT_PUBLIC_REPORTS_SERVICE_URL   ?? GLOBAL_BASE,
  /** API key and system configuration storage */
  config:    process.env.NEXT_PUBLIC_CONFIG_SERVICE_URL    ?? GLOBAL_BASE,
  /** Alarm rules, acknowledgment, escalation engine */
  alarms:    process.env.NEXT_PUBLIC_ALARMS_SERVICE_URL    ?? GLOBAL_BASE,
  /** Asset registry: equipment database CRUD */
  assets:    process.env.NEXT_PUBLIC_ASSETS_SERVICE_URL    ?? GLOBAL_BASE,
} as const;

// ── Feature Flags ────────────────────────────────────────────────────────────

/**
 * Central feature flag registry.
 * Set via environment variables in .env.local.
 * All flags default to false unless explicitly enabled.
 */
export const FEATURES = {
  /** Report generator (PDF/CSV export) */
  reports:       process.env.NEXT_PUBLIC_FEATURE_REPORTS        !== 'false',
  /** Alarm acknowledgment button */
  alarmsAck:     process.env.NEXT_PUBLIC_FEATURE_ALARMS_ACK     !== 'false',
  /** SCADA P&ID asset topology map */
  assetTopoMap:  process.env.NEXT_PUBLIC_FEATURE_ASSET_TOPO_MAP === 'true',
  /** MQTT push from frontend to device */
  mqttPush:      process.env.NEXT_PUBLIC_FEATURE_MQTT_PUSH      === 'true',
} as const;

// ── Request Config ───────────────────────────────────────────────────────────

export const REQUEST_CONFIG = {
  /** Max retry attempts on transient failures (503, network errors) */
  maxRetries:    2,
  /** Delay between retries in ms */
  retryDelayMs:  800,
  /** Default request timeout in ms */
  timeoutMs:     10_000,
} as const;
