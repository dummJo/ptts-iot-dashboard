/**
 * Centralized API Client for PTTS IoT Dashboard
 *
 * Use this service to connect to external backends (Express.js, NestJS, etc.)
 * Update NEXT_PUBLIC_API_BASE_URL in your .env file to point to your new backend.
 */

import type { DashboardData, ConfigState } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const apiClient = {
  /**
   * Fetches all dashboard telemetry data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        // Remove no-store if the backend provides proper cache headers,
        // but for real-time SCADA/IoT, cache should be disabled.
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error("API Client Error (getDashboardData):", error);
      throw error;
    }
  },

  /**
   * Pushes new telemetry data to the backend
   */
  async pushTelemetryData(data: Partial<DashboardData>): Promise<{ success: boolean; state: DashboardData }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      console.error("API Client Error (pushTelemetryData):", error);
      throw error;
    }
  },

  /**
   * Fetches the current API system configuration
   */
  async getConfig(): Promise<ConfigState> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/config`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to load config");
      return await res.json();
    } catch (error) {
      console.error("API Client Error (getConfig):", error);
      throw error;
    }
  },

  /**
   * Saves API Keys to the backend mock DB
   */
  async saveConfig(apiKeys: string[]): Promise<{ success: boolean; config: ConfigState }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys }),
      });
      return await res.json();
    } catch (error) {
      console.error("API Client Error (saveConfig):", error);
      throw error;
    }
  }
};
