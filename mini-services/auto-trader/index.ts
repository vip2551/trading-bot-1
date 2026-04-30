import { serve } from "bun";

// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 AUTO TRADING ENGINE - Safe Autonomous Trading System
// ═══════════════════════════════════════════════════════════════════════════════

const MONITOR_INTERVAL = 30000; // 30 seconds
const PRICE_FETCH_INTERVAL = 10000; // 10 seconds
const AUTO_TRADE_COOLDOWN = 5 * 60 * 1000; // 5 minutes between auto trades

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRADING MODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

type TradingMode = 'SIMULATION' | 'PAPER' | 'LIVE';

const MODE: TradingMode = (process.env.TRADING_MODE as TradingMode) || 'PAPER';

const MODE_CONFIG = {
  SIMULATION: {
    name: 'Simulation',
    emoji: '🧪',
    allowRealTrades: false,
    requireIBConnection: false,
    allowFakeData: true,
  },
  PAPER: {
    name: 'Paper Trading',
    emoji: '📝',
    allowRealTrades: true,
    requireIBConnection: true,
    allowFakeData: false,
  },
  LIVE: {
    name: 'Live Trading',
    emoji: '🔴',
    allowRealTrades: true,
    requireIBConnection: true,
    allowFakeData: false,
  },
} as const;

const getCurrentModeConfig = () => MODE_CONFIG[MODE];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 SAFETY VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate market data - Returns true ONLY if data is valid and real
 */
function validateMarketData(data: unknown): data is { price: number; isReal: boolean; [key: string]: unknown } {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as Record<string, unknown>;

  // Check price is valid
  if (typeof d.price !== 'number' || isNaN(d.price) || d.price <= 0) {
    return false;
  }

  // In non-simulation modes, verify data is real
  if (!getCurrentModeConfig().allowFakeData) {
    // Data must be explicitly marked as real
    if (d.isReal !== true) {
      return false;
    }
  }

  return true;
}

/**
 * Validate trade parameters
 */
