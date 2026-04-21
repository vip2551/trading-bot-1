/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📱 TELEGRAM NOTIFICATION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * إرسال إشعارات فورية لتيليجرام
 * - تنبيهات الصفقات
 * - تحذيرات المخاطر
 * - تقارير يومية
 */

import { db } from './db';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface TradeNotification {
  type: 'TRADE_OPENED' | 'TRADE_CLOSED' | 'TRADE_REJECTED' | 'RISK_WARNING' | 'DAILY_REPORT' | 'SYSTEM_ALERT';
  symbol?: string;
  action?: string;
  quantity?: number;
  price?: number;
  pnl?: number;
  reason?: string;
  message?: string;
}

class TelegramService {
  private config: TelegramConfig | null = null;
  private lastSentTime: number = 0;
  private minIntervalMs: number = 1000; // ثانية واحدة بين الرسائل

  /**
   * تحميل الإعدادات من قاعدة البيانات
   */
  async loadConfig(): Promise<TelegramConfig | null> {
    try {
      const settings = await db.botSettings.findFirst();
      if (settings?.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
        this.config = {
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          enabled: true
        };
        return this.config;
      }
    } catch (error) {
      console.error('[TELEGRAM] Error loading config:', error);
    }
    return null;
  }

  /**
   * إرسال رسالة لتيليجرام
   */
  async sendMessage(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
    // التحقق من الحد الأدنى بين الرسائل
    const now = Date.now();
    if (now - this.lastSentTime < this.minIntervalMs) {
      await new Promise(resolve => setTimeout(resolve, this.minIntervalMs));
    }

    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config?.enabled || !this.config.botToken || !this.config.chatId) {
      console.log('[TELEGRAM] Not configured or disabled');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: parseMode,
          disable_web_page_preview: true
        })
      });

      const data = await response.json();
      
      if (!data.ok) {
        console.error('[TELEGRAM] Error:', data.description);
        return false;
      }

      this.lastSentTime = now;
      console.log('[TELEGRAM] ✅ Message sent successfully');
      return true;
    } catch (error) {
      console.error('[TELEGRAM] Send error:', error);
      return false;
    }
  }

  /**
   * إرسال إشعار صفقة جديدة
   */
  async notifyTradeOpened(params: {
    symbol: string;
    action: string;
    quantity: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
    strategy?: string;
    mode: string;
    ibOrderId?: number;
  }): Promise<boolean> {
    const { symbol, action, quantity, price, stopLoss, takeProfit, strategy, mode, ibOrderId } = params;
    
    const modeEmoji = mode === 'LIVE' ? '🔴' : mode === 'PAPER' ? '🟡' : '⚪';
    const actionEmoji = action === 'BUY' || action === 'LONG' || action === 'CALL' ? '🟢' : '🔴';
    
    const message = `
${modeEmoji} <b>صفقة جديدة</b> ${modeEmoji}

${actionEmoji} <b>${action}</b> ${quantity}x ${symbol}
💰 السعر: $${price.toFixed(2)}
${stopLoss ? `🛑 SL: $${stopLoss.toFixed(2)}` : ''}
${takeProfit ? `🎯 TP: $${takeProfit.toFixed(2)}` : ''}
${strategy ? `📊 الاستراتيجية: ${strategy}` : ''}
${ibOrderId ? `📋 IB Order: #${ibOrderId}` : ''}
⚙️ الوضع: ${mode}

⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
`.trim();

    return this.sendMessage(message);
  }

  /**
   * إرسال إشعار إغلاق صفقة
   */
  async notifyTradeClosed(params: {
    symbol: string;
    action: string;
    quantity: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
    closeReason?: string;
    duration?: number;
  }): Promise<boolean> {
    const { symbol, action, quantity, entryPrice, exitPrice, pnl, pnlPercent, closeReason, duration } = params;
    
    const isProfit = pnl > 0;
    const pnlEmoji = isProfit ? '🟢💰' : '🔴📉';
    
    const message = `
${pnlEmoji} <b>صفقة مغلقة</b>

${action} ${quantity}x ${symbol}
📥 الدخول: $${entryPrice.toFixed(2)}
📤 الخروج: $${exitPrice.toFixed(2)}

${isProfit ? '📈 الربح' : '📉 الخسارة'}: $${Math.abs(pnl).toFixed(2)} (${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)
${closeReason ? `📝 السبب: ${closeReason}` : ''}
${duration ? `⏱️ المدة: ${Math.round(duration / 60000)} دقيقة` : ''}

⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
`.trim();

    return this.sendMessage(message);
  }

  /**
   * إرسال تحذير مخاطر
   */
  async notifyRiskWarning(params: {
    type: 'DAILY_LOSS_LIMIT' | 'MAX_POSITIONS' | 'NEWS_BLOCK' | 'IB_DISCONNECTED';
    message: string;
    current?: number;
    limit?: number;
  }): Promise<boolean> {
    const { type, message: msg, current, limit } = params;
    
    const typeEmojis: Record<string, string> = {
      'DAILY_LOSS_LIMIT': '🚨📉',
      'MAX_POSITIONS': '⚠️📊',
      'NEWS_BLOCK': '📰⛔',
      'IB_DISCONNECTED': '🔌❌'
    };
    
    const typeNames: Record<string, string> = {
      'DAILY_LOSS_LIMIT': 'حد الخسارة اليومية',
      'MAX_POSITIONS': 'حد الصفقات المفتوحة',
      'NEWS_BLOCK': 'فلتر الأخبار',
      'IB_DISCONNECTED': 'انقطاع IB'
    };

    const message = `
${typeEmojis[type] || '⚠️'} <b>تحذير: ${typeNames[type] || type}</b>

${msg}
${current !== undefined ? `📊 الحالي: ${current}` : ''}
${limit !== undefined ? `🎯 الحد: ${limit}` : ''}

⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
`.trim();

    return this.sendMessage(message);
  }

  /**
   * إرسال إشعار رفض صفقة
   */
  async notifyTradeRejected(params: {
    symbol: string;
    action: string;
    reason: string;
    mode: string;
  }): Promise<boolean> {
    const { symbol, action, reason, mode } = params;
    
    const message = `
⛔ <b>صفقة مرفوضة</b>

${action} ${symbol}
📋 السبب: ${reason}
⚙️ الوضع: ${mode}

⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
`.trim();

    return this.sendMessage(message);
  }

  /**
   * إرسال تقرير يومي
   */
  async sendDailyReport(params: {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    totalPnL: number;
    winRate: number;
    accountBalance: number;
    openPositions: number;
  }): Promise<boolean> {
    const { totalTrades, winCount, lossCount, totalPnL, winRate, accountBalance, openPositions } = params;
    
    const isProfit = totalPnL >= 0;
    
    const message = `
📊 <b>التقرير اليومي</b>

📈 <b>ملخص الصفقات:</b>
• الإجمالي: ${totalTrades} صفقة
• 🟢 رابحة: ${winCount}
• 🔴 خاسرة: ${lossCount}
• 📊 نسبة الفوز: ${winRate.toFixed(1)}%

💰 <b>الأداء:</b>
• P&L: ${isProfit ? '+' : ''}$${totalPnL.toFixed(2)}
• الرصيد: $${accountBalance.toFixed(2)}

📍 <b>الحالي:</b>
• الصفقات المفتوحة: ${openPositions}

⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
`.trim();

    return this.sendMessage(message);
  }

  /**
   * إرسال تنبيه نظام
   */
  async sendSystemAlert(title: string, message: string, level: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'): Promise<boolean> {
    const emojis = { INFO: 'ℹ️', WARNING: '⚠️', ERROR: '🚨' };
    
    const msg = `
${emojis[level]} <b>${title}</b>

${message}

⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
`.trim();

    return this.sendMessage(msg);
  }

  /**
   * اختبار الاتصال
   */
  async testConnection(botToken: string, chatId: string): Promise<{ success: boolean; message: string }> {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ اختبار ناجح! التطبيق متصل بتيليجرام.',
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        return { success: true, message: 'تم إرسال رسالة الاختبار بنجاح!' };
      } else {
        return { success: false, message: data.description || 'فشل الإرسال' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'خطأ في الاتصال' };
    }
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
export default telegramService;
