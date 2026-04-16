import { decryptData } from './security';
import prisma from './prisma';

/**
 * Industrial Notification Service
 * Handles Telegram & WhatsApp alert delivery with secure token management.
 */
export class NotificationService {
  
  /**
   * Sends a critical alert to configured channels.
   */
  static async sendAlert(message: string) {
    try {
      const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
      if (!config || !config.isNotifyEnabled) return;

      const promises = [];

      // 1. Telegram Branch (Decrypt on demand)
      if (config.telegramToken && config.telegramChatId) {
        const token = decryptData(config.telegramToken);
        if (token) {
          promises.push(this.sendTelegram(token, config.telegramChatId, message));
        }
      }

      // 2. WhatsApp Branch (Decrypt on demand)
      if (config.whatsappApiUrl && config.whatsappToken) {
        const token = decryptData(config.whatsappToken);
        if (token) {
          promises.push(this.sendWhatsApp(config.whatsappApiUrl, token, message));
        }
      }

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('[NotificationService] Global Error:', error);
    }
  }

  /**
   * Telegram Delivery (via Bot API)
   */
  private static async sendTelegram(token: string, chatId: string, text: string) {
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🚨 PTTS IoT ALERT 🚨\n\n${text}`,
          parse_mode: 'HTML'
        })
      });
      if (!res.ok) console.error('[Telegram] Failed:', await res.text());
    } catch (e) {
      console.error('[Telegram] Error:', e);
    }
  }

  /**
   * WhatsApp Delivery (Generic Gateway compatible with Fonnte/Twilio)
   */
  private static async sendWhatsApp(apiUrl: string, token: string, text: string) {
    try {
      // Logic for Fonnte style: { target, message }
      // This can be adjusted based on the specific provider
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: `🚨 PTTS IoT ALERT 🚨\n\n${text}`
        })
      });
      if (!res.ok) console.error('[WhatsApp] Failed:', await res.text());
    } catch (e) {
      console.error('[WhatsApp] Error:', e);
    }
  }
}