function validateTradeParams(params: {
  symbol?: string;
  quantity?: number;
  direction?: string;
}): { valid: boolean; error?: string } {
  if (!params.symbol || typeof params.symbol !== 'string') {
    return { valid: false, error: '❌ Invalid or missing symbol' };
  }

  if (!params.quantity || params.quantity <= 0) {
    return { valid: false, error: '❌ Invalid quantity' };
  }

  if (!params.direction || !['CALL', 'PUT', 'BUY', 'SELL'].includes(params.direction)) {
    return { valid: false, error: '❌ Invalid direction' };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 CONFIGURATION & STATE
// ═══════════════════════════════════════════════════════════════════════════════

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
let priceHistory = new Map<string, number[]>(); // Store price history for RSI
let tradingLogs: Array<{ time: Date; type: string; message: string; data?: any }> = [];
let ibConnected = false;

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TECHNICAL INDICATORS (Real Implementations)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate RSI using Wilder's Smoothing Method
 * Requires at least 15 price points for accurate calculation
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Not enough data - return neutral
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate RSI using smoothed averages
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate EMA for trend analysis
 */
function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;

  // First EMA is SMA
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const multiplier = 2 / (period + 1);

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate MACD
 */
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } | null {
  if (prices.length < 26) return null;

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  if (!ema12 || !ema26) return null;

  const macd = ema12 - ema26;
  
  // Simplified signal line (9-period EMA of MACD would need more history)
  const signal = macd * 0.8; // Approximation
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MARKET DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchMarketData(symbol: string): Promise<{ price: number; change: number; volume: number; isReal: boolean } | null> {
  try {
    // Try main app price API
    const res = await fetch(`http://localhost:3000/api/price?symbol=${symbol}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      // Only return if we have valid price data
      if (data.price || data.spotPrice) {
        const price = data.price || data.spotPrice || 0;
        
        // Store price in history for RSI calculation
        const history = priceHistory.get(symbol) || [];
        history.push(price);
        // Keep last 50 prices for analysis
        if (history.length > 50) history.shift();
        priceHistory.set(symbol, history);
        
        return {
          price,
          change: data.change || 0,
          volume: data.volume || 0,
          isReal: true
        };
      }
    }
  } catch (e) {
    log('ERROR', `⚠️ فشل الحصول على بيانات حقيقية لـ ${symbol}`, { error: String(e) });
  }

  // 🚫 CRITICAL: In non-simulation mode, do NOT use fake data
  if (!getCurrentModeConfig().allowFakeData) {
    log('ERROR', `🚫 لا توجد بيانات حقيقية لـ ${symbol} - لن يتم التداول`);
    return null;
  }

  // Only in SIMULATION mode, use placeholder
  log('WARN', `🧪 [SIMULATION] استخدام بيانات محاكاة لـ ${symbol}`);
  return {
    price: 5800 + (Math.random() - 0.5) * 20,
    change: (Math.random() - 0.5) * 2,
    volume: 1000000,
    isReal: false
  };
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
// 🧠 TECHNICAL ANALYSIS ENGINE (Using Real Indicators)
// ═══════════════════════════════════════════════════════════════════════════════

interface TechnicalAnalysis {
  symbol: string;
  price: number;
  rsi: number;
  rsiValid: boolean;
  macd: { value: number; signal: number; histogram: number } | null;
  trend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  trendStrength: number;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  reasons: string[];
  warnings: string[];
}

function analyzeSymbol(symbol: string): TechnicalAnalysis | null {
  const data = marketData.get(symbol);
  
  // 🚫 CRITICAL: Do not analyze without valid market data
  if (!validateMarketData(data)) {
    log('WARN', `⚠️ لا توجد بيانات حقيقية لـ ${symbol} - تخطي التحليل`);
    return null;
  }
  
  const price = data.price;
  const history = priceHistory.get(symbol) || [];
  
  const reasons: string[] = [];
  const warnings: string[] = [];
  
  // Calculate real RSI if we have enough price history
  let rsi = 50;
  let rsiValid = false;
  
  if (history.length >= 15) {
    rsi = calculateRSI(history);
    rsiValid = true;
    reasons.push(`RSI الحقيقي: ${rsi.toFixed(1)}`);
  } else {
    warnings.push(`⚠️ بيانات غير كافية لحساب RSI (${history.length}/15)`);
  }
  
  // Calculate MACD if possible
  const macdResult = history.length >= 26 ? calculateMACD(history) : null;
  if (macdResult) {
    reasons.push(`MACD: ${macdResult.histogram > 0 ? 'إيجابي' : 'سلبي'}`);
  } else {
    warnings.push(`⚠️ بيانات غير كافية لحساب MACD (${history.length}/26)`);
  }
  
  // Determine trend based on real data
  let trend: TechnicalAnalysis['trend'] = 'NEUTRAL';
  let trendStrength = 50;
  
  const momentum = data.change;
  
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
  
  // RSI confirmation
  if (rsiValid) {
    if (rsi < 30 && trend.includes('BULLISH')) {
      trendStrength += 10;
      reasons.push('RSI في منطقة التشبع البيعي - تأكيد الصعود');
    } else if (rsi > 70 && trend.includes('BEARISH')) {
      trendStrength += 10;
      reasons.push('RSI في منطقة التشبع الشرائي - تأكيد الهبوط');
    }
  }
  
  // Volume confirmation
  if (data.volume > 3000000) {
    reasons.push('حجم تداول عالي - تأكيد الإشارة');
    trendStrength = Math.min(100, trendStrength + 10);
  }
  
  // Determine signal
  let signal: TechnicalAnalysis['signal'] = 'HOLD';
  let confidence = trendStrength;
  
  if (trend === 'STRONG_BULLISH' && rsiValid && rsi < 70) {
    signal = 'STRONG_BUY';
    confidence = Math.min(95, trendStrength + 10);
  } else if (trend === 'BULLISH' && rsiValid && rsi < 60) {
    signal = 'BUY';
    confidence = trendStrength;
  } else if (trend === 'STRONG_BEARISH' && rsiValid && rsi > 30) {
    signal = 'STRONG_SELL';
    confidence = Math.min(95, trendStrength + 10);
  } else if (trend === 'BEARISH' && rsiValid && rsi > 40) {
    signal = 'SELL';
    confidence = trendStrength;
  }
  
  // Reduce confidence if we don't have enough data
  if (!rsiValid || !macdResult) {
    confidence = Math.max(30, confidence - 20);
  }
  
  return {
    symbol,
    price,
    rsi,
    rsiValid,
    macd: macdResult ? { value: macdResult.macd, signal: macdResult.signal, histogram: macdResult.histogram } : null,
    trend,
    trendStrength: Math.round(trendStrength),
    signal,
    confidence: Math.round(confidence),
    reasons,
    warnings
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
  // Validate trade parameters
  const validation = validateTradeParams({
    symbol: analysis.symbol,
    quantity: 1,
    direction
  });
  
  if (!validation.valid) {
    log('ERROR', validation.error!);
    return null;
  }
  
  // Check mode restrictions
  const modeConfig = getCurrentModeConfig();
  
  if (MODE === 'SIMULATION') {
    log('INFO', `🧪 [SIMULATION] محاكاة صفقة ${direction} على ${analysis.symbol}`);
    return { simulated: true, analysis };
  }
  
  // Check IB connection for PAPER/LIVE modes
  if (modeConfig.requireIBConnection && !ibConnected) {
    log('ERROR', '❌ IB غير متصل - لا يمكن التداول');
    return null;
  }
  
  // Check cooldown
  const lastTrade = lastAutoTrade.get(analysis.symbol) || 0;
  if (Date.now() - lastTrade < AUTO_TRADE_COOLDOWN) {
    return null;
  }
  
  try {
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
        stopLoss: 20,
        stopLossType: 'PERCENT',
        takeProfit: 50,
        takeProfitType: 'PERCENT',
        maxHoldingMinutes: 120
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
  
  // Trend reversal exit (only if we have valid RSI)
  if (analysis.rsiValid) {
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
  
  // Don't trade without valid RSI
  if (!analysis.rsiValid) {
    return { shouldEnter: false, direction: null, reasons: ['⚠️ بيانات غير كافية لحساب RSI'] };
  }
  
  // Check confidence threshold
  if (analysis.confidence < config.minConfidence) {
    return { shouldEnter: false, direction: null, reasons: [`الثقة ${analysis.confidence}% أقل من الحد الأدنى ${config.minConfidence}%`] };
  }
  
  // Strong buy signal
  if (analysis.signal === 'STRONG_BUY') {
    shouldEnter = true;
    direction = 'CALL';
    reasons.push(...analysis.reasons);
    reasons.push(`إشارة شراء قوية - ثقة ${analysis.confidence}%`);
  }
  // Buy signal with RSI confirmation
  else if (analysis.signal === 'BUY' && analysis.rsi < 50) {
    shouldEnter = true;
    direction = 'CALL';
    reasons.push(...analysis.reasons);
    reasons.push(`إشارة شراء - RSI ${analysis.rsi.toFixed(1)}`);
  }
  // Strong sell signal
  else if (analysis.signal === 'STRONG_SELL') {
    shouldEnter = true;
    direction = 'PUT';
    reasons.push(...analysis.reasons);
    reasons.push(`إشارة بيع قوية - ثقة ${analysis.confidence}%`);
  }
  // Sell signal with RSI confirmation
  else if (analysis.signal === 'SELL' && analysis.rsi > 50) {
    shouldEnter = true;
    direction = 'PUT';
    reasons.push(...analysis.reasons);
    reasons.push(`إشارة بيع - RSI ${analysis.rsi.toFixed(1)}`);
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
  
  // In non-simulation mode, require real data
  if (!getCurrentModeConfig().allowFakeData && !hasRealData) {
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
  const modeConfig = getCurrentModeConfig();
  const entry = { time: new Date(), type, message, data };
  tradingLogs.push(entry);
  
  // Keep only last 100 logs
  if (tradingLogs.length > 100) {
    tradingLogs = tradingLogs.slice(-100);
  }
  
  const emoji = type === 'TRADE' ? '💰' : type === 'ERROR' ? '❌' : '📋';
  console.log(`${emoji} ${modeConfig.emoji} [${new Date().toISOString()}] ${message}`);
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
'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
'Access-Control-Allow-Credentials': 'true'
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
          mode: {
            current: MODE,
            config: getCurrentModeConfig(),
            ibConnected
          },
          config,
          status: {
            enabled: config.enabled,
            openPositions: positions.length,
            maxPositions: config.maxOpenPositions,
            lastCheck: new Date().toISOString(),
            tradingHours: config.tradingHours,
            priceHistoryCount: Object.fromEntries(
              config.symbols.map(s => [s, priceHistory.get(s)?.length || 0])
            )
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
        return Response.json({ success: true, config, mode: MODE }, { headers: corsHeaders });
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
      
      // Set IB connection status
      if (path === '/ib-status' && req.method === 'POST') {
        const body = await req.json();
        ibConnected = body.connected === true;
        log('INFO', `📡 IB Connection: ${ibConnected ? 'Connected' : 'Disconnected'}`);
        return Response.json({ success: true, ibConnected }, { headers: corsHeaders });
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
          mode: MODE,
          enabled: config.enabled,
          ibConnected,
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

const modeConfig = getCurrentModeConfig();

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       🤖 AUTO TRADING ENGINE - SAFE MODE                  ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║ ${modeConfig.emoji} Mode: ${modeConfig.name.padEnd(48)}║`);
console.log(`║ 📡 Port: 3005                                              ║`);
console.log(`║ 🔒 Allow Fake Data: ${String(modeConfig.allowFakeData).padEnd(32)}║`);
console.log(`║ 🔗 Require IB: ${String(modeConfig.requireIBConnection).padEnd(38)}║`);
console.log('╚════════════════════════════════════════════════════════════╝');

// Start monitoring interval
setInterval(runAutoTradingCycle, MONITOR_INTERVAL);

// Initial market data fetch
fetchAllMarketData().catch(console.error);

console.log('✅ Auto Trading Engine running safely');
