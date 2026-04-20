import { serve } from "bun";

// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 AUTO TRADING ENGINE - Autonomous Trading System
// ═══════════════════════════════════════════════════════════════════════════════

const MONITOR_INTERVAL = 30000; // 30 seconds
const PRICE_FETCH_INTERVAL = 10000; // 10 seconds
const AUTO_TRADE_COOLDOWN = 5 * 60 * 1000; // 5 minutes between auto trades

// Configuration
interface AutoTraderConfig {
  enabled: boolean;
  userId: string;
  symbols: string[];
  maxOpenPositions: number;
  maxRiskPerTrade: number;
  autoEntryEnabled: boolean;
  autoExitEnabled: boolean;
  minConfidence: number;
  tradingHours: { start: number; end: number };
}

// State
let config: AutoTraderConfig = {
  enabled: false,
  userId: 'demo',
  symbols: ['SPX', 'SPY', 'QQQ', 'AAPL', 'TSLA'],
  maxOpenPositions: 3,
  maxRiskPerTrade: 500,
  autoEntryEnabled: true,
  autoExitEnabled: true,
  minConfidence: 70,
  tradingHours: { start: 9, end: 16 }
};

let lastAutoTrade = new Map<string, number>();
let marketData = new Map<string, { price: number; change: number; volume: number; timestamp: number; isReal: boolean }>();
let tradingLogs: Array<{ time: Date; type: string; message: string; data?: any }> = [];

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MARKET DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchMarketData(symbol: string): Promise<{ price: number; change: number; volume: number; isReal: boolean } | null> {
  try {
    // Try main app price API
    const res = await fetch(`http://localhost:3000/api/price?symbol=${symbol}`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    if (res.ok) {
      const data = await res.json();
      // Only return if we have valid price data
      if (data.price || data.spotPrice) {
        return {
          price: data.price || data.spotPrice || 0,
          change: data.change || 0,
          volume: data.volume || 0,
          isReal: true
        };
      }
    }
  } catch (e) {
    log('ERROR', `⚠️ فشل الحصول على بيانات حقيقية لـ ${symbol}`, { error: String(e) });
  }

  // ⚠️ CRITICAL: Do NOT use simulated data for trading decisions
  // Return null to indicate no real data available
  log('WARN', `🚫 لا توجد بيانات حقيقية لـ ${symbol} - لن يتم التداول`);
  return null;
}

async function fetchAllMarketData(): Promise<void> {
  for (const symbol of config.symbols) {
    const data = await fetchMarketData(symbol);
    if (data) {
      marketData.set(symbol, { ...data, timestamp: Date.now() });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 TECHNICAL ANALYSIS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

interface TechnicalAnalysis {
  symbol: string;
  price: number;
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  trend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  trendStrength: number;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  reasons: string[];
}

function analyzeSymbol(symbol: string): TechnicalAnalysis | null {
  const data = marketData.get(symbol);
  
  // ⚠️ CRITICAL: Do not analyze without real market data
  if (!data || !data.isReal) {
    log('WARN', `⚠️ لا توجد بيانات حقيقية لـ ${symbol} - تخطي التحليل`);
    return null;
  }
  
  const price = data.price;
  
  // TODO: Implement real technical analysis using historical price data
  // For now, use a simple momentum-based analysis
  const momentum = data.change;
  
  // Simple trend determination based on actual price change
  let trend: TechnicalAnalysis['trend'] = 'NEUTRAL';
  let trendStrength = 50;
  const reasons: string[] = [];
  
  if (momentum > 1) {
    trend = 'STRONG_BULLISH';
    trendStrength = 75;
    reasons.push(`زخم صعودي قوي: +${momentum.toFixed(2)}%`);
  } else if (momentum > 0.3) {
    trend = 'BULLISH';
    trendStrength = 65;
    reasons.push(`زخم صعودي: +${momentum.toFixed(2)}%`);
  } else if (momentum < -1) {
    trend = 'STRONG_BEARISH';
    trendStrength = 75;
    reasons.push(`زخم هبوطي قوي: ${momentum.toFixed(2)}%`);
  } else if (momentum < -0.3) {
    trend = 'BEARISH';
    trendStrength = 65;
    reasons.push(`زخم هبوطي: ${momentum.toFixed(2)}%`);
  }
  
  // Volume confirmation
  if (data.volume > 3000000) {
    reasons.push('حجم تداول عالي - تأكيد الإشارة');
    trendStrength = Math.min(100, trendStrength + 10);
  }
  
  // Determine signal
  let signal: TechnicalAnalysis['signal'] = 'HOLD';
  let confidence = trendStrength;
  
  if (trend === 'STRONG_BULLISH') {
    signal = 'STRONG_BUY';
    confidence = 80;
  } else if (trend === 'BULLISH') {
    signal = 'BUY';
    confidence = 70;
  } else if (trend === 'STRONG_BEARISH') {
    signal = 'STRONG_SELL';
    confidence = 80;
  } else if (trend === 'BEARISH') {
    signal = 'SELL';
    confidence = 70;
  }
  
  return {
    symbol,
    price,
    rsi: 50, // Placeholder - needs real calculation from price history
    macd: { value: momentum * 0.5, signal: momentum * 0.4, histogram: momentum * 0.1 },
    trend,
    trendStrength: Math.round(trendStrength),
    signal,
    confidence: Math.round(confidence),
    reasons
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 POSITION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

async function getOpenPositions(): Promise<any[]> {
  try {
    const res = await fetch(`http://localhost:3000/api/trades?userId=${config.userId}`);
    const data = await res.json();
    return (data.trades || []).filter((t: any) => t.status === 'OPEN' || t.status === 'PENDING');
  } catch (e) {
    log('ERROR', 'Failed to fetch open positions', { error: String(e) });
    return [];
  }
}

async function closePosition(tradeId: string, exitPrice: number, reason: string): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:3000/api/trades/${tradeId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exitPrice, reason, userId: config.userId })
    });
    
    if (res.ok) {
      log('TRADE', `✅ تم إغلاق الصفقة: ${reason}`, { tradeId, exitPrice });
      return true;
    }
    return false;
  } catch (e) {
    log('ERROR', 'Failed to close position', { tradeId, error: String(e) });
    return false;
  }
}

async function openPosition(analysis: TechnicalAnalysis, direction: 'CALL' | 'PUT'): Promise<any | null> {
  try {
    // Check cooldown
    const lastTrade = lastAutoTrade.get(analysis.symbol) || 0;
    if (Date.now() - lastTrade < AUTO_TRADE_COOLDOWN) {
      return null;
    }
    
    const res = await fetch('http://localhost:3000/api/trades/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: config.userId,
        symbol: analysis.symbol,
        direction,
        quantity: 1,
        instrumentType: 'OPTION',
        signalSource: 'AUTO_TRADER',
        signalStrategy: analysis.reasons.join(' | '),
        stopLoss: 20, // 20% stop loss
        stopLossType: 'PERCENT',
        takeProfit: 50, // 50% take profit
        takeProfitType: 'PERCENT',
        maxHoldingMinutes: 120 // 2 hours max
      })
    });
    
    const data = await res.json();
    if (data.success && data.trade) {
      lastAutoTrade.set(analysis.symbol, Date.now());
      log('TRADE', `🚀 تم فتح صفقة ${direction} على ${analysis.symbol}`, { 
        trade: data.trade,
        analysis: analysis.reasons 
      });
      return data.trade;
    }
    return null;
  } catch (e) {
    log('ERROR', 'Failed to open position', { error: String(e) });
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AUTO TRADING LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

async function evaluateExitDecision(trade: any, analysis: TechnicalAnalysis): Promise<{ shouldExit: boolean; reason: string }> {
  const isLong = trade.direction === 'CALL' || trade.direction === 'BUY';
  const entryPrice = trade.entryPrice;
  const currentPrice = analysis.price;
  
  // Calculate P&L
  const pnlPercent = isLong 
    ? ((currentPrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - currentPrice) / entryPrice) * 100;
  
  // Stop loss check
  if (trade.stopLoss && pnlPercent <= -trade.stopLoss) {
    return { shouldExit: true, reason: `🛑 وقف الخسارة: ${pnlPercent.toFixed(1)}%` };
  }
  
  // Take profit check
  if (trade.takeProfit && pnlPercent >= trade.takeProfit) {
    return { shouldExit: true, reason: `🎯 تحقيق الهدف: +${pnlPercent.toFixed(1)}%` };
  }
  
  // Time-based exit
  if (trade.maxHoldingMinutes) {
    const openTime = new Date(trade.openedAt || trade.createdAt).getTime();
    const elapsed = (Date.now() - openTime) / 60000;
    if (elapsed >= trade.maxHoldingMinutes) {
      return { shouldExit: true, reason: `⏰ انتهاء الوقت: ${trade.maxHoldingMinutes} دقيقة` };
    }
  }
  
  // Trend reversal exit
  if (isLong && analysis.trend.includes('BEARISH') && analysis.confidence > 70) {
    if (pnlPercent > 5) {
      return { shouldExit: true, reason: `🔄 انعكاس الاتجاه مع ربح: +${pnlPercent.toFixed(1)}%` };
    }
  }
  
  if (!isLong && analysis.trend.includes('BULLISH') && analysis.confidence > 70) {
    if (pnlPercent > 5) {
      return { shouldExit: true, reason: `🔄 انعكاس الاتجاه مع ربح: +${pnlPercent.toFixed(1)}%` };
    }
  }
  
  // Large loss protection
  if (pnlPercent < -15) {
    return { shouldExit: true, reason: `🚨 خسارة كبيرة: ${pnlPercent.toFixed(1)}%` };
  }
  
  return { shouldExit: false, reason: '' };
}

async function evaluateEntryDecision(analysis: TechnicalAnalysis): Promise<{ shouldEnter: boolean; direction: 'CALL' | 'PUT' | null; reasons: string[] }> {
  const reasons: string[] = [];
  let shouldEnter = false;
  let direction: 'CALL' | 'PUT' | null = null;
  
  // Check confidence threshold
  if (analysis.confidence < config.minConfidence) {
    return { shouldEnter: false, direction: null, reasons: ['الثقة أقل من الحد الأدنى'] };
  }
  
  // Strong buy signal
  if (analysis.signal === 'STRONG_BUY') {
    shouldEnter = true;
    direction = 'CALL';
    reasons.push(...analysis.reasons);
    reasons.push(`إشارة شراء قوية - ثقة ${analysis.confidence}%`);
  }
  // Buy signal with good conditions
  else if (analysis.signal === 'BUY' && analysis.rsi < 50) {
    shouldEnter = true;
    direction = 'CALL';
    reasons.push(...analysis.reasons);
    reasons.push(`إشارة شراء - RSI ${analysis.rsi}`);
  }
  // Strong sell signal
  else if (analysis.signal === 'STRONG_SELL') {
    shouldEnter = true;
    direction = 'PUT';
    reasons.push(...analysis.reasons);
    reasons.push(`إشارة بيع قوية - ثقة ${analysis.confidence}%`);
  }
  // Sell signal with good conditions
  else if (analysis.signal === 'SELL' && analysis.rsi > 50) {
    shouldEnter = true;
    direction = 'PUT';
    reasons.push(...analysis.reasons);
    reasons.push(`إشارة بيع - RSI ${analysis.rsi}`);
  }
  
  return { shouldEnter, direction, reasons };
}

async function runAutoTradingCycle(): Promise<void> {
  if (!config.enabled) {
    return;
  }
  
  // Check trading hours
  const now = new Date();
  const hour = now.getHours();
  if (hour < config.tradingHours.start || hour >= config.tradingHours.end) {
    return; // Outside trading hours
  }
  
  log('INFO', '🔄 بدء دورة التداول التلقائي...');
  
  // Fetch market data
  await fetchAllMarketData();
  
  // Check if we have any real market data
  const hasRealData = Array.from(marketData.values()).some(d => d.isReal);
  if (!hasRealData) {
    log('ERROR', '🚫 لا توجد بيانات حقيقية - إيقاف التداول التلقائي');
    return;
  }
  
  // Get current positions
  const positions = await getOpenPositions();
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // EXIT EVALUATION - Check existing positions
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (config.autoExitEnabled) {
    for (const trade of positions) {
      const analysis = analyzeSymbol(trade.symbol);
      if (!analysis) {
        log('WARN', `⚠️ تخطي تحليل ${trade.symbol} - لا توجد بيانات حقيقية`);
        continue;
      }
      const { shouldExit, reason } = await evaluateExitDecision(trade, analysis);
      
      if (shouldExit) {
        await closePosition(trade.id, analysis.price, reason);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // ENTRY EVALUATION - Look for new opportunities
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (config.autoEntryEnabled && positions.length < config.maxOpenPositions) {
    for (const symbol of config.symbols) {
      // Skip if already have position in this symbol
      if (positions.some(p => p.symbol === symbol)) {
        continue;
      }
      
      const analysis = analyzeSymbol(symbol);
      if (!analysis) {
        continue; // Skip symbols without real data
      }
      const { shouldEnter, direction, reasons } = await evaluateEntryDecision(analysis);
      
      if (shouldEnter && direction) {
        await openPosition(analysis, direction);
        break; // Only one new position per cycle
      }
    }
  }
  
  log('INFO', `✅ انتهت الدورة - ${positions.length} صفقة مفتوحة`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

function log(type: string, message: string, data?: any): void {
  const entry = { time: new Date(), type, message, data };
  tradingLogs.push(entry);
  
  // Keep only last 100 logs
  if (tradingLogs.length > 100) {
    tradingLogs = tradingLogs.slice(-100);
  }
  
  const emoji = type === 'TRADE' ? '💰' : type === 'ERROR' ? '❌' : '📋';
  console.log(`${emoji} [${new Date().toISOString()}] ${message}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 HTTP SERVER
// ═══════════════════════════════════════════════════════════════════════════════

serve({
  port: 3005,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Get status
      if (path === '/status' && req.method === 'GET') {
        const positions = await getOpenPositions();
        const analyses = config.symbols.map(s => analyzeSymbol(s));
        
        return Response.json({
          success: true,
          config,
          status: {
            enabled: config.enabled,
            openPositions: positions.length,
            maxPositions: config.maxOpenPositions,
            lastCheck: new Date().toISOString(),
            tradingHours: config.tradingHours
          },
          marketData: Object.fromEntries(marketData),
          analyses,
          recentLogs: tradingLogs.slice(-20)
        }, { headers: corsHeaders });
      }
      
      // Enable auto trading
      if (path === '/enable' && req.method === 'POST') {
        const body = await req.json();
        config = { ...config, ...body, enabled: true };
        log('INFO', '🟢 تم تفعيل التداول التلقائي', config);
        return Response.json({ success: true, config }, { headers: corsHeaders });
      }
      
      // Disable auto trading
      if (path === '/disable' && req.method === 'POST') {
        config.enabled = false;
        log('INFO', '🔴 تم إيقاف التداول التلقائي');
        return Response.json({ success: true, config }, { headers: corsHeaders });
      }
      
      // Update config
      if (path === '/config' && req.method === 'POST') {
        const body = await req.json();
        config = { ...config, ...body };
        log('INFO', '⚙️ تم تحديث الإعدادات', config);
        return Response.json({ success: true, config }, { headers: corsHeaders });
      }
      
      // Get logs
      if (path === '/logs' && req.method === 'GET') {
        return Response.json({ 
          success: true, 
          logs: tradingLogs,
          count: tradingLogs.length 
        }, { headers: corsHeaders });
      }
      
      // Trigger manual cycle (for testing)
      if (path === '/run' && req.method === 'POST') {
        await runAutoTradingCycle();
        return Response.json({ success: true, message: 'تم تنفيذ الدورة' }, { headers: corsHeaders });
      }
      
      // Health check
      if (path === '/health') {
        return Response.json({ 
          status: 'ok',
          service: 'auto-trader',
          enabled: config.enabled,
          timestamp: new Date().toISOString()
        }, { headers: corsHeaders });
      }
      
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
      
    } catch (e: any) {
      log('ERROR', e.message);
      return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 START SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

console.log('🤖 Auto Trading Engine starting...');
console.log('📡 Port: 3005');

// Start monitoring interval
setInterval(runAutoTradingCycle, MONITOR_INTERVAL);

// Initial market data fetch
fetchAllMarketData().catch(console.error);

console.log('✅ Auto Trading Engine running');
