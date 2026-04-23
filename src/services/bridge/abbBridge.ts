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
    
    // Credentials provided by PTTS admin
    const username = process.env.ABB_USERNAME;
    const password = process.env.ABB_PASSWORD;
    
    // Ensure credentials exist
    if (!username || !password) {
      throw new Error('ABB credentials are not configured in the environment.');
    }

    try {
      // Important: This simulates the CIAM login. Because ABB CIAM typically uses 
      // strict OAuth2 (Authorization Code with PKCE) for user logins in the browser,
      // server-to-server seamless login using username/password requires the
      // 'password' grant type to be enabled on the CIAM client configuration.
      const response = await axios.post(
        'https://accessmanagement.motion.abb.com/polaris/token',
        new URLSearchParams({
          grant_type: 'password',
          username: username,
          password: password,
          // client_id must be provided by the developer portal app registration
          client_id: process.env.ABB_CLIENT_ID || 'PENDING_APP_REGISTRATION',
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
      // Expire 1 minute before actual expiry to be safe
      this.tokenExpiry = Date.now() + ((data.expires_in - 60) * 1000);

      console.log('[ABB Bridge] Seamless login successful. JWT obtained.');
      return this.accessToken as string;

    } catch (error: any) {
      console.error('[ABB Bridge] Seamless login failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with ABB CIAM. Ensure the Client ID is configured and supports password grants.');
    }
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
