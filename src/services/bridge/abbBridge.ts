import axios from 'axios';

/**
 * ABB Powertrain API Bridge (v2)
 * Handles seamless SSO login for the PTTS backend to communicate with the ABB Gateway.
 */
export class AbbBridge {
  private static accessToken: string | null = null;
  private static tokenExpiry: number | null = null;

  /**
   * Retrieves a valid CIAM JWT Access Token.
   * If the current token is expired or null, it performs a seamless login
   * using the default PTTS credentials defined in the environment.
   */
  static async getAccessToken(): Promise<string> {
    // Return cached token if valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Force seamless login flow
    return await this.seamlessLogin();
  }

  /**
   * Performs the seamless login (Resource Owner Password Credentials flow)
   * to the ABB CIAM endpoint.
   * Note: The exact flow depends on the CIAM's configuration for the client application.
   * We are using the credentials provided by the user to exchange for a JWT.
   */
  private static async seamlessLogin(): Promise<string> {
    console.log('[ABB Bridge] Performing seamless login for ABB Powertrain API...');
    
    const username = process.env.ABB_USERNAME;
    const password = process.env.ABB_PASSWORD;
    const clientIds = [
      process.env.ABB_CLIENT_ID || '88691515-d913-43c3-b78b-333e6181b53e',
      'iB3nB9Vvn5t55Vff_123xATBEf4a' // Secondary Client ID found in portal
    ];
    
    if (!username || !password) {
      throw new Error('ABB credentials are not configured in the environment.');
    }

    let lastError = null;
    for (const client_id of clientIds) {
      try {
        console.log(`[ABB Bridge] Attempting login with Client ID: ${client_id}...`);
        const response = await axios.post(
          'https://accessmanagement.motion.abb.com/polaris/token',
          new URLSearchParams({
            grant_type: 'password',
            username: username,
            password: password,
            client_id: client_id,
            scope: 'openid'
          }).toString(),
          {
            headers: { 
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        const data = response.data;
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + ((data.expires_in - 60) * 1000);

        console.log('[ABB Bridge] Seamless login successful.');
        return this.accessToken as string;

      } catch (error: any) {
        lastError = error.response?.data || error.message;
        console.warn(`[ABB Bridge] Login failed for Client ID ${client_id}:`, lastError);
      }
    }

    throw new Error(`Failed to authenticate with ABB CIAM. Last error: ${JSON.stringify(lastError)}`);
  }

  /**
   * Helper to make an authenticated GET request to the Powertrain API.
   */
  static async get(endpointPath: string) {
    const token = await this.getAccessToken();
    const baseUrl = 'https://api.powertrain.abb.com';
    
    return axios.get(`${baseUrl}${endpointPath}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Helper to make an authenticated POST request to the Powertrain API.
   */
  static async post(endpointPath: string, payload: any) {
    const token = await this.getAccessToken();
    const baseUrl = 'https://api.powertrain.abb.com';
    
    return axios.post(`${baseUrl}${endpointPath}`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}
