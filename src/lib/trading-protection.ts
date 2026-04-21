/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🛡️ TRADING PROTECTION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * نظام حماية شامل للتداول الآلي
 * يتضمن: فلتر الاتجاه، فلتر الإشارات الكاذبة، إدارة المخاطر، منع الأخبار
 */

import { MODE, getCurrentModeConfig } from '@/config/trading-mode';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'LONG' | 'SHORT' | 'CALL' | 'PUT';
  price: number;
  quantity?: number;
  timeframe?: string;
  strategy?: string;
  stopLoss?: number;
  takeProfit?: number;
  confidence?: number;
}

export interface MarketContext {
  ibConnected: boolean;
  accountBalance: number;
  dailyPnL: number;
  maxDailyLoss: number;
  openPositions: number;
  maxOpenPositions: number;
  lastSignalKey?: string;
  lastSignalTime?: number;
  
  // Market Data for Filters
  ema20?: number;
  ema50?: number;
  ema200?: number;
  atr?: number;
  spread?: number;
  candleRange?: number;
  currentPrice?: number;
}

export interface RiskSettings {
  riskPerTrade: number;        // نسبة المخاطرة لكل صفقة (0.5 = 0.5%)
  maxDailyLoss: number;        // أقصى خسارة يومية (2 = 2%)
  maxOpenPositions: number;    // أقصى عدد صفقات مفتوحة
  minRiskReward: number;       // أقل نسبة مخاطرة/عائد (1:2)
  defaultStopPercent: number;  // وقف الخسارة الافتراضي %
}

