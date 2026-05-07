import { NextResponse } from 'next/server';
import { AbbBridge } from '@/services/bridge/abbBridge';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;
    // 1. Initial Identity Scope (Demo Mode)
    const organizations = [
      { id: 'demo-mode', name: 'Live Demo', type: 'Demo' }
    ];

    let systemConnected = false;
    let systemError = null;

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
        systemConnected = true;
        console.log(`[API Organizations] Successfully discovered ${realOrgs.length} real organizations.`);
      }
    } catch (abbError: any) {
      systemError = abbError.message || 'Identity discovery failed';
      console.error('[API Organizations] Dynamic fetch failed:', systemError);
    }

    return NextResponse.json({
      success: true,
      organizations: organizations,
      system: {
        connected: systemConnected,
        error: systemError,
        lastAttempt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[API Organizations] Fatal Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
