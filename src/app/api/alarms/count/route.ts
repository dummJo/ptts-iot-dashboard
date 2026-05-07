import { ApiResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-guard';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || 'demo-mode';

    const [warningCount, criticalCount] = await Promise.all([
      prisma.alarm.count({
        where: { acknowledgedAt: null, severity: 'warning', asset: { organizationId: orgId } }
      }),
      prisma.alarm.count({
        where: { acknowledgedAt: null, severity: 'critical', asset: { organizationId: orgId } }
      }),
    ]);

    return ApiResponse.success({ warning: warningCount, critical: criticalCount });
  } catch (error) {
    console.error('[Alarm Count API] Error:', error);
    return ApiResponse.error('Failed to fetch alarm count');
  }
}
