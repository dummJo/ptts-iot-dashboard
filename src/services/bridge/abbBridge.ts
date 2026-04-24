import axios, { AxiosInstance } from 'axios';
import { getDynamicBearerToken, withDynamicAuth } from './identityService';

/**
 * ABB POWERTRAIN API BRIDGE — ENTERPRISE INTEGRATION LAYER (v3.5)
 * 
 * Strategy: Decoupled Dynamic Identity Handshake
 * Now relies on IdentityService for zero-touch Client ID discovery.
 */
export class AbbBridge {
  private static instance: AxiosInstance | null = null;

  /**
   * Initializes or retrieves the singleton Axios instance.
   */
  private static getClient(): AxiosInstance {
    if (this.instance) return this.instance;

    this.instance = axios.create({
      baseURL: 'https://api.powertrain.abb.com',
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return this.instance;
  }

  /**
   * Public access for diagnostic/test purposes.
   */
  public static async getAccessToken(): Promise<string> {
    return await getDynamicBearerToken();
  }

  /**
   * STANDARDIZED API INTERFACE WITH DYNAMIC AUTH WRAPPER
   */
  static async get(path: string) {
    return withDynamicAuth(async (token) => {
      return this.getClient().get(path, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    });
  }

  static async post(path: string, data: any) {
    return withDynamicAuth(async (token) => {
      return this.getClient().post(path, data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    });
  }

  static async patch(path: string, data: any) {
    return withDynamicAuth(async (token) => {
      return this.getClient().patch(path, data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    });
  }
}