export interface ExecutionResult {
  ok: boolean;
  reason?: string;
  warning?: string;
  data?: {
    positionSize?: number;
    stopLoss?: number;
    takeProfit1?: number;
    takeProfit2?: number;
    riskAmount?: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  riskPerTrade: 0.5,           // 0.5% من رأس المال
  maxDailyLoss: 2,             // 2% أقصى خسارة يومية
  maxOpenPositions: 1,         // صفقة واحدة مفتوحة
  minRiskReward: 2,            // 1:2 على الأقل
  defaultStopPercent: 1,       // 1% وقف خسارة افتراضي
};

// نوافذ منع التداول وقت الأخبار (توقيت UTC)
export const NEWS_BLOCK_WINDOWS = [
  { start: "13:15", end: "13:45", name: "CPI/Core Data" },
  { start: "14:30", end: "15:00", name: "NFP/Employment" },
  { start: "18:00", end: "18:30", name: "FOMC Decision" },
  { start: "19:30", end: "20:00", name: "Fed Press Conference" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🗄️ SIGNAL CACHE (Duplicate Prevention)
// ═══════════════════════════════════════════════════════════════════════════════

const signalCache = new Map<string, number>();
const DEFAULT_COOLDOWN_MS = 60_000; // دقيقة واحدة

export function isDuplicateSignal(
  signal: TradingSignal, 
  cooldownMs: number = DEFAULT_COOLDOWN_MS
): { duplicate: boolean; lastTime?: number } {
  const key = `${signal.symbol}-${signal.action}-${signal.timeframe || 'default'}`;
  const now = Date.now();
  const last = signalCache.get(key);
  
  if (last && now - last < cooldownMs) {
    return { duplicate: true, lastTime: last };
  }
  
  signalCache.set(key, now);
  return { duplicate: false };
}

export function clearSignalCache(): void {
  signalCache.clear();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📰 NEWS FILTER
// ═══════════════════════════════════════════════════════════════════════════════

export function isInNewsBlockWindow(): { blocked: boolean; window?: typeof NEWS_BLOCK_WINDOWS[0] } {
  const now = new Date();
  const currentTime = now.toISOString().slice(11, 16); // HH:MM in UTC
  
  for (const window of NEWS_BLOCK_WINDOWS) {
    if (currentTime >= window.start && currentTime <= window.end) {
      return { blocked: true, window };
    }
  }
  
  return { blocked: false };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 TREND FILTER
// ═══════════════════════════════════════════════════════════════════════════════

export function trendFilter(
  price: number,
  ema20: number | undefined,
  ema50: number | undefined,
  ema200: number | undefined,
  action: 'BUY' | 'SELL' | 'LONG' | 'SHORT'
): { allowed: boolean; reason?: string } {
  // إذا لم تكن بيانات EMA متوفرة، نسمح بالتداول (يمكن تغيير هذا لمنع التداول)
  if (!ema200) {
    return { allowed: true, reason: 'EMA data not available - proceeding' };
  }
  
  const isBuy = action === 'BUY' || action === 'LONG';
  
  // شراء: السعر فوق EMA 200
  if (isBuy) {
    if (price < ema200) {
      return { allowed: false, reason: `❌ Trend Filter: Price (${price}) below EMA 200 (${ema200}) - No BUY` };
    }
    
    // تأكيد إضافي: EMA 20 فوق EMA 50
    if (ema20 && ema50 && ema20 < ema50) {
      return { allowed: false, reason: `❌ Trend Filter: EMA 20 (${ema20}) below EMA 50 (${ema50}) - Weak uptrend` };
    }
    
    return { allowed: true, reason: `✅ Trend Filter: Bullish alignment confirmed` };
  }
  
  // بيع: السعر تحت EMA 200
  if (price > ema200) {
    return { allowed: false, reason: `❌ Trend Filter: Price (${price}) above EMA 200 (${ema200}) - No SELL` };
  }
  
  // تأكيد إضافي: EMA 20 تحت EMA 50
  if (ema20 && ema50 && ema20 > ema50) {
    return { allowed: false, reason: `❌ Trend Filter: EMA 20 (${ema20}) above EMA 50 (${ema50}) - Weak downtrend` };
  }
  
  return { allowed: true, reason: `✅ Trend Filter: Bearish alignment confirmed` };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 FALSE SIGNAL FILTER
// ═══════════════════════════════════════════════════════════════════════════════

export interface FalseSignalParams {
  candleRange: number;
  atr: number;
  spread: number;
  signalAgeSec: number;
  volume?: number;
  avgVolume?: number;
}

export function falseSignalFilter(params: FalseSignalParams): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // لا دخول إذا السبريد واسع (أكثر من 20% من ATR)
  if (params.atr > 0 && params.spread > params.atr * 0.2) {
    reasons.push(`Spread too wide: ${params.spread} > ${(params.atr * 0.2).toFixed(2)} (20% of ATR)`);
  }
  
  // لا دخول إذا الشمعة كبيرة بشكل شاذ (أكثر من 2.5x ATR)
  if (params.atr > 0 && params.candleRange > params.atr * 2.5) {
    reasons.push(`Candle abnormally large: ${params.candleRange} > ${(params.atr * 2.5).toFixed(2)} (2.5x ATR)`);
  }
  
  // لا دخول إذا الإشارة متأخرة (أكثر من 30 ثانية)
  if (params.signalAgeSec > 30) {
    reasons.push(`Signal too old: ${params.signalAgeSec}s > 30s`);
  }
  
  // لا دخول إذا ATR صفر أو سالب
  if (params.atr <= 0) {
    reasons.push(`Invalid ATR: ${params.atr}`);
  }
  
  // لا دخول إذا الحجم منخفض جداً (أقل من 50% من المتوسط)
  if (params.volume && params.avgVolume && params.volume < params.avgVolume * 0.5) {
    reasons.push(`Low volume: ${params.volume} < ${(params.avgVolume * 0.5).toFixed(0)} (50% of avg)`);
  }
  
  return {
    allowed: reasons.length === 0,
    reasons
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 POSITION SIZE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

export function calculatePositionSize(
  accountSize: number,
  riskPercent: number,
  stopDistance: number,
  dollarPerPoint: number = 1
): { quantity: number; riskAmount: number } {
  // حساب مبلغ المخاطرة
  const riskAmount = accountSize * (riskPercent / 100);
  
  // حساب الكمية
  const stopCost = stopDistance * dollarPerPoint;
  const quantity = stopCost > 0 ? Math.floor(riskAmount / stopCost) : 1;
  
  return {
    quantity: Math.max(quantity, 1),
    riskAmount
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 RISK LEVELS CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

export function buildRiskLevels(
  entry: number,
  side: 'BUY' | 'SELL',
  stopDistance: number,
  riskRewardRatio: number = 2
): {
  stopLoss: number;
  takeProfit1: number;  // 1R
  takeProfit2: number;  // 2R
} {
  const isBuy = side === 'BUY';
  
  return {
    stopLoss: isBuy ? entry - stopDistance : entry + stopDistance,
    takeProfit1: isBuy ? entry + stopDistance : entry - stopDistance,       // 1R
    takeProfit2: isBuy ? entry + stopDistance * riskRewardRatio : entry - stopDistance * riskRewardRatio, // 2R
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ MAIN EXECUTION CHECK
// ═══════════════════════════════════════════════════════════════════════════════

export function canExecuteTrade(
  signal: TradingSignal,
  context: MarketContext,
  settings: RiskSettings = DEFAULT_RISK_SETTINGS
): ExecutionResult {
  const modeConfig = getCurrentModeConfig();
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`${modeConfig.emoji} 🛡️ TRADING PROTECTION CHECK`);
  console.log('═══════════════════════════════════════════════════════════════════');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. التحقق من صحة الإشارة
  // ═══════════════════════════════════════════════════════════════════════════
  if (!signal?.symbol || !signal?.action) {
    console.log('❌ BLOCKED: Invalid signal - missing symbol or action');
    return { ok: false, reason: 'invalid_signal' };
  }
  
  if (!signal.price || signal.price <= 0) {
    console.log('❌ BLOCKED: Invalid price');
    return { ok: false, reason: 'invalid_price' };
  }
  
  console.log(`✅ Signal validation passed: ${signal.action} ${signal.symbol} @ ${signal.price}`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 2. التحقق من اتصال IB
  // ═══════════════════════════════════════════════════════════════════════════
  if (!context.ibConnected) {
    console.log('❌ BLOCKED: IB not connected');
    return { ok: false, reason: 'ib_disconnected' };
  }
  console.log('✅ IB connection confirmed');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 3. التحقق من الحد اليومي للخسارة
  // ═══════════════════════════════════════════════════════════════════════════
  const maxLossAmount = context.accountBalance * (settings.maxDailyLoss / 100);
  if (context.dailyPnL < 0 && Math.abs(context.dailyPnL) >= maxLossAmount) {
    console.log(`❌ BLOCKED: Daily loss limit reached (${context.dailyPnL} >= -${maxLossAmount})`);
    return { ok: false, reason: 'daily_loss_limit_reached' };
  }
  console.log(`✅ Daily loss check passed (P&L: ${context.dailyPnL}, Limit: -${maxLossAmount.toFixed(2)})`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 4. التحقق من عدد الصفقات المفتوحة
  // ═══════════════════════════════════════════════════════════════════════════
  if (context.openPositions >= settings.maxOpenPositions) {
    console.log(`❌ BLOCKED: Max open positions reached (${context.openPositions}/${settings.maxOpenPositions})`);
    return { ok: false, reason: 'max_positions_reached' };
  }
  console.log(`✅ Position limit check passed (${context.openPositions}/${settings.maxOpenPositions})`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 5. التحقق من التكرار
  // ═══════════════════════════════════════════════════════════════════════════
  const dupCheck = isDuplicateSignal(signal);
  if (dupCheck.duplicate) {
    console.log(`❌ BLOCKED: Duplicate signal (last: ${new Date(dupCheck.lastTime!).toISOString()})`);
    return { ok: false, reason: 'duplicate_signal' };
  }
  console.log('✅ Duplicate check passed');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 6. التحقق من وقت الأخبار
  // ═══════════════════════════════════════════════════════════════════════════
  const newsCheck = isInNewsBlockWindow();
  if (newsCheck.blocked) {
    console.log(`❌ BLOCKED: News window active (${newsCheck.window?.name})`);
    return { ok: false, reason: `news_block: ${newsCheck.window?.name}` };
  }
  console.log('✅ News filter passed');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 7. فلتر الاتجاه (إذا كانت بيانات EMA متوفرة)
  // ═══════════════════════════════════════════════════════════════════════════
  if (context.ema200 && context.currentPrice) {
    const trendResult = trendFilter(
      context.currentPrice,
      context.ema20,
      context.ema50,
      context.ema200,
      signal.action as 'BUY' | 'SELL'
    );
    
    if (!trendResult.allowed) {
      console.log(trendResult.reason);
      return { ok: false, reason: trendResult.reason };
    }
    console.log(trendResult.reason);
  } else {
    console.log('⚠️ Trend filter skipped (EMA data not available)');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 8. حساب المخاطرة وحجم الصفقة
  // ═══════════════════════════════════════════════════════════════════════════
  const stopDistance = signal.stopLoss 
    ? Math.abs(signal.price - signal.stopLoss)
    : signal.price * (settings.defaultStopPercent / 100);
  
  const positionCalc = calculatePositionSize(
    context.accountBalance,
    settings.riskPerTrade,
    stopDistance
  );
  
  console.log(`💰 Risk Calculation:`);
  console.log(`   Account: $${context.accountBalance.toFixed(2)}`);
  console.log(`   Risk: ${settings.riskPerTrade}% = $${positionCalc.riskAmount.toFixed(2)}`);
  console.log(`   Stop Distance: ${stopDistance.toFixed(2)}`);
  console.log(`   Position Size: ${positionCalc.quantity}`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 9. حساب مستويات المخاطرة
  // ═══════════════════════════════════════════════════════════════════════════
  const isBuy = signal.action === 'BUY' || signal.action === 'LONG' || signal.action === 'CALL';
  const riskLevels = buildRiskLevels(
    signal.price,
    isBuy ? 'BUY' : 'SELL',
    stopDistance,
    settings.minRiskReward
  );
  
  console.log(`🎯 Risk Levels:`);
  console.log(`   Stop Loss: ${riskLevels.stopLoss.toFixed(2)}`);
  console.log(`   Take Profit 1 (1R): ${riskLevels.takeProfit1.toFixed(2)}`);
  console.log(`   Take Profit 2 (2R): ${riskLevels.takeProfit2.toFixed(2)}`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 10. النتيجة النهائية
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`✅ APPROVED: Trade can be executed`);
  console.log('═══════════════════════════════════════════════════════════════════');
  
  return {
    ok: true,
    data: {
      positionSize: positionCalc.quantity,
      stopLoss: riskLevels.stopLoss,
      takeProfit1: riskLevels.takeProfit1,
      takeProfit2: riskLevels.takeProfit2,
      riskAmount: positionCalc.riskAmount
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 LOGGING HELPER
// ═══════════════════════════════════════════════════════════════════════════════

export function logTradeDecision(
  signal: TradingSignal,
  result: ExecutionResult,
  additionalInfo?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: 'trade_decision',
    symbol: signal.symbol,
    action: signal.action,
    price: signal.price,
    timeframe: signal.timeframe,
    strategy: signal.strategy,
    accepted: result.ok,
    reason: result.reason ?? 'approved',
    data: result.data,
    ...additionalInfo
  };
  
  console.log(JSON.stringify(logEntry, null, 2));
}

// Export default
export default {
  canExecuteTrade,
  isDuplicateSignal,
  isInNewsBlockWindow,
  trendFilter,
  falseSignalFilter,
  calculatePositionSize,
  buildRiskLevels,
  logTradeDecision,
  clearSignalCache,
  DEFAULT_RISK_SETTINGS,
  NEWS_BLOCK_WINDOWS
};
