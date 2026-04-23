import prisma from '@/lib/prisma';
import { runAlarmEngine } from '@/lib/alarmEngine';
import { NotificationService } from '@/lib/notifications';
import { InboundTelemetryEntry } from '@/lib/types';

/**
 * TELEMETRY SERVICE — INDUSTRIAL DATA LAYER
 * ─────────────────────────────────────────────────────────────────────────────
 * Purpose: Centralized handling for sensor data ingestion, validation, 
 * and recording into PostgreSQL.
 */

export class TelemetryService {
  /**
   * Processes a batch of telemetry entries.
   * Records data, triggers alarm engine, and sends notifications.
   */
  static async ingestBatch(entries: InboundTelemetryEntry[]) {
    let processedCount = 0;
    const timestamp = new Date();

    for (const entry of entries) {
      const { tagId, temp, vibOverall, vibVelocity, motorCurrent } = entry;
      if (!tagId) continue;

      try {
        // 1. Ensure Asset exists (Auto-discovery)
        const asset = await prisma.asset.upsert({
          where: { tagId },
          update: { updatedAt: timestamp },
          create: {
            tagId,
            name: `Asset ${tagId}`,
            type: 'Motor', // Default type
            vibLimitWarning: 4.5,
            vibLimitFault: 7.1
          }
        });

        // 2. Record Telemetry
        await prisma.telemetry.create({
          data: {
            assetId: asset.id,
            timestamp: entry.timestamp ? new Date(entry.timestamp) : timestamp,
            temp: temp || 0,
            vibOverall: vibOverall || 0,
            vibVelocity: vibVelocity || 0,
            motorCurrent: motorCurrent || 0,
            rawPayload: entry as any
          }
        });

        // 3. Process Alarms
        await runAlarmEngine(asset.id, { vibOverall: vibOverall || 0 });

        processedCount++;
      } catch (err) {
        console.error(`[TelemetryService] Failed to ingest ${tagId}:`, err);
      }
    }

    return processedCount;
  }

  /**
   * Fetches latest telemetry for all assets.
   */
  static async getLatestState() {
    return prisma.asset.findMany({
      include: {
        telemetries: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });
  }
}
