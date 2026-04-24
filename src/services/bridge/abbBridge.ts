import axios from 'axios';

/**
 * ABB Powertrain API Bridge (v2.5)
 * DUMMVINCI HIGH-FREQUENCY IDENTITY SYNC
 * 
 * Features:
 * 1. Per-Request Integrity: Always ensures a fresh handshake if needed.
 * 2. Auto-Discovery: Rotates Client IDs dynamically upon failure.
 * 3. Reactive Recovery: Automatically re-authenticates and retries on 401/403 errors.
 */
export class AbbBridge {
  private static accessToken: string | null = null;
  private static tokenExpiry: number | null = null;
  private static lastDiscoveryId: string | null = null;

  /**
   * Internal method to obtain a token with aggressive validation.
   * If the token is older than 5 minutes (even if technically valid), 
   * we can force a refresh if the user wants "per-minute" or "per-request" freshness.
   */
  static async getAccessToken(forceRefresh = false): Promise<string> {
    const isStale = this.tokenExpiry && (Date.now() > this.tokenExpiry - (55 * 60 * 1000)); // Refresh if older than 5 mins
    
    if (forceRefresh || !this.accessToken || isStale) {
      console.log('[ABB Bridge] Token stale or missing. Initiating fresh identity handshake...');
      return await this.seamlessLogin();
    }
    return this.accessToken;
  }

  /**
   * Smart Discovery Handshake
   * Attempts to find a valid Client ID and Endpoint combination.
   */
  private static async seamlessLogin(): Promise<string> {
    const username = process.env.ABB_USERNAME;
    const password = process.env.ABB_PASSWORD;
    
    // Dynamic Client ID Registry
    const discoveryClientIds = [
      process.env.ABB_CLIENT_ID,
      'k2spGAvfEich60kU63_lz7Ogrwsa', 
      '88691515-d913-43c3-b78b-333e6181b53e',
      'iB3nB9Vvn5t55Vff_123xATBEf4a'
    ].filter(Boolean) as string[];

    const tokenEndpoints = [
      'https://polaris.iam.motion.abb.com/oauth2/token',
      'https://accessmanagement.motion.abb.com/polaris/token'
    ];

    if (!username || !password) throw new Error('ABB credentials missing.');

    let lastError: any = null;

    for (const endpoint of tokenEndpoints) {
      for (const client_id of discoveryClientIds) {
        try {
          const response = await axios.post(
            endpoint,
            new URLSearchParams({
              grant_type: 'password',
              username,
              password,
              client_id,
              scope: 'openid profile'
            }).toString(),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              timeout: 10000
            }
          );

          this.accessToken = response.data.access_token;
          this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
          this.lastDiscoveryId = client_id;

          console.log(`[ABB Bridge] Identity Synced. ClientID: [${client_id.slice(0,8)}...] via ${new URL(endpoint).hostname}`);
          return this.accessToken as string;

        } catch (error: any) {
          lastError = error.response?.data || error.message;
        }
      }
    }

    throw new Error(`Identity Discovery Failed. Last Error: ${JSON.stringify(lastError)}`);
  }

  /**
   * Authenticated GET with Reactive Retry
   */
  static async get(endpointPath: string, retryCount = 1): Promise<any> {
    try {
      const token = await this.getAccessToken();
      return await axios.get(`https://api.powertrain.abb.com${endpointPath}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error: any) {
      if ((error.response?.status === 401 || error.response?.status === 403) && retryCount > 0) {
        console.warn('[ABB Bridge] 401 Unauthorized detected. Forcing token rotation and retry...');
        await this.getAccessToken(true); // Force refresh
        return this.get(endpointPath, retryCount - 1);
      }
      throw error;
    }
  }

  /**
   * Authenticated POST with Reactive Retry
   */
  static async post(endpointPath: string, payload: any, retryCount = 1): Promise<any> {
    try {
      const token = await this.getAccessToken();
      return await axios.post(`https://api.powertrain.abb.com${endpointPath}`, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      if ((error.response?.status === 401 || error.response?.status === 403) && retryCount > 0) {
        console.warn('[ABB Bridge] 401 Unauthorized detected. Forcing token rotation and retry...');
        await this.getAccessToken(true); // Force refresh
        return this.post(endpointPath, payload, retryCount - 1);
      }
      throw error;
    }
  }
}
