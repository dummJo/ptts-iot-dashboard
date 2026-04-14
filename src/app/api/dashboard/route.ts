import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Dashboard endpoint - pulls real data from PostgreSQL.
 * Provides assets and their latest telemetry status.
 */
export async function GET() {
  try {
    // 1. Fetch all assets
    const assetsData = await prisma.asset.findMany({
      include: {
        telemetries: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    // 2. Format data for the dashboard overview
    // If telemetry is missing, we provide a safe fallback object
    const assets = assetsData.map(asset => {
      const latest = asset.telemetries[0] || {};
      return {
        id: asset.tagId,
        name: asset.name,
        type: asset.type,
        location: asset.location,
        status: asset.telemetries.length > 0 ? 'online' : 'offline',
        metrics: {
          temp: latest.temp ?? 0,
          vibration: latest.vibOverall ?? 0,
          velocity: latest.vibVelocity ?? 0,
          current: latest.motorCurrent ?? 0,
          load: latest.motorKw ?? 0,
        },
        lastUpdate: latest.timestamp ? latest.timestamp.toISOString() : new Date().toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalAssets: assets.length,
        criticalAlarms: 0, // Placeholder for future alarm count
      },
      assets
    });

  } catch (error) {
    console.error('[Dashboard API] Database error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}
