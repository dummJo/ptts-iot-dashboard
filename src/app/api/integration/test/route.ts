import { NextResponse } from 'next/server';

/**
 * API Integration Test Proxy
 * ─────────────────────────────────────────────────────────────────────────────
 * Menjembatani request dari browser ke cloud provider (ABB/RONDS) 
 * untuk menghindari kebijakan CORS dan mengamankan API Key.
 */

export async function POST(req: Request) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, message: 'Provider and API Key are required' },
        { status: 400 }
      );
    }

    // --- ABB Ability™ Integration ---
    if (provider === 'smartSensorPTTS') {
      const ABB_API_URL = 'https://api.conditionmonitoring.motion.abb.com/motion/ability/v1/devices';
      
      try {
        const res = await fetch(ABB_API_URL, {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Accept': 'application/json',
          },
        });

        if (res.status === 200) {
          const devices = await res.json();
          return NextResponse.json({
            success: true,
            message: `CONNECTED — ${devices.length || 0} DEVICES DISCOVERED`,
            deviceCount: devices.length
          });
        } else if (res.status === 401) {
          return NextResponse.json({
            success: false,
            message: 'FAILED — UNAUTHORIZED (INVALID KEY)'
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `FAILED — CLOUD ERROR (${res.status})`
          });
        }
      } catch (e) {
        return NextResponse.json({
          success: false,
          message: 'FAILED — COULD NOT REACH ABB CLOUD'
        });
      }
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
