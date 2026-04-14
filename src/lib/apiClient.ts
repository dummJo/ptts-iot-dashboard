/**
 * Centralized API Client for PTTS IoT Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture contract:
 *   - Frontend NEVER accesses DB directly
 *   - All data flows through this client → microservice URLs → backend → DB
 *   - To add a new microservice: add to config.ts SERVICE_MAP, add method here
 *   - To switch from mock → real backend: set env vars in .env.local (no code change)
 *
 * Retry logic: transient errors (503, network failure) auto-retry up to maxRetries.
 * Auth: JWT token injected automatically from cookie in server context.
 *       For client-side calls, cookies are sent automatically by the browser.
 */

import type {
  DashboardData,
  ConfigState,
  ReportSummary,
  ReportPeriod,
} from './types';
import { serviceUrl, REQUEST_CONFIG } from './config';

// ── Internal fetch wrapper with retry & timeout ───────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  retries: number = REQUEST_CONFIG.maxRetries,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_CONFIG.timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // When integrating a real JWT backend, inject Bearer token here:
        // 'Authorization': `Bearer ${getSessionToken()}`,
        ...options.headers,
      },
    });

    clearTimeout(timer);

    // Retry on transient server errors
    if ((res.status === 503 || res.status === 502) && retries > 0) {
      await delay(REQUEST_CONFIG.retryDelayMs);
      return apiFetch<T>(url, options, retries - 1);
    }

    if (!res.ok) {
      throw new ApiError(res.status, `${options.method ?? 'GET'} ${url} → HTTP ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timer);
    // Retry on network failure
    if (err instanceof TypeError && retries > 0) {
      await delay(REQUEST_CONFIG.retryDelayMs);
      return apiFetch<T>(url, options, retries - 1);
    }
    throw err;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Custom error class ────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── API Client ────────────────────────────────────────────────────────────────

export const apiClient = {

  // ── Telemetry Service ────────────────────────────────────────────────────

  /**
   * Fetches all dashboard telemetry data (KPIs, trend, assets, alarms).
   * Backend contract: GET /api/dashboard → DashboardData
   * DB: SELECT * FROM telemetry LEFT JOIN assets WHERE timestamp > NOW()-5m
   */
  async getDashboardData(): Promise<DashboardData> {
    return apiFetch<DashboardData>(
      `${serviceUrl('telemetry')}/api/dashboard`,
      { cache: 'no-store' }
    );
  },

  /**
   * Pushes new telemetry payload (from MQTT worker or sensor webhook).
   * Backend contract: POST /api/dashboard → { success, state }
   * DB: INSERT INTO telemetry (asset_id, temp, vib, timestamp) VALUES (...)
   */
  async pushTelemetryData(
    data: Partial<DashboardData>
  ): Promise<{ success: boolean; state: DashboardData }> {
    return apiFetch(
      `${serviceUrl('telemetry')}/api/dashboard`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  // ── Config Service ────────────────────────────────────────────────────────

  /**
   * Reads current system configuration (API keys, connection settings).
   * Backend contract: GET /api/config → ConfigState
   * DB: SELECT * FROM system_config WHERE id = 1
   */
  async getConfig(): Promise<ConfigState> {
    return apiFetch<ConfigState>(
      `${serviceUrl('config')}/api/config`,
      { cache: 'no-store' }
    );
  },

  /**
   * Persists API keys to the backend config store.
   * Backend contract: POST /api/config { apiKeys } → { success, config }
   * DB: UPDATE system_config SET api_keys = $1 WHERE id = 1
   */
  async saveConfig(
    apiKeys: string[],
    notifications?: ConfigState['notifications']
  ): Promise<{ success: boolean; config: ConfigState }> {
    return apiFetch(
      `${serviceUrl('config')}/api/config`,
      { method: 'POST', body: JSON.stringify({ apiKeys, notifications }) }
    );
  },

  // ── Report Service ────────────────────────────────────────────────────────

  /**
   * Fetches aggregated report data for a given time period.
   * Backend contract: GET /api/reports?period=xxx → ReportSummary
   * DB:
   *   MySQL:    SELECT asset_id, AVG(temp), MAX(temp), AVG(vib), MAX(vib)
   *             FROM telemetry WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
   *             GROUP BY asset_id
   *   Postgres: SELECT asset_id, AVG(temp), MAX(temp)
   *             FROM telemetry WHERE timestamp >= NOW() - INTERVAL '30 days'
   *             GROUP BY asset_id
   */
  async getReport(period: ReportPeriod): Promise<ReportSummary> {
    return apiFetch<ReportSummary>(
      `${serviceUrl('reports')}/api/reports?period=${period}`,
      { cache: 'no-store' }
    );
  },

  // ── Alarm Service ─────────────────────────────────────────────────────────

  /**
   * Acknowledges an alarm record by ID.
   * Backend contract: PATCH /api/alarms/:id/ack → { success }
   * DB: UPDATE alarms SET acknowledged_at = NOW(), acknowledged_by = $user WHERE id = $1
   */
  async acknowledgeAlarm(alarmId: string): Promise<{ success: boolean }> {
    return apiFetch(
      `${serviceUrl('alarms')}/api/alarms/${alarmId}/ack`,
      { method: 'PATCH' }
    );
  },

  // ── Asset Service ─────────────────────────────────────────────────────────

  /**
   * Fetches detailed asset info from the asset registry.
   * Backend contract: GET /api/assets/:id → Asset
   * DB: SELECT * FROM assets WHERE id = $1
   */
  async getAsset(assetId: string): Promise<unknown> {
    return apiFetch(
      `${serviceUrl('assets')}/api/assets/${assetId}`,
      { cache: 'no-store' }
    );
  },

  /**
   * Updates asset metadata (name, type, thresholds).
   * Backend contract: PUT /api/assets/:id → { success }
   * DB: UPDATE assets SET name = $1, type = $2, temp_limit = $3 WHERE id = $4
   */
  async updateAsset(assetId: string, data: Record<string, unknown>): Promise<{ success: boolean }> {
    return apiFetch(
      `${serviceUrl('assets')}/api/assets/${assetId}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

  /**
   * Updates vibration thresholds for an asset in PostgreSQL.
   */
  async updateAssetThresholds(tagId: string, warning: number, fault: number): Promise<{ success: boolean }> {
    return apiFetch(
      `${serviceUrl('assets')}/api/assets`,
      { 
        method: 'PATCH', 
        body: JSON.stringify({ tagId, vibLimitWarning: warning, vibLimitFault: fault }) 
      }
    );
  },

  // ── Auth & User Service ───────────────────────────────────────────────────

  /**
   * Retrieves the current user session data from the server.
   * Backend contract: GET /api/auth/session → { success, username, role }
   */
  async getCurrentSession(): Promise<{ success: boolean; username?: string; role?: string }> {
    // In this Next.js prototype, we use a server action as the internal API:
    const { getCurrentSessionAction } = await import('@/app/actions/auth');
    return getCurrentSessionAction();
  },

  /**
   * Fetches the list of all system users.
   * Backend contract: GET /api/users → { success, users: [] }
   * Auth: Admin only.
   */
  async fetchUsers(): Promise<{ success: boolean; users?: any[] }> {
    const { fetchUsersAction } = await import('@/app/actions/auth');
    return fetchUsersAction();
  },

  /**
   * Registers a new user account in the database.
   * Backend contract: POST /api/users → { success }
   * Auth: Admin only.
   */
  async createUser(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const { createUserAction } = await import('@/app/actions/auth');
    return createUserAction(formData);
  },

  // ── Integration Testing ───────────────────────────────────────────────────

  /**
   * Tests connectivity for a specific sensor provider and API key.
   * Path: /api/integration/test
   */
  async testIntegration(provider: string, apiKey: string): Promise<{ success: boolean; message: string; deviceCount?: number }> {
    return apiFetch(
      '/api/integration/test',
      { 
        method: 'POST', 
        body: JSON.stringify({ provider, apiKey }) 
      }
    );
  },

  /**
   * Tests notification connectivity for TG/WA.
   */
  async testNotification(channel: 'telegram' | 'whatsapp', data: any): Promise<{ success: boolean; message: string }> {
    return apiFetch(
      '/api/integration/notify-test',
      { 
        method: 'POST', 
        body: JSON.stringify({ channel, ...data }) 
      }
    );
  },
};
