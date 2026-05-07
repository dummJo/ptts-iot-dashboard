import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth('admin');
    if (!auth.authenticated) return auth.response;
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, message: 'Provider and API Key are required' },
        { status: 400 }
      );
    }


    // --- RONDS Integration (Mock/Simulated) ---
    if (provider === 'smartSensorRonds') {
      // Simulasi delay jaringan
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulasikan validasi format (dummy)
      if (apiKey.length > 10) {
        return NextResponse.json({
          success: true,
          message: 'CONNECTED — RONDS DATALINK ACTIVE',
          deviceCount: 4
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'FAILED — INVALID RONDS API KEY FORMAT'
        });
      }
    }

    return NextResponse.json(
      { success: false, message: 'Unsupported provider' },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
