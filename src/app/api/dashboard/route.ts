import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';
import type { DashboardData, TrendPoint, Asset, Alarm } from '@/lib/types';

/**
 * Dashboard Overview API - Powered by PostgreSQL
 * Pulls assets, telemetry history, and triggers the Alarm Engine.
 */
export async function GET() {
  try {
    // 1. Fetch Assets with latest telemetry
    const assetsData = await prisma.asset.findMany({
      include: {
        telemetries: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    // 2. ⚡ ALARM ENGINE: Check violations on-the-fly
    for (const asset of assetsData) {
      const latest = asset.telemetries[0];
      if (!latest) continue;

      const limits = {
        warning: asset.vibLimitWarning || 4.5,
        fault: asset.vibLimitFault || 7.1
      };

      // Determine if there's a violation
      let severity: 'critical' | 'warning' | null = null;
      let msg = '';
      
      const vib = latest.vibOverall ?? 0;
      
      if (vib >= limits.fault) {
        severity = 'critical';
        msg = `Vibration Fault: ${vib.toFixed(2)}mm/s exceeded limit ${limits.fault}mm/s`;
      } else if (vib >= limits.warning) {
        severity = 'warning';
        msg = `Vibration Warning: ${vib.toFixed(2)}mm/s exceeded limit ${limits.warning}mm/s`;
      }

      if (severity) {
        // Check if unacknowledged alarm already exists for this asset & severity
        const existing = await prisma.alarm.findFirst({
          where: {
            assetId: asset.id,
            severity,
            acknowledgedAt: null
          }
        });

        if (!existing) {
          await prisma.alarm.create({
            data: {
              assetId: asset.id,
              alarmType: 'Vibration',
              severity,
              message: msg,
              timestamp: new Date()
            }
          });
          
          // ⚡ EXTERNAL NOTIFICATION TRIGGER (WhatsApp / Telegram)
          await NotificationService.sendAlert(msg);
          
          console.log(`🚨 Alarm Triggered: ${asset.tagId} - ${msg}`);
        }
      }
    }

    // 3. Fetch Trend (Last 24 points aggregated)
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

    // 4. Transform Assets for Frontend
    const topAssets: Asset[] = assetsData.map(a => {
      const latest = a.telemetries[0] || {};
      return {
        id: a.tagId,
        name: a.name,
        type: a.type,
        temp: latest.temp || 0,
        vib: latest.vibOverall || 0,
        link: a.telemetries.length > 0 ? 'online' : 'offline',
        health: 'good', // Frontend recalculates health color based on thresholds returned below
        powerKW: a.powerKw || 0,
        foundation: (a.foundationType as 'rigid' | 'flexible') || 'rigid',
        vibrationThresholds: {
          warning: a.vibLimitWarning || 4.5,
          fault: a.vibLimitFault || 7.1
        }
      };
    });

    // 5. Fetch Active Alarms after Engine run
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

    // 6. Build Final Response
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
          value: (topAssets.reduce((sum, a) => sum + a.vib, 0) / (topAssets.length || 1)).toFixed(2),
          unit: "mm/s",
          sub: "General site health",
          trend: "Real-time sync",
          trendUp: true,
          color: "var(--ptts-teal)",
          ledClass: "led-online"
        },
        {
          label: "AVG TEMP",
          value: (topAssets.reduce((sum, a) => sum + a.temp, 0) / (topAssets.length || 1)).toFixed(0),
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
