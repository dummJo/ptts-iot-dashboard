import { ApiResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-guard';
import prisma from '@/lib/prisma';
import { encryptData, decryptData } from '@/lib/security';

/**
 * Validates the optional `settings.energy` tariff block.
 * Returns an error message, or null when the payload is acceptable.
 */
function validateEnergySettings(settings: unknown): string | null {
  const energy = (settings as Record<string, unknown> | null)?.energy;
  if (energy == null) return null;
  if (typeof energy !== 'object' || Array.isArray(energy)) {
    return 'settings.energy must be an object';
  }

  const e = energy as Record<string, unknown>;
  const num = (k: string) => (typeof e[k] === 'number' ? (e[k] as number) : undefined);

  const checks: Array<[string, number | undefined, number, number]> = [
    ['baseRatePerKwh',    num('baseRatePerKwh'),    0, 1_000_000],
    ['peakMultiplier',    num('peakMultiplier'),    1, 10],
    ['peakStartHour',     num('peakStartHour'),     0, 23],
    ['peakEndHour',       num('peakEndHour'),       1, 24],
    ['utcOffsetMinutes',  num('utcOffsetMinutes'),  -720, 840],
    ['co2FactorKgPerKwh', num('co2FactorKgPerKwh'), 0, 5],
  ];

  for (const [key, value, min, max] of checks) {
    if (e[key] === undefined) continue;
    if (value === undefined || !Number.isFinite(value) || value < min || value > max) {
      return `settings.energy.${key} must be a number between ${min} and ${max}`;
    }
  }

  const start = num('peakStartHour');
  const end = num('peakEndHour');
  if (start !== undefined && end !== undefined && start >= end) {
    return 'settings.energy.peakStartHour must be earlier than peakEndHour';
  }

  return null;
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 }
    });

    if (!config) {
      return ApiResponse.success({
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

    return ApiResponse.success({
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
    return ApiResponse.error('Failed to fetch config');
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth('admin');
    if (!auth.authenticated) return auth.response;

    const body = await req.json();
    const { apiKeys, notifications, settings } = body;

    // Tariff values become money on the Energy console, so a malformed payload
    // is rejected outright rather than coerced into a plausible-looking default.
    const energyError = validateEnergySettings(settings);
    if (energyError) return ApiResponse.badRequest(energyError);

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

    return ApiResponse.success({ timestamp: updated.updatedAt });

  } catch (error) {
    console.error('[Config API] Save error:', error);
    return ApiResponse.error('Failed to save configuration');
  }
}
