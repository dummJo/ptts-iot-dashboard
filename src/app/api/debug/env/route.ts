import { NextResponse } from 'next/server';

/**
 * ELITE DIAGNOSTIC ENDPOINT
 * Purpose: Verify environment variable visibility for the Next.js server runtime.
 */
export async function GET() {
  const envKeys = Object.keys(process.env);
  
  const diagnostic = {
    runtime: 'Node.js',
    timestamp: new Date().toISOString(),
    visibility: {
      ABB_USERNAME: !!process.env.ABB_USERNAME,
      ABB_PASSWORD: !!process.env.ABB_PASSWORD,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
    },
    loadedKeysCount: envKeys.length,
    // Redacted check for the first few chars to prove it's the right value without leaking it
    precheck: {
      userPrefix: process.env.ABB_USERNAME ? process.env.ABB_USERNAME.substring(0, 3) : 'NONE'
    }
  };

  return NextResponse.json(diagnostic);
}
