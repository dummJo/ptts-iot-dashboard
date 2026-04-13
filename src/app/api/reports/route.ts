import { NextRequest, NextResponse } from 'next/server';
import type { ReportPeriod, ReportSummary, AssetReportRow, TrendPoint } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getDateRange(period: ReportPeriod): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  const days: Record<ReportPeriod, number> = {
    daily:    1,
    weekly:   7,
    monthly:  30,
    '3months':  90,
    '6months': 180,
    '12months':365,
  };
  from.setDate(from.getDate() - days[period]);
  return { from, to };
}

/** 
 * Generate realistic-looking mock aggregated data.
 * In production: query PostgreSQL with GROUP BY asset_id in this range.
 */
function generateAssetRows(period: ReportPeriod): AssetReportRow[] {
  const multiplier: Record<ReportPeriod, number> = {
    daily: 1, weekly: 1.05, monthly: 1.1,
    '3months': 1.15, '6months': 1.2, '12months': 1.3,
  };
  const m = multiplier[period];

  return [
    {
      id: 'ABB-001', name: 'Pump Motor #1',    type: 'ABB SmartSensor',
      avgTemp: +(54.2 * m).toFixed(1), maxTemp: +(58.8 * m).toFixed(1),
      avgVib: +(3.2 * m).toFixed(2),  maxVib: +(4.1 * m).toFixed(2),
      uptime: 97.3, alarmCount: 2, link: 'online', health: 'warning',
    },
    {
      id: 'ABB-002', name: 'Crane Drive A',    type: 'ABB PowerTrain',
      avgTemp: +(59.1 * m).toFixed(1), maxTemp: +(63.5 * m).toFixed(1),
      avgVib: +(3.8 * m).toFixed(2),  maxVib: +(4.6 * m).toFixed(2),
      uptime: 88.1, alarmCount: 5, link: 'online', health: 'fault',
    },
    {
      id: 'RND-003', name: 'Compressor Unit',  type: 'RONDS SmartSensor',
      avgTemp: +(53.0 * m).toFixed(1), maxTemp: +(57.2 * m).toFixed(1),
      avgVib: +(2.7 * m).toFixed(2),  maxVib: +(3.3 * m).toFixed(2),
      uptime: 99.1, alarmCount: 1, link: 'online', health: 'warning',
    },
    {
      id: 'ABB-004', name: 'VSD Panel #3',     type: 'ABB SmartSensor',
      avgTemp: +(44.8 * m).toFixed(1), maxTemp: +(49.0 * m).toFixed(1),
      avgVib: +(1.5 * m).toFixed(2),  maxVib: +(2.0 * m).toFixed(2),
      uptime: 100, alarmCount: 0, link: 'online', health: 'good',
    },
    {
      id: 'RND-005', name: 'Fan Motor B',      type: 'RONDS SmartSensor',
      avgTemp: +(42.3 * m).toFixed(1), maxTemp: +(46.1 * m).toFixed(1),
      avgVib: +(1.2 * m).toFixed(2),  maxVib: +(1.8 * m).toFixed(2),
      uptime: 100, alarmCount: 0, link: 'offline', health: 'good',
    },
  ];
}

function generateTrend(period: ReportPeriod): TrendPoint[] {
  const points: Record<ReportPeriod, string[]> = {
    daily:    ['00:00','04:00','08:00','12:00','16:00','20:00','24:00'],
    weekly:   ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    monthly:  ['W1','W2','W3','W4'],
    '3months':['Jan','Feb','Mar'],
    '6months':['Oct','Nov','Dec','Jan','Feb','Mar'],
    '12months':['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
  };
  return points[period].map((t, i) => ({
    time: t,
    temp: +(50 + Math.sin(i * 0.8) * 4 + Math.random() * 2).toFixed(1),
    vib:  +(2.5 + Math.sin(i * 0.5) * 0.7 + Math.random() * 0.3).toFixed(2),
  }));
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const period = (req.nextUrl.searchParams.get('period') ?? 'monthly') as ReportPeriod;
  const validPeriods: ReportPeriod[] = ['daily','weekly','monthly','3months','6months','12months'];

  if (!validPeriods.includes(period)) {
    return NextResponse.json({ error: 'Invalid period parameter' }, { status: 400 });
  }

  const { from, to } = getDateRange(period);
  const assets = generateAssetRows(period);

  const report: ReportSummary = {
    period,
    dateRange: { from: fmtDate(from), to: fmtDate(to) },
    generatedAt: new Date().toISOString(),
    totalNodes: assets.length,
    avgUptime: +(assets.reduce((s, a) => s + a.uptime, 0) / assets.length).toFixed(1),
    totalAlarms: assets.reduce((s, a) => s + a.alarmCount, 0),
    criticalAlarms: 1,
    warningAlarms: 3,
    avgTemp: +(assets.reduce((s, a) => s + a.avgTemp, 0) / assets.length).toFixed(1),
    avgVib: +(assets.reduce((s, a) => s + a.avgVib, 0) / assets.length).toFixed(2),
    assets,
    trendData: generateTrend(period),
  };

  return NextResponse.json(report);
}
