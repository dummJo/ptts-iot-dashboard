import { Response } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import { encryptData, decryptData } from '@/lib/security';

/**
 * System Configuration API - Powered by PostgreSQL
 */

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 }
    });

    if (!config) {
      return Response.success({
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

    const keysMap = (config.getKeys as any) || {};
    const apiKeys = Object.entries(keysMap).map(([vendor, key]) => ({
      vendor,
      key: decryptData(key as string) || key,
      status: 'active'
    }));

    return Response.success({
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
    console.error('[Config API] Error:', error);
    return Response.error('Failed to fetch config');
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKeys, notifications, settings } = body;

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

    return Response.success({ timestamp: updated.updatedAt });

  } catch (error) {
    console.error('[Config API] Save error:', error);
    return Response.error('Failed to save configuration');
  }
}
