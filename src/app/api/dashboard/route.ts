import { NextResponse } from 'next/server';

/**
 * Dashboard endpoint - proxies to NestJS backend.
 * Implements retry logic for transient failures.
 */
async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (response.ok || response.status < 500) {
        return response;
      }

      // Retry on 5xx errors
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed after retries');
}

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const response = await fetchWithRetry(`${backendUrl}/api/dashboard`);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Backend unavailable', details: response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Dashboard API] Backend error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: String(error) },
      { status: 503 }
    );
  }
}
