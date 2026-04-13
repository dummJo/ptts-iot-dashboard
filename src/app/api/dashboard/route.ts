import { NextResponse } from 'next/server';
import {
  kpiData,
  trendData,
  statusData,
  topAssets,
  recentAlerts,
  vibrationBarData,
  configDbState,
  getLinkSummary,
  getHealthSummary,
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
  const isConnected = configDbState.apiKeys && configDbState.apiKeys.length > 0;
  
  return NextResponse.json({
    ...dashboardState,
    linkSummary: getLinkSummary(dashboardState.topAssets),
    healthSummary: getHealthSummary(dashboardState.topAssets),
    system: {
      connected: isConnected,
      lastSync: isConnected ? new Date().toISOString() : "Not Connected"
    }
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Allow partial updates to the dashboard state
    dashboardState = { ...dashboardState, ...data };
    
    const isConnected = configDbState.apiKeys && configDbState.apiKeys.length > 0;

    return NextResponse.json({ 
      success: true, 
      state: {
         ...dashboardState,
         linkSummary: getLinkSummary(dashboardState.topAssets),
         healthSummary: getHealthSummary(dashboardState.topAssets),
         system: {
           connected: isConnected,
           lastSync: isConnected ? new Date().toISOString() : "Not Connected"
         }
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
