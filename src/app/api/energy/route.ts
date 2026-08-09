import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-guard';
import { EnergyService, resolveTariff, MAX_RANGE_DAYS, DEFAULT_TARIFF } from '@/services/energyService';
import type { EnergyRangeKey, TariffConfig } from '@/lib/types';

/**
 * GET /api/energy?orgId=&range=today|7d|30d|custom&from=&to=
 *
 * Returns an EnergySummary: load profile, WBP/LWBP split, cost, CO₂, peak
 * demand and a per-asset breakdown, for one organization.
 */

const DAY_MS = 86_400_000;

function resolveRange(
  key: EnergyRangeKey,
  fromParam: string | null,
  toParam: string | null,
  tariff: TariffConfig,
): { from: Date; to: Date; label: string } | { error: string } {
  const now = new Date();

  if (key === 'custom') {
    if (!fromParam || !toParam) {
      return { error: 'Custom range requires both `from` and `to`' };
    }
    const from = new Date(fromParam);
    const to = new Date(toParam);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return { error: 'Invalid `from` or `to` — expected an ISO 8601 date' };
    }
    if (to <= from) {
      return { error: '`to` must be later than `from`' };
    }
    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
      return { error: `Range exceeds the ${MAX_RANGE_DAYS}-day limit` };
    }
    return { from, to, label: 'Custom range' };
  }

  if (key === 'today') {
    // Local midnight in the tariff timezone, expressed back in UTC.
    const shifted = new Date(now.getTime() + tariff.utcOffsetMinutes * 60_000);
    shifted.setUTCHours(0, 0, 0, 0);
    const from = new Date(shifted.getTime() - tariff.utcOffsetMinutes * 60_000);
    return { from, to: now, label: 'Today' };
  }

  const days = key === '7d' ? 7 : 30;
  return {
    from: new Date(now.getTime() - days * DAY_MS),
    to: now,
    label: `Last ${days} days`,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;

    const sp = req.nextUrl.searchParams;
    const orgId = sp.get('orgId') || 'demo-mode';
    const rangeKey = (sp.get('range') || '7d') as EnergyRangeKey;

    if (!['today', '7d', '30d', 'custom'].includes(rangeKey)) {
      return ApiResponse.badRequest(`Unknown range '${rangeKey}'`);
    }

    // Tariff first — it defines the timezone the range is anchored to.
    let tariff = DEFAULT_TARIFF;
    try {
      const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
      tariff = resolveTariff(config?.settings ?? null);
    } catch (err) {
      // A config read failure must not take the whole page down; fall back to
      // the placeholder tariff, which is already flagged isDefault.
      console.warn('[Energy API] Tariff lookup failed, using defaults:', err);
    }

    const range = resolveRange(rangeKey, sp.get('from'), sp.get('to'), tariff);
    if ('error' in range) return ApiResponse.badRequest(range.error);

    const summary = await EnergyService.getSummary({
      orgId,
      from: range.from,
      to: range.to,
      tariff,
      label: range.label,
    });

    return ApiResponse.success(summary);
  } catch (error) {
    console.error('[Energy API] Error:', error);
    return ApiResponse.error('Failed to compute energy summary');
  }
}
