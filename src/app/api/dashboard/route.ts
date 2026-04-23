import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TelemetryService } from '@/services/telemetryService';
import { AbbBridge } from '@/services/bridge/abbBridge';
import { Response } from '@/lib/api-response';
import { formatLocalNumber } from '@/lib/utils';
import type { DashboardData, TrendPoint, Asset, Alarm } from '@/lib/types';

/**
 * Dashboard Overview API - Powered by PostgreSQL
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || 'demo-mode';

    // 1. If it's a Real Organization, ensure we have assets for it
    if (orgId !== 'demo-mode') {
      const existingAssets = await prisma.asset.count({ where: { organizationId: orgId } });
      if (existingAssets === 0) {
        console.log(`[Dashboard API] New Organization detected (${orgId}). Triggering sync...`);
        // Trigger a background sync (Conceptually)
        // For now, let's call a sync method directly (simplified)
        try {
          const response = await AbbBridge.post('/api/asset/Asset/Search', {
            organizationIds: [orgId],
            take: 100,
            skip: 0
          });
          
          if (response.data && Array.isArray(response.data.items)) {
            for (const abbAsset of response.data.items) {
              const asset = await prisma.asset.upsert({
                where: { tagId: abbAsset.serialNumber },
                update: { 
                  organizationId: orgId,
                  updatedAt: new Date()
                },
                create: {
                  tagId: abbAsset.serialNumber,
                  name: abbAsset.name || `ABB Asset ${abbAsset.serialNumber}`,
                  type: abbAsset.assetType || 'Motor',
                  organizationId: orgId,
                  organizationName: "ABB Organization",
                  vibLimitWarning: 4.5,
                  vibLimitFault: 7.1
                }
              });

              // 2. Fetch Last Known Telemetry for this asset
              try {
                const telemetryRes = await AbbBridge.get(`/api/timeseries/Timeseries/LastKnown/${abbAsset.id}`);
                const tData = telemetryRes.data;
                
                if (tData) {
                  await prisma.telemetry.create({
                    data: {
                      assetId: asset.id,
                      timestamp: tData.timestamp ? new Date(tData.timestamp) : new Date(),
                      temp: tData.Temperature || 0,
                      vibOverall: tData.VibrationOverall || 0,
                      vibVelocity: tData.VibrationRms || 0,
                      motorCurrent: tData.MotorCurrent || 0,
                      rawPayload: tData
                    }
                  });
                }
              } catch (tError) {
                console.warn(`[Dashboard API] Could not fetch telemetry for asset ${abbAsset.id}:`, tError);
              }
            }
          }
        } catch (syncError) {
          console.error('[Dashboard API] Sync failed:', syncError);
        }
      }
    }

    const assetsData = await TelemetryService.getLatestState(orgId);

    // Fetch Trend Data (MTR-001 or fallback)
    let trendAsset = await prisma.asset.findFirst({
       where: { tagId: 'MTR-001' },
       include: {
         telemetries: { orderBy: { timestamp: 'desc' }, take: 24 }
       }
    });

    if (!trendAsset || trendAsset.telemetries.length === 0) {
      trendAsset = await prisma.asset.findFirst({
        include: {
          telemetries: { orderBy: { timestamp: 'desc' }, take: 24 }
        }
      });
    }

    const trendData: TrendPoint[] = (trendAsset?.telemetries || []).reverse().map(t => ({
      time: t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: t.temp || 0,
      vib: t.vibOverall || 0,
      velocity: t.vibVelocity || 0,
      current: t.motorCurrent || 0,
    }));

    const topAssets: Asset[] = assetsData.map(a => {
      const latest = a.telemetries[0] || {};
      return {
        id: a.tagId,
        name: a.name,
        type: a.type,
        temp: latest.temp || 0,
        vib: latest.vibOverall || 0,
        link: a.telemetries.length > 0 ? 'online' : 'offline',
        health: 'good', 
        powerKW: a.powerKw || 0,
        foundation: (a.foundationType as 'rigid' | 'flexible') || 'rigid',
        vibrationThresholds: {
          warning: a.vibLimitWarning || 4.5,
          fault: a.vibLimitFault || 7.1
        }
      };
    });

    const activeAlarms = await prisma.alarm.findMany({
      where: { acknowledgedAt: null },
      include: { asset: true },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    const recentAlerts: Alarm[] = activeAlarms.map(al => ({
      id: al.id,
      asset: al.asset.tagId,
      type: al.alarmType,
      severity: al.severity as any,
      message: al.message,
      time: al.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

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
          label: "AVG VIBRATION",
          value: formatLocalNumber(topAssets.reduce((sum, a) => sum + a.vib, 0) / (topAssets.length || 1), 2),
          unit: "mm/s",
          sub: "General site health",
          trend: "Real-time sync",
          trendUp: true,
          color: "var(--ptts-teal)",
          ledClass: "led-online"
        },
        {
          label: "AVG TEMP",
          value: formatLocalNumber(topAssets.reduce((sum, a) => sum + a.temp, 0) / (topAssets.length || 1), 0),
          unit: "°C",
          sub: `Ambient: 28°C`,
          trend: "Stable",
          trendUp: true,
          color: "var(--ptts-teal)",
          ledClass: "led-online"
        },
        {
          label: "ACTIVE ALARMS",
          value: recentAlerts.length.toString(),
          unit: "EVENTS",
          sub: recentAlerts.length > 0 ? `${recentAlerts.length} active violations` : "System stable",
          trend: "Real-time sync",
          trendUp: false,
          color: recentAlerts.length > 0 ? "var(--fault)" : "var(--ptts-teal)",
          ledClass: recentAlerts.length > 0 ? "led-fault" : "led-online"
        }
      ],
      trendData,
      statusData: [],
      linkSummary: {
        online: topAssets.filter(a => a.link === 'online').length,
        offline: topAssets.filter(a => a.link === 'offline').length,
      },
      healthSummary: {
        good: topAssets.length - recentAlerts.filter(al => al.severity !== 'info').length,
        warning: recentAlerts.filter(al => al.severity === 'warning').length,
        fault: recentAlerts.filter(al => al.severity === 'critical').length
      },
      topAssets,
      recentAlerts,
      vibrationBarData: topAssets.map(a => ({ name: a.id, value: a.vib })),
      system: {
        connected: assetsData.length > 0,
        lastSync: assetsData.reduce((latest, a) => {
          const t = a.telemetries[0]?.timestamp;
          if (!t) return latest;
          return t > latest ? t : latest;
        }, new Date(0)).toISOString()
      }
    };

    return Response.success(data);
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return Response.error('Failed to fetch dashboard data');
  }
}

/**
 * MQTT Data Ingestion - Receives batch data from MQTT bridge
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    if (!payload.data || !Array.isArray(payload.data)) {
      return Response.badRequest('Invalid payload format');
    }

    const processedCount = await TelemetryService.ingestBatch(payload.data);

    return Response.success({ 
      processed: processedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Dashboard Ingestion] Error:', error);
    return Response.error('Ingestion failed');
  }
}
