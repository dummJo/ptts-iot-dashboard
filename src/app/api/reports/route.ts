import { NextRequest, NextResponse } from 'next/server';
import type { ReportPeriod } from '@/lib/types';

/**
 * Reports endpoint - proxies to NestJS backend.
 * Generates period-based reports from PostgreSQL aggregations.
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

export async function GET(req: NextRequest) {
  try {
    const period = (req.nextUrl.searchParams.get('period') ?? 'monthly') as ReportPeriod;
    const validPeriods: ReportPeriod[] = ['daily', 'weekly', 'monthly', '3months', '6months', '12months'];

    if (!validPeriods.includes(period)) {
      return NextResponse.json({ error: 'Invalid period parameter' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const response = await fetchWithRetry(`${backendUrl}/api/reports?period=${period}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Backend unavailable' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Reports API] Backend error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: String(error) },
      { status: 503 }
    );
  }
}
