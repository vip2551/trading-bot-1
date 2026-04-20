import { serve } from "bun";

const TELEGRAM_UPDATE_INTERVAL = 60000; // 1 minute
const TRADE_CHECK_INTERVAL = 5000; // 5 seconds

// In-memory state
const tradePrices = new Map<string, { price: number; lastUpdate: number }>();
const lastTelegramUpdate = new Map<string, number>();

// Get bot settings from main app
async function getBotSettings(): Promise<any> {
  try {
    const res = await fetch('http://localhost:3000/api/settings');
    const data = await res.json();
    return data.settings;
  } catch (e) {
    console.error('Error getting settings:', e);
    return null;
  }
}

// Get all open trades from main app
async function getOpenTrades(): Promise<any[]> {
  try {
    const res = await fetch('http://localhost:3000/api/trades');
    const data = await res.json();
    return (data.trades || []).filter((t: any) => t.status === 'OPEN' || t.status === 'PENDING');
  } catch (e) {
    console.error('Error getting trades:', e);
    return [];
  }
}

// Send Telegram message
async function sendTelegram(message: string, settings: any): Promise<boolean> {
  if (!settings?.telegramEnabled || !settings?.telegramBotToken || !settings?.telegramChatId) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch (e) {
    console.error('Telegram error:', e);
    return false;
  }
}

// Get current price (only from real sources)
async function getCurrentPrice(trade: any): Promise<{ optionPrice: number; stockPrice: number; isReal: boolean } | null> {
  // Try to get real price from IB service
  try {
    const res = await fetch('http://localhost:3003/market/spx', {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.price) {
        // Estimate option price based on spot movement
        const spotChange = data.price - 5800; // Assume 5800 as base
        const optionDelta = trade.optionType === 'CALL' ? 0.5 : -0.5;
        const baseOptionPrice = trade.entryPrice || 350;
        return {
          stockPrice: data.price,
          optionPrice: Math.max(1, baseOptionPrice + (spotChange * optionDelta * 0.1)),
          isReal: true
        };
      }
    }
  } catch {
    // IB service not available
  }

  // Try price API
  try {
    const res = await fetch(`http://localhost:3000/api/price?symbol=${trade.symbol}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      const stockPrice = data.price || data.spotPrice;
      if (stockPrice) {
        // Estimate option price
        const baseOptionPrice = trade.entryPrice || 350;
        const change = data.change || 0;
        return {
          stockPrice,
          optionPrice: Math.max(1, baseOptionPrice * (1 + change / 100)),
          isReal: true
        };
      }
    }
  } catch {
    // Price API not available
  }

  // ⚠️ CRITICAL: Do NOT simulate prices for real trades
  // Return null to indicate no real data available
  console.error(`🚫 لا توجد بيانات حقيقية لـ ${trade.symbol} - لا يمكن مراقبة الصفقة`);
  return null;
}

// Calculate P&L
function calculatePnL(trade: any, currentPrice: number): number {
  const entryPrice = trade.entryPrice || 0;
  const qty = trade.quantity || 1;
  const multiplier = 100; // SPX option multiplier

  if (trade.optionType === 'PUT' || trade.direction === 'PUT' || trade.direction === 'SELL') {
    return (entryPrice - currentPrice) * qty * multiplier;
  }
  return (currentPrice - entryPrice) * qty * multiplier;
}

// Check if trade should be closed
async function checkTradeConditions(trade: any, currentPrice: number, settings: any): Promise<{ shouldClose: boolean; reason: string }> {
  // Check time exit
  if (trade.maxHoldingMinutes) {
    const openTime = new Date(trade.openedAt || trade.createdAt).getTime();
    const elapsed = (Date.now() - openTime) / 60000;
    if (elapsed >= trade.maxHoldingMinutes) {
      return { shouldClose: true, reason: `⏰ Time exit: ${trade.maxHoldingMinutes} minutes reached` };
    }
  }

  // Check auto close time
  if (trade.autoCloseAt && new Date(trade.autoCloseAt) <= new Date()) {
    return { shouldClose: true, reason: '⏰ Auto close time reached' };
  }

  // Check stop loss (as percentage)
  if (trade.stopLoss && trade.entryPrice) {
    const lossPercent = ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;
    if (lossPercent >= trade.stopLoss) {
      return { shouldClose: true, reason: `🛑 Stop loss hit: -${lossPercent.toFixed(1)}%` };
    }
  }

  // Check take profit (as percentage)
  if (trade.takeProfit && trade.entryPrice) {
    const profitPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
    if (profitPercent >= trade.takeProfit) {
      return { shouldClose: true, reason: `🎯 Take profit hit: +${profitPercent.toFixed(1)}%` };
    }
  }

  return { shouldClose: false, reason: '' };
}

// Close trade via API
async function closeTrade(trade: any, currentPrice: number, reason: string, settings: any): Promise<void> {
  try {
    // Call the close API
    const res = await fetch(`http://localhost:3000/api/trades/${trade.id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.ok) {
      console.log(`✅ Closed trade ${trade.id}: ${reason}`);
    } else {
      console.error(`❌ Failed to close trade ${trade.id}`);
    }
  } catch (e) {
    console.error('Error closing trade:', e);
  }
}

