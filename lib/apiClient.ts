/**
 * Centralized API Client for PTTS IoT Dashboard
 *
 * Use this service to connect to external backends (Express.js, NestJS, etc.)
 * Update NEXT_PUBLIC_API_BASE_URL in your .env file to point to your new backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const apiClient = {
  /**
   * Fetches all dashboard telemetry data
   */
  async getDashboardData() {
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
  async pushTelemetryData(data: any) {
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
  }
};
