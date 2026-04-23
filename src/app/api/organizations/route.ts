import { NextResponse } from 'next/server';
import { AbbBridge } from '@/services/bridge/abbBridge';

export async function GET() {
  try {
    // 1. Define the Demo Mode organization as the primary/default option
    const demoOrg = { id: 'demo-mode', name: 'Live Demo', type: 'Demo' };

    // 2. Fetch real organizations from ABB CIAM
    let realOrgs: any[] = [];
    try {
      // Use the search endpoint to find all organizations linked to the account
      const response = await AbbBridge.post('/api/organization/Organization/Search', {
        take: 100,
        skip: 0
      });

      if (response.data && Array.isArray(response.data.items)) {
        realOrgs = response.data.items.map((item: any) => ({
          id: item.id || item.organizationId,
          name: item.name,
          type: 'Real'
        }));
      }
    } catch (abbError: any) {
      console.warn('[ABB API] Could not fetch real organizations, falling back to demo only:', abbError.message);
      // We still want the app to work with demo mode even if ABB API fails
    }

    // Combine them, putting Demo Mode at the top
    return NextResponse.json({
      success: true,
      organizations: [demoOrg, ...realOrgs]
    });
  } catch (error: any) {
    console.error('[API Organizations] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
