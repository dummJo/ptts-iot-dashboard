import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load local environment in all runtimes
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * DUMMVINCI IDENTITY SERVICE (v3.5 - DYNAMIC DISCOVERY)
 * 
 * Objective: Zero-Touch Token Management. 
 * This service automatically handles the non-static nature of ABB Client IDs
 * by performing a multi-endpoint discovery handshake on every session refresh.
 */

export interface AuthSession {
  token: string;
  expiresAt: number;
  clientId: string;
}

let currentSession: AuthSession | null = null;

/**
 * ⚡ MASTER IDENTITY FUNCTION
 * Call this whenever you need a valid Bearer Token.
 * It handles discovery, rotation, and lifecycle automatically.
 */
export async function getDynamicBearerToken(): Promise<string> {
  const now = Date.now();

  // 1. Return cached session if still highly valid (5-minute safety buffer)
  if (currentSession && now < currentSession.expiresAt - 300000) {
    return currentSession.token;
  }

  // 2. Perform Dynamic Identity Handshake using API Key
  const credentials = {
    client_id: process.env.ABB_CLIENT_ID,
    client_secret: process.env.ABB_CLIENT_SECRET
  };

  if (!credentials.client_id) {
    throw new Error('IDENTITY_ERROR: ABB_CLIENT_ID missing in environment.');
  }
  if (!credentials.client_secret) {
    throw new Error('IDENTITY_ERROR: ABB_CLIENT_SECRET missing in environment.');
  }

  // Known Identity Providers & Client Registry (Discovery Pool)
  const endpoints = [
    'https://api.accessmanagement.motion.abb.com/polaris/oidc/token',
    'https://polaris.iam.motion.abb.com/oauth2/token'
  ];

  const clientPool = [
    credentials.client_id
  ];

  console.log('[IDENTITY] Initiating dynamic discovery for new Bearer Token...');

  for (const url of endpoints) {
    for (const client_id of clientPool) {
      try {
        const response = await axios.post(url, 
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: client_id as string,
            client_secret: credentials.client_secret as string,
            scope: 'openid'
          }).toString(),
          { 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000 
          }
        );

          const { access_token, expires_in } = response.data;
          
          currentSession = {
            token: access_token,
            expiresAt: Date.now() + (expires_in * 1000),
            clientId: client_id as string
          };

          console.log(`[IDENTITY] Verified via API Key | ID: ${client_id}`);
          return access_token;

        } catch (error: any) {
          const data = error.response?.data;
          const errorDesc = data?.error_description || '';
          
          if (errorDesc.includes('locked')) {
            console.error(`[IDENTITY] SECURITY ALERT: ${errorDesc}`);
            throw new Error(`ACCOUNT_LOCKED: ${errorDesc}`);
          }
        }
      }
    }

  throw new Error('IDENTITY_DISCOVERY_FAILED: Handshake rejected by all gateways.');
}

/**
 * ⚡ REACTIVE RETRY WRAPPER
 * Executes a function and retries once if a 401/403 is encountered.
 */
export async function withDynamicAuth(fn: (token: string) => Promise<any>): Promise<any> {
  try {
    const token = await getDynamicBearerToken();
    return await fn(token);
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('[IDENTITY] Session invalidated by remote. Forcing fresh discovery...');
      currentSession = null; // Clear cache
      const newToken = await getDynamicBearerToken();
      return await fn(newToken);
    }
    throw error;
  }
}
