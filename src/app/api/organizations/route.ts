import { NextResponse } from 'next/server';
import { AbbBridge } from '@/services/bridge/abbBridge';

/**
 * DYNAMIC ORGANIZATION DISCOVERY
 * Purpose: Fetches authorized organizations directly from ABB CIAM/Powertrain Gateway.
 * Zero-touch: Any organization added in the ABB portal automatically appears here.
 */
export async function GET() {
  try {
    // 1. Initial Identity Scope (Demo Mode)
    const organizations = [
      { id: 'demo-mode', name: 'Live Demo', type: 'Demo' }
    ];

    // 2. Fetch Real Organizations from ABB Powertrain API
    try {
      console.log('[API Organizations] Pulling dynamic organizational scope from ABB CIAM...');
      
      const response = await AbbBridge.post('/api/organization/Organization/Search', {
        take: 100,
        skip: 0
      });

      if (response.data && Array.isArray(response.data.items)) {
        const realOrgs = response.data.items.map((item: any) => ({
          id: String(item.id || item.organizationId),
          name: item.name,
          type: 'Real'
        }));
        
        organizations.push(...realOrgs);
        console.log(`[API Organizations] Successfully discovered ${realOrgs.length} real organizations.`);
      }
    } catch (abbError: any) {
      console.error('[API Organizations] Dynamic fetch failed. Check AbbBridge credentials/connection.');
      // We don't fail the whole request, just return what we have (Demo) or return error if required.
    }

    return NextResponse.json({
      success: true,
      organizations: organizations
    });
  } catch (error: any) {
    console.error('[API Organizations] Fatal Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
