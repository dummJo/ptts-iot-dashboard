import { AssetService } from '@/services/assetService';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || 'demo-mode';

    const assets = await AssetService.getAll(orgId);
    return ApiResponse.success({ assets });
  } catch (error) {
    console.error('[Asset API] Error:', error);
    return ApiResponse.error('Failed to fetch assets');
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth('admin');
    if (!auth.authenticated) return auth.response;
    const data = await req.json();
    const asset = await AssetService.create(data);
    return ApiResponse.success({ asset });
  } catch (error) {
    console.error('[Asset API] Create error:', error);
    return ApiResponse.error('Failed to create asset');
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;
    const data = await req.json();
    const { tagId, vibLimitWarning, vibLimitFault } = data;

    if (!tagId) {
      return ApiResponse.badRequest('tagId is required');
    }

    const updated = await AssetService.updateThresholds(
      tagId, 
      vibLimitWarning !== undefined ? parseFloat(vibLimitWarning) : undefined,
      vibLimitFault !== undefined ? parseFloat(vibLimitFault) : undefined
    );

    return ApiResponse.success({ asset: updated });
  } catch (error) {
    console.error('[Asset API] Update error:', error);
    return ApiResponse.error('Failed to update asset thresholds');
  }
}