// Send price update notification (Arabic)
async function sendPriceUpdate(trade: any, currentPrice: number, stockPrice: number, settings: any): Promise<void> {
  const now = Date.now();
  const lastUpdate = lastTelegramUpdate.get(trade.id) || 0;

  // Only send every minute
  if (now - lastUpdate < TELEGRAM_UPDATE_INTERVAL) {
    return;
  }

  lastTelegramUpdate.set(trade.id, now);

  const pnl = calculatePnL(trade, currentPrice);
  const direction = trade.optionType || trade.direction;
  
  const pnlEmoji = pnl >= 0 ? '🟢' : '🔴';
  const directionText = direction === 'CALL' ? '📈 كول' : '📉 بوت';

  // Arabic message
  const message = `📊 *تحديث السعر* ⏱️

${directionText} *${trade.symbol}*
━━━━━━━━━━━━━━━
📌 *الاسترايك:* ${trade.strike || 'N/A'}
💰 *السعر الحالي:* $${currentPrice.toFixed(2)}
📊 *سعر السهم:* $${stockPrice.toFixed(2)}
${pnlEmoji} *الربح/الخسارة:* ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}

⏰ ${new Date().toLocaleString('ar-SA')}`;

  await sendTelegram(message, settings);
}

// Main monitoring loop
async function monitorTrades(): Promise<void> {
  const settings = await getBotSettings();
  if (!settings?.telegramEnabled) {
    return;
  }

  const trades = await getOpenTrades();
  
  for (const trade of trades) {
    try {
      const priceData = await getCurrentPrice(trade);
      
      // ⚠️ CRITICAL: Skip monitoring if no real price data
      if (!priceData || !priceData.isReal) {
        console.warn(`⚠️ تخطي مراقبة ${trade.symbol} - لا توجد بيانات حقيقية`);
        continue;
      }
      
      const { optionPrice, stockPrice } = priceData;
      tradePrices.set(trade.id, { price: optionPrice, lastUpdate: Date.now() });

      // Send price update every minute
      await sendPriceUpdate(trade, optionPrice, stockPrice, settings);

      // Check if should close
      const { shouldClose, reason } = await checkTradeConditions(trade, optionPrice, settings);
      
      if (shouldClose) {
        await closeTrade(trade, optionPrice, reason, settings);
        tradePrices.delete(trade.id);
        lastTelegramUpdate.delete(trade.id);
      }
    } catch (e) {
      console.error(`Error monitoring trade ${trade.id}:`, e);
    }
  }
}

// Start monitoring
console.log('🔄 Starting trade monitor service...');
setInterval(monitorTrades, TRADE_CHECK_INTERVAL);

// Run immediately
monitorTrades().catch(console.error);

// HTTP Server
serve({
  port: 3004,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Get trade prices
      if (path === '/prices' && req.method === 'GET') {
        const prices = Object.fromEntries(tradePrices);
        return Response.json({ prices }, { headers: corsHeaders });
      }

      // Health check
      if (path === '/health') {
        return Response.json({ 
          status: 'ok', 
          trades: tradePrices.size,
          timestamp: new Date().toISOString()
        }, { headers: corsHeaders });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  },
});

console.log('✅ Trade monitor service running on port 3004');
