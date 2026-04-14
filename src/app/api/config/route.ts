import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * System Configuration API - Powered by PostgreSQL
 * Manages API keys (ABB/RONDS) and platform settings.
 */

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 }
    });

    if (!config) {
      return NextResponse.json({
        apiKeys: [],
        notifications: {
          telegramToken: "",
          telegramChatId: "",
          whatsappApiUrl: "",
          whatsappToken: "",
          isNotifyEnabled: true
        },
        settings: { theme: 'dark', refreshRate: 30000 }
      });
    }

    // Format for the frontend (convert Json to Array of objects if needed)
    const keysMap = (config.getKeys as any) || {};
    const apiKeys = Object.entries(keysMap).map(([vendor, key]) => ({
      vendor,
      key,
      status: 'active'
    }));

    return NextResponse.json({
      apiKeys,
      notifications: {
        telegramToken: config.telegramToken || "",
        telegramChatId: config.telegramChatId || "",
        whatsappApiUrl: config.whatsappApiUrl || "",
        whatsappToken: config.whatsappToken || "",
        isNotifyEnabled: config.isNotifyEnabled
      },
      settings: config.settings
    });

  } catch (error) {
    console.error('[Config API] Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKeys, notifications, settings } = body;

    // Convert array back to map for storage
    const keysMap: Record<string, any> = {};
    if (Array.isArray(apiKeys)) {
      apiKeys.forEach((k: any) => {
        keysMap[k.vendor] = k.key;
      });
    }

    const updated = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {
        getKeys: keysMap,
        telegramToken: notifications?.telegramToken,
        telegramChatId: notifications?.telegramChatId,
        whatsappApiUrl: notifications?.whatsappApiUrl,
        whatsappToken: notifications?.whatsappToken,
        isNotifyEnabled: notifications?.isNotifyEnabled ?? true,
        settings: settings || {},
      },
      create: {
        id: 1,
        getKeys: keysMap,
        telegramToken: notifications?.telegramToken,
        telegramChatId: notifications?.telegramChatId,
        whatsappApiUrl: notifications?.whatsappApiUrl,
        whatsappToken: notifications?.whatsappToken,
        isNotifyEnabled: notifications?.isNotifyEnabled ?? true,
        settings: settings || {},
      }
    });

    return NextResponse.json({ success: true, timestamp: updated.updatedAt });

  } catch (error) {
    console.error('[Config API] Save error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
