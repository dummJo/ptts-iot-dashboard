import { NextResponse } from 'next/server';
import {
  kpiData,
  trendData,
  statusData,
  topAssets,
  recentAlerts,
  vibrationBarData,
} from '@/lib/mock-data';

// In-memory data store using the mock data as the initial state
let dashboardState = {
  kpiData,
  trendData,
  statusData,
  topAssets,
  recentAlerts,
  vibrationBarData,
};

export async function GET() {
  return NextResponse.json(dashboardState);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Allow partial updates to the dashboard state
    dashboardState = { ...dashboardState, ...data };
    return NextResponse.json({ success: true, state: dashboardState });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
