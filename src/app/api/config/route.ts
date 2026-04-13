import { NextResponse } from 'next/server';
import { configDbState } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(configDbState);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (data.apiKeys && Array.isArray(data.apiKeys)) {
       configDbState.apiKeys = data.apiKeys;
    }
    return NextResponse.json({ success: true, config: configDbState });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
