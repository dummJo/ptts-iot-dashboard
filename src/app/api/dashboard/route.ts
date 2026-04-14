import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { DashboardData, TrendPoint, Asset, KPIItem, Alarm } from '@/lib/types';

/**
 * Dashboard Overview API - Powered by PostgreSQL
 * Pulls assets, telemetry history, and system status.
 */
export async function GET() {
  try {
    // 1. Fetch Assets with latest telemetry & alarms
    const assetsData = await prisma.asset.findMany({
      include: {
        telemetries: {
          orderBy: { timestamp: 'desc' },
          take: 1
        },
        alarms: {
          where: { acknowledgedAt: null },
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    });

    // 2. Fetch Global Trend (Last 24 points aggregated)
    // For simplicity in this bridge, we'll take the first asset's history as the "Main Trend"
    // In a real multi-asset aggregator, we would use a Prisma GroupBy or Raw Query.
    const mainAsset = await prisma.asset.findFirst({
       where: { tagId: 'MTR-001' },
       include: {
         telemetries: {
           orderBy: { timestamp: 'desc' },
           take: 24
         }
       }
    });

    const trendData: TrendPoint[] = (mainAsset?.telemetries || []).reverse().map(t => ({
      time: t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: t.temp || 0,
      vib: t.vibOverall || 0,
      velocity: t.vibVelocity || 0,
      current: t.motorCurrent || 0,
    }));

    // 3. Transform Assets for Frontend
    const topAssets: Asset[] = assetsData.map(a => {
      const latest = a.telemetries[0] || {};
      return {
        id: a.tagId,
        name: a.name,
        type: a.type,
        temp: latest.temp || 0,
        vib: latest.vibOverall || 0,
        link: a.telemetries.length > 0 ? 'online' : 'offline',
        health: 'good', // Fallback, frontend recalculates based on ISO 10816
        powerKW: a.powerKw || 0,
        foundation: (a.foundationType as 'rigid' | 'flexible') || 'rigid',
        vibrationThresholds: {
          warning: a.vibLimitWarning || 4.5,
          fault: a.vibLimitFault || 7.1
        }
      };
    });

    // 4. Transform Alarms
    const recentAlerts: Alarm[] = assetsData.flatMap(a => (a.alarms || []).map(al => ({
      id: al.id,
      asset: a.tagId,
      type: al.alarmType,
      severity: al.severity as any,
      message: al.message,
      time: al.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }))).sort((x, y) => y.time.localeCompare(x.time)).slice(0, 10);

    // 5. Construct Dashboard Response
    const data: DashboardData = {
      kpiData: [
        {
          label: "TOTAL NODES",
          value: topAssets.length.toString(),
          unit: "/ 200",
          sub: "System capacity at 1.5%",
          trend: "Stationary",
          trendUp: true,
          color: "var(--ptts-teal)",
          ledClass: "led-online"
        },
        {
          label: "ACTIVE ALARMS",
          value: recentAlerts.length.toString(),
          unit: "EVENTS",
          sub: "Requires attention",
          trend: "Review needed",
          trendUp: false,
          color: recentAlerts.length > 0 ? "var(--fault)" : "var(--ptts-teal)",
          ledClass: recentAlerts.length > 0 ? "led-fault" : "led-online"
        },
        {
          label: "AVG VIBRATION",
          value: (topAssets.reduce((sum, a) => sum + a.vib, 0) / (topAssets.length || 1)).toFixed(2),
          unit: "mm/s",
          sub: "General site health",
          trend: "+0.2% from prev",
          trendUp: true,
          color: "var(--ptts-teal)",
          ledClass: "led-online"
        },
        {
          label: "AVG TEMP",
          value: (topAssets.reduce((sum, a) => sum + a.temp, 0) / (topAssets.length || 1)).toFixed(0),
          unit: "°C",
          sub: "Ambient: 28°C",
          trend: "Stable",
          trendUp: true,
          color: "var(--ptts-teal)",
          ledClass: "led-online"
        }
      ],
      trendData,
      statusData: [],
      linkSummary: {
        online: topAssets.filter(a => a.link === 'online').length,
        offline: topAssets.filter(a => a.link === 'offline').length,
      },
      healthSummary: {
        good: topAssets.length,
        warning: 0,
        fault: 0
      },
      topAssets,
      recentAlerts,
      vibrationBarData: topAssets.map(a => ({ name: a.id, value: a.vib })),
      system: {
        connected: true,
        lastSync: new Date().toISOString()
      }
    };

    return NextResponse.json(data);

  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch industrial data' },
      { status: 500 }
    );
  }
}
