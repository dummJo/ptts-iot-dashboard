import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { encryptData, decryptData } from '@/lib/security';

/**
 * System Configuration API - Powered by PostgreSQL
 * Manages API keys (ABB/RONDS) and platform settings with Scrypt-AES protection.
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

    // Decrypt keys for management UI
    const keysMap = (config.getKeys as any) || {};
    const apiKeys = Object.entries(keysMap).map(([vendor, key]) => ({
      vendor,
      key: decryptData(key as string) || key, // Fallback to raw if decryption fails
      status: 'active'
    }));

    return NextResponse.json({
      apiKeys,
      notifications: {
        telegramToken: config.telegramToken ? decryptData(config.telegramToken) : "",
        telegramChatId: config.telegramChatId || "",
        whatsappApiUrl: config.whatsappApiUrl || "",
        whatsappToken: config.whatsappToken ? decryptData(config.whatsappToken) : "",
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

    // Encrypt keys before storage
    const keysMap: Record<string, any> = {};
    if (Array.isArray(apiKeys)) {
      apiKeys.forEach((k: any) => {
        keysMap[k.vendor] = encryptData(k.key);
      });
    }

    const updated = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {
        getKeys: keysMap,
        telegramToken: notifications?.telegramToken ? encryptData(notifications.telegramToken) : null,
        telegramChatId: notifications?.telegramChatId,
        whatsappApiUrl: notifications?.whatsappApiUrl,
        whatsappToken: notifications?.whatsappToken ? encryptData(notifications.whatsappToken) : null,
        isNotifyEnabled: notifications?.isNotifyEnabled ?? true,
        settings: settings || {},
      },
      create: {
        id: 1,
        getKeys: keysMap,
        telegramToken: notifications?.telegramToken ? encryptData(notifications.telegramToken) : null,
        telegramChatId: notifications?.telegramChatId,
        whatsappApiUrl: notifications?.whatsappApiUrl,
        whatsappToken: notifications?.whatsappToken ? encryptData(notifications.whatsappToken) : null,
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
