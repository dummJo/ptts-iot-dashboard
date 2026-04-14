import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';

/**
 * Notification Test API
 * Directly tests credentials without saving them to DB.
 */
export async function POST(req: Request) {
  try {
    const { channel, token, chatId, apiUrl } = await req.json();

    const timestamp = new Date().toLocaleTimeString();
    const testMsg = `SYSTEM TEST: Successful connection to PTTS IoT Notification Engine at ${timestamp}.`;

    if (channel === 'telegram') {
      if (!token || !chatId) {
        return NextResponse.json({ error: 'Token and Chat ID are required for Telegram' }, { status: 400 });
      }
      
      // We use a non-static version or just call the logic
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🚨 PTTS IoT TEST 🚨\n\n${testMsg}`,
        })
      });

      if (res.ok) {
        return NextResponse.json({ success: true, message: 'Telegram test message sent!' });
      } else {
        const err = await res.text();
        return NextResponse.json({ success: false, message: `Telegram Error: ${err}` });
      }
    }

    if (channel === 'whatsapp') {
      if (!apiUrl || !token) {
        return NextResponse.json({ error: 'API URL and Token are required for WhatsApp' }, { status: 400 });
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: `🚨 PTTS IoT TEST 🚨\n\n${testMsg}`
        })
      });

      if (res.ok) {
        return NextResponse.json({ success: true, message: 'WhatsApp test message sent!' });
      } else {
        const err = await res.text();
        return NextResponse.json({ success: false, message: `WhatsApp Error: ${err}` });
      }
    }

    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });

  } catch (error) {
    console.error('[Notify Test API] Error:', error);
    return NextResponse.json({ error: 'Test failed due to internal error' }, { status: 500 });
  }
}
