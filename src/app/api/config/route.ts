import { NextResponse } from 'next/server';

/**
 * Config endpoint - proxies to NestJS backend.
 * Manages API keys and system configuration.
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
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

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const response = await fetchWithRetry(`${backendUrl}/api/config`);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Backend unavailable' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Config API] Backend error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config', details: String(error) },
      { status: 503 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.apiKeys || !Array.isArray(data.apiKeys)) {
      return NextResponse.json(
        { error: 'apiKeys must be an array' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const response = await fetchWithRetry(`${backendUrl}/api/config`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Backend error' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, config: result });
  } catch (error) {
    console.error('[Config API] Backend error:', error);
    return NextResponse.json(
      { error: 'Failed to save config', details: String(error) },
      { status: 503 }
    );
  }
}
