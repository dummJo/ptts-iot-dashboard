import { NextResponse } from 'next/server';

/**
 * Standard API Response Wrapper
 * ─────────────────────────────────────────────────────────────────────────────
 * Ensures all API responses follow a predictable contract:
 * { success: boolean, data?: T, error?: string, timestamp: string }
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export class Response {
  static success<T>(data: T, status = 200) {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { status });
  }

  static error(message: string, status = 500) {
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    }, { status });
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  static badRequest(message = 'Bad Request') {
    return this.error(message, 400);
  }
}
