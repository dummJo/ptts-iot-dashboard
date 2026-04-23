import { NextResponse } from 'next/server';
import { AbbBridge } from '@/services/bridge/abbBridge';

export async function GET() {
  try {
    // 1. Define the Demo Mode organization
    const demoOrg = { id: 'demo-mode', name: 'Live Demo', type: 'Demo' };

    // 2. Define the known real organizations (verified from portal)
    const verifiedOrgs = [
      { id: '340494', name: 'PT Cabot', type: 'Real' },
      { id: '337963', name: 'PT Amerta Indah Otsuka', type: 'Real' },
      { id: '340061', name: 'PT.WKP', type: 'Real' },
      { id: '336281', name: 'SmSe_PTTS', type: 'Real' }
    ];

    // 3. Attempt to fetch dynamically from ABB CIAM (as dynamic fallback)
    let dynamicOrgs: any[] = [];
    try {
      const response = await AbbBridge.post('/api/organization/Organization/Search', {
        take: 100,
        skip: 0
      });

      if (response.data && Array.isArray(response.data.items)) {
        dynamicOrgs = response.data.items.map((item: any) => ({
          id: item.id || item.organizationId,
          name: item.name,
          type: 'Real'
        }));
      }
    } catch (abbError: any) {
      console.warn('[ABB API] Could not fetch real organizations dynamically:', abbError.message);
    }

    // Combine them, ensuring known verified ones are present
    // Use a Map to deduplicate by ID
    const orgMap = new Map();
    [demoOrg, ...verifiedOrgs, ...dynamicOrgs].forEach(org => {
      orgMap.set(org.id, org);
    });

    return NextResponse.json({
      success: true,
      organizations: Array.from(orgMap.values())
    });
  } catch (error: any) {
    console.error('[API Organizations] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
