import prisma from '@/lib/prisma';

/**
 * ASSET SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Purpose: Centralized business logic for IoT asset registry.
 */

export class AssetService {
  static async getAll() {
    return prisma.asset.findMany({
      orderBy: { tagId: 'asc' }
    });
  }

  static async getByTag(tagId: string) {
    return prisma.asset.findUnique({
      where: { tagId },
      include: {
        telemetries: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });
  }

  static async create(data: any) {
    return prisma.asset.create({
      data: {
        tagId: data.tagId,
        name: data.name,
        type: data.type,
        location: data.location,
        powerKw: parseFloat(data.powerKw) || 0,
        foundationType: data.foundationType || 'rigid',
        vibLimitWarning: parseFloat(data.vibLimitWarning) || 4.5,
        vibLimitFault: parseFloat(data.vibLimitFault) || 7.1,
      }
    });
  }

  static async updateThresholds(tagId: string, warning?: number, fault?: number) {
    return prisma.asset.update({
      where: { tagId },
      data: {
        vibLimitWarning: warning !== undefined ? warning : undefined,
        vibLimitFault: fault !== undefined ? fault : undefined,
      }
    });
  }
}
