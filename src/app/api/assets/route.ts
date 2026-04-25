import { AssetService } from '@/services/assetService';
import { Response } from '@/lib/api-response';

/**
 * Asset Management API
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || 'demo-mode';

    const assets = await AssetService.getAll(orgId);
    return Response.success({ assets });
  } catch (error) {
    console.error('[Asset API] Error:', error);
    return Response.error('Failed to fetch assets');
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const asset = await AssetService.create(data);
    return Response.success({ asset });
  } catch (error) {
    console.error('[Asset API] Create error:', error);
    return Response.error('Failed to create asset');
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const { tagId, vibLimitWarning, vibLimitFault } = data;

    if (!tagId) {
      return Response.badRequest('tagId is required');
    }

    const updated = await AssetService.updateThresholds(
      tagId, 
      vibLimitWarning !== undefined ? parseFloat(vibLimitWarning) : undefined,
      vibLimitFault !== undefined ? parseFloat(vibLimitFault) : undefined
    );

    return Response.success({ asset: updated });
  } catch (error) {
    console.error('[Asset API] Update error:', error);
    return Response.error('Failed to update asset thresholds');
  }
}
