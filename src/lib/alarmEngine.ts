import prisma from './prisma';
import { NotificationService } from './notifications';
import { formatLocalNumber } from './utils';

/**
 * Industrial Alarm Engine
 * Evaluates telemetry against asset thresholds and triggers alerts.
 */
export async function runAlarmEngine(assetId: string, telemetry: { vibOverall?: number | null }) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset || telemetry.vibOverall === null || telemetry.vibOverall === undefined) return;

    const limits = {
      warning: asset.vibLimitWarning || 4.5,
      fault: asset.vibLimitFault || 7.1
    };

    let severity: 'critical' | 'warning' | null = null;
    let msg = '';
    
    const vib = telemetry.vibOverall;
    
    if (vib >= limits.fault) {
      severity = 'critical';
      msg = `Vibration Fault: ${formatLocalNumber(vib, 2)}mm/s exceeded limit ${formatLocalNumber(limits.fault, 1)}mm/s`;
    } else if (vib >= limits.warning) {
      severity = 'warning';
      msg = `Vibration Warning: ${formatLocalNumber(vib, 2)}mm/s exceeded limit ${formatLocalNumber(limits.warning, 1)}mm/s`;
    }

    if (severity) {
      // Check if unacknowledged alarm already exists for this asset & severity
      const existing = await prisma.alarm.findFirst({
        where: {
          assetId: asset.id,
          severity,
          acknowledgedAt: null
        }
      });

      if (!existing) {
        await prisma.alarm.create({
          data: {
            assetId: asset.id,
            alarmType: 'Vibration',
            severity,
            message: msg,
            timestamp: new Date()
          }
        });
        
        // Trigger external notification
        await NotificationService.sendAlert(msg);
        
        console.log(`🚨 [Alarm Engine] Triggered: ${asset.tagId} - ${msg}`);
      }
    }
  } catch (error) {
    console.error('[Alarm Engine] Error:', error);
  }
}
