// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 ADVANCED TRADING STRATEGY ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { Candle, calculateRSI, calculateMACD, calculateEMAArray, calculateBollingerBands, calculateATR, analyzeTrend } from './indicators';
import { getHistoricalData, getRealTimePrice, PriceData } from './market-data-service';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 STRATEGY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface StrategyConfig {
  name: string;
  version: string;
  
  // RSI Settings
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
  
  // MACD Settings
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  
  // EMA Settings
  emaShort: number;
  emaMedium: number;
  emaLong: number;
  
  // Bollinger Bands
  bbPeriod: number;
  bbStdDev: number;
  
  // Trend Settings
  adxThreshold: number;
  minTrendStrength: number;
  
  // Risk Management
  minConfidence: number;
  minRiskReward: number;
  maxSpread: number;
  minVolume: number;
  
  // Confirmation Requirements
  requireMultipleConfirmations: boolean;
  minConfirmations: number;
}

const DEFAULT_CONFIG: StrategyConfig = {
  name: 'Advanced Multi-Indicator Strategy',
  version: '2.0',
  
  rsiPeriod: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
  
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  
  emaShort: 9,
  emaMedium: 21,
  emaLong: 50,
  
  bbPeriod: 20,
  bbStdDev: 2,
  
  adxThreshold: 25,
  minTrendStrength: 60,
  
  minConfidence: 70,
  minRiskReward: 2.0,
  maxSpread: 0.5,
  minVolume: 100000,
  
  requireMultipleConfirmations: true,
  minConfirmations: 3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 SIGNAL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
export type TrendDirection = 'BULLISH' | 'BEARISH' | 'SIDEWAYS';

export interface SignalConfirmation {
  indicator: string;
  signal: SignalType;
  strength: number; // 0-100
  reason: string;
  weight: number; // Importance of this indicator
}

export interface TradingSignal {
  symbol: string;
  signal: SignalType;
  direction: 'CALL' | 'PUT' | 'NEUTRAL';
  confidence: number;
  price: number;
  
  // Confirmations
  confirmations: SignalConfirmation[];
  confirmationCount: number;
  
  // Technical Analysis
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  ema: { short: number; medium: number; long: number };
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  
  // Trend
  trend: TrendDirection;
  trendStrength: number;
  adx: number;
  
  // Risk Management
  suggestedEntry: number;
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
  riskRewardRatio: number;
  
  // Metadata
  timestamp: Date;
  source: string;
  isReal: boolean;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 ANALYSIS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze RSI Signal
 */
function analyzeRSISignal(closes: number[], config: StrategyConfig): SignalConfirmation {
  const rsi = calculateRSI(closes, config.rsiPeriod);
  let signal: SignalType = 'HOLD';
  let strength = 50;
  let reason = '';
  
  if (rsi < config.rsiOversold) {
    signal = 'STRONG_BUY';
    strength = 90;
    reason = `RSI في منطقة التشبع البيعي (${rsi.toFixed(1)} < ${config.rsiOversold})`;
  } else if (rsi < config.rsiOversold + 10) {
    signal = 'BUY';
    strength = 70;
    reason = `RSI قريب من التشبع البيعي (${rsi.toFixed(1)})`;
  } else if (rsi > config.rsiOverbought) {
    signal = 'STRONG_SELL';
    strength = 90;
    reason = `RSI في منطقة التشبع الشرائي (${rsi.toFixed(1)} > ${config.rsiOverbought})`;
  } else if (rsi > config.rsiOverbought - 10) {
    signal = 'SELL';
    strength = 70;
    reason = `RSI قريب من التشبع الشرائي (${rsi.toFixed(1)})`;
  } else {
    reason = `RSI محايد (${rsi.toFixed(1)})`;
  }
  
  return {
    indicator: 'RSI',
    signal,
    strength,
    reason,
    weight: 1.5,
  };
}

/**
 * Analyze MACD Signal
 */
function analyzeMACDSignal(closes: number[], config: StrategyConfig): SignalConfirmation {
  const macd = calculateMACD(closes, config.macdFast, config.macdSlow, config.macdSignal);
  let signal: SignalType = 'HOLD';
  let strength = 50;
  let reason = '';
  
  if (!macd) {
    return {
      indicator: 'MACD',
      signal: 'HOLD',
      strength: 0,
      reason: 'بيانات غير كافية لحساب MACD',
      weight: 1.2,
    };
  }
  
  // Histogram crossover
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    signal = macd.histogram > 0.5 ? 'STRONG_BUY' : 'BUY';
    strength = macd.histogram > 1 ? 85 : 70;
    reason = `MACD تقاطع صاعد (Histogram: ${macd.histogram.toFixed(2)})`;
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    signal = macd.histogram < -0.5 ? 'STRONG_SELL' : 'SELL';
    strength = Math.abs(macd.histogram) > 1 ? 85 : 70;
    reason = `MACD تقاطع هابط (Histogram: ${macd.histogram.toFixed(2)})`;
  } else if (macd.macd > macd.signal) {
    signal = 'BUY';
    strength = 60;
    reason = 'MACD فوق خط الإشارة';
  } else {
    signal = 'SELL';
    strength = 60;
    reason = 'MACD تحت خط الإشارة';
  }
  
  return {
    indicator: 'MACD',
    signal,
    strength,
    reason,
    weight: 1.3,
  };
}

/**
 * Analyze EMA Alignment
 */
function analyzeEMAAlignment(closes: number[], config: StrategyConfig): SignalConfirmation {
  const emaShort = calculateEMAArray(closes, config.emaShort);
  const emaMedium = calculateEMAArray(closes, config.emaMedium);
  const emaLong = calculateEMAArray(closes, config.emaLong);
  
  const lastShort = emaShort[emaShort.length - 1];
  const lastMedium = emaMedium[emaMedium.length - 1];
  const lastLong = emaLong[emaLong.length - 1];
  const lastPrice = closes[closes.length - 1];
  
  if (!lastShort || !lastMedium || !lastLong) {
    return {
      indicator: 'EMA',
      signal: 'HOLD',
      strength: 0,
      reason: 'بيانات غير كافية لحساب EMA',
      weight: 1.4,
    };
  }
  
  let signal: SignalType = 'HOLD';
  let strength = 50;
  let reason = '';
  
  // Perfect bullish alignment: Price > EMA9 > EMA21 > EMA50
  if (lastPrice > lastShort && lastShort > lastMedium && lastMedium > lastLong) {
    signal = 'STRONG_BUY';
    strength = 90;
    reason = 'محاذاة صاعدة مثالية: السعر > EMA9 > EMA21 > EMA50';
  }
  // Perfect bearish alignment: Price < EMA9 < EMA21 < EMA50
  else if (lastPrice < lastShort && lastShort < lastMedium && lastMedium < lastLong) {
    signal = 'STRONG_SELL';
    strength = 90;
    reason = 'محاذاة هبوطية مثالية: السعر < EMA9 < EMA21 < EMA50';
  }
  // Price above EMA21
  else if (lastPrice > lastMedium) {
    signal = 'BUY';
    strength = 65;
    reason = 'السعر فوق EMA21 - اتجاه صاعد';
  }
  // Price below EMA21
  else if (lastPrice < lastMedium) {
    signal = 'SELL';
    strength = 65;
    reason = 'السعر تحت EMA21 - اتجاه هابط';
  } else {
    reason = 'EMA محايد - لا يوجد اتجاه واضح';
  }
  
  return {
    indicator: 'EMA',
    signal,
    strength,
    reason,
    weight: 1.4,
  };
}

/**
 * Analyze Bollinger Bands
 */
function analyzeBollingerBandsSignal(closes: number[], config: StrategyConfig): SignalConfirmation {
  const bb = calculateBollingerBands(closes, config.bbPeriod, config.bbStdDev);
  const lastPrice = closes[closes.length - 1];
  
  let signal: SignalType = 'HOLD';
  let strength = 50;
  let reason = '';
  
  if (lastPrice <= bb.lower) {
    signal = 'STRONG_BUY';
    strength = 85;
    reason = `السعر عند الحد السفلي لبولينجر (${bb.lower.toFixed(2)})`;
  } else if (lastPrice >= bb.upper) {
    signal = 'STRONG_SELL';
    strength = 85;
    reason = `السعر عند الحد العلوي لبولينجر (${bb.upper.toFixed(2)})`;
  } else if (lastPrice < bb.middle) {
    signal = 'SELL';
    strength = 55;
    reason = 'السعر تحت المتوسط - ضغط هبوطي';
  } else if (lastPrice > bb.middle) {
    signal = 'BUY';
    strength = 55;
    reason = 'السعر فوق المتوسط - ضغط صعودي';
  }
  
  // Check for squeeze (potential breakout)
  if (bb.width < 3) {
    reason += ' | ⚠️ ضيق شديد - انفجار متوقع';
    strength = Math.max(strength - 10, 30);
  }
  
  return {
    indicator: 'BOLLINGER',
    signal,
    strength,
    reason,
    weight: 1.1,
  };
}

/**
 * Analyze Volume
 */
function analyzeVolume(volumes: number[], config: StrategyConfig): SignalConfirmation {
  if (volumes.length < 20) {
    return {
      indicator: 'VOLUME',
      signal: 'HOLD',
      strength: 0,
      reason: 'بيانات غير كافية لتحليل الحجم',
      weight: 0.8,
    };
  }
  
  const lastVolume = volumes[volumes.length - 1];
  const avgVolume = volumes.slice(-20, -1).reduce((a, b) => a + b, 0) / 19;
  const ratio = lastVolume / avgVolume;
  
  let signal: SignalType = 'HOLD';
  let strength = 50;
  let reason = '';
  
  if (ratio > 2) {
    signal = 'STRONG_BUY'; // High volume can precede big moves
    strength = 80;
    reason = `حجم تداول استثنائي (${ratio.toFixed(1)}x المتوسط)`;
  } else if (ratio > 1.5) {
    strength = 65;
    reason = `حجم تداول عالي (${ratio.toFixed(1)}x المتوسط)`;
  } else if (ratio < 0.5) {
    strength = 40;
    reason = `حجم تداول منخفض (${ratio.toFixed(1)}x المتوسط)`;
  } else {
    reason = `حجم تداول طبيعي (${ratio.toFixed(1)}x المتوسط)`;
  }
  
  return {
    indicator: 'VOLUME',
    signal,
    strength,
    reason,
    weight: 0.8,
  };
}

/**
 * Analyze Trend Strength
 */
function analyzeTrendStrength(candles: Candle[], config: StrategyConfig): SignalConfirmation {
  const trendAnalysis = analyzeTrend(candles);
  
  let signal: SignalType = 'HOLD';
  let strength = 50;
  let reason = '';
  
  if (trendAnalysis.direction === 'BULLISH' && trendAnalysis.isStrong) {
    signal = 'STRONG_BUY';
    strength = trendAnalysis.strength;
    reason = `اتجاه صعودي قوي (ADX: ${trendAnalysis.adx.toFixed(1)})`;
  } else if (trendAnalysis.direction === 'BULLISH') {
    signal = 'BUY';
    strength = trendAnalysis.strength;
    reason = `اتجاه صعودي (ADX: ${trendAnalysis.adx.toFixed(1)})`;
  } else if (trendAnalysis.direction === 'BEARISH' && trendAnalysis.isStrong) {
    signal = 'STRONG_SELL';
    strength = trendAnalysis.strength;
    reason = `اتجاه هبوطي قوي (ADX: ${trendAnalysis.adx.toFixed(1)})`;
  } else if (trendAnalysis.direction === 'BEARISH') {
    signal = 'SELL';
    strength = trendAnalysis.strength;
    reason = `اتجاه هبوطي (ADX: ${trendAnalysis.adx.toFixed(1)})`;
  } else {
    reason = `سوق جانبي (ADX: ${trendAnalysis.adx.toFixed(1)})`;
    strength = 30;
  }
  
  return {
    indicator: 'TREND',
    signal,
    strength,
    reason,
    weight: 1.6,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN SIGNAL GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate comprehensive trading signal
 */
export async function generateTradingSignal(
  symbol: string,
  config: StrategyConfig = DEFAULT_CONFIG
): Promise<TradingSignal | null> {
  // Get historical data
  const historicalData = await getHistoricalData(symbol, '1h', '1mo');
  
  if (!historicalData || historicalData.candles.length < 50) {
    console.error(`❌ بيانات غير كافية لتحليل ${symbol}`);
    return null;
  }
  
  const candles = historicalData.candles;
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  
  // Get current price
  const currentPrice = await getRealTimePrice(symbol);
  const price = currentPrice?.price || closes[closes.length - 1];
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // Run all indicator analyses
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const confirmations: SignalConfirmation[] = [
    analyzeRSISignal(closes, config),
    analyzeMACDSignal(closes, config),
    analyzeEMAAlignment(closes, config),
    analyzeBollingerBandsSignal(closes, config),
    analyzeVolume(volumes, config),
    analyzeTrendStrength(candles, config),
  ];
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // Calculate weighted signal
  // ═══════════════════════════════════════════════════════════════════════════════
  
  let totalWeight = 0;
  let buyScore = 0;
  let sellScore = 0;
  const warnings: string[] = [];
  
  for (const conf of confirmations) {
    totalWeight += conf.weight;
    
    if (conf.signal === 'STRONG_BUY') {
      buyScore += conf.strength * conf.weight * 1.2;
    } else if (conf.signal === 'BUY') {
      buyScore += conf.strength * conf.weight;
    } else if (conf.signal === 'STRONG_SELL') {
      sellScore += conf.strength * conf.weight * 1.2;
    } else if (conf.signal === 'SELL') {
      sellScore += conf.strength * conf.weight;
    }
    
    // Check for warnings
    if (conf.reason.includes('⚠️') || conf.strength < 30) {
      warnings.push(conf.reason);
    }
  }
  
  // Normalize scores
  const normalizedBuyScore = (buyScore / totalWeight) / 100;
  const normalizedSellScore = (sellScore / totalWeight) / 100;
  
  // Determine final signal
  let signal: SignalType;
  let confidence: number;
  let direction: 'CALL' | 'PUT' | 'NEUTRAL';
  
  const buyCount = confirmations.filter(c => c.signal === 'BUY' || c.signal === 'STRONG_BUY').length;
  const sellCount = confirmations.filter(c => c.signal === 'SELL' || c.signal === 'STRONG_SELL').length;
  
  if (normalizedBuyScore > 0.7 && buyCount >= config.minConfirmations) {
    signal = 'STRONG_BUY';
    direction = 'CALL';
    confidence = Math.min(95, normalizedBuyScore * 100);
  } else if (normalizedBuyScore > 0.5 && buyCount >= config.minConfirmations) {
    signal = 'BUY';
    direction = 'CALL';
    confidence = normalizedBuyScore * 100;
  } else if (normalizedSellScore > 0.7 && sellCount >= config.minConfirmations) {
    signal = 'STRONG_SELL';
    direction = 'PUT';
    confidence = Math.min(95, normalizedSellScore * 100);
  } else if (normalizedSellScore > 0.5 && sellCount >= config.minConfirmations) {
    signal = 'SELL';
    direction = 'PUT';
    confidence = normalizedSellScore * 100;
  } else {
    signal = 'HOLD';
    direction = 'NEUTRAL';
    confidence = 30;
    warnings.push('لا توجد إشارات قوية كافية');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // Calculate risk management levels
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const atr = calculateATR(candles, 14);
  const suggestedEntry = price;
  const suggestedStopLoss = direction === 'CALL' 
    ? price - (atr * 2) 
    : price + (atr * 2);
  const suggestedTakeProfit = direction === 'CALL'
    ? price + (atr * 4)
    : price - (atr * 4);
  const riskRewardRatio = Math.abs(suggestedTakeProfit - price) / Math.abs(price - suggestedStopLoss);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // Build final signal
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const emaShort = calculateEMAArray(closes, config.emaShort);
  const emaMedium = calculateEMAArray(closes, config.emaMedium);
  const emaLong = calculateEMAArray(closes, config.emaLong);
  const macd = calculateMACD(closes, config.macdFast, config.macdSlow, config.macdSignal);
  const bb = calculateBollingerBands(closes, config.bbPeriod, config.bbStdDev);
  const trendAnalysis = analyzeTrend(candles);
  
  return {
    symbol,
    signal,
    direction,
    confidence: Math.round(confidence),
    price,
    
    confirmations,
    confirmationCount: buyCount + sellCount,
    
    rsi: calculateRSI(closes, config.rsiPeriod),
    macd: macd ? { macd: macd.macd, signal: macd.signal, histogram: macd.histogram } : { macd: 0, signal: 0, histogram: 0 },
    ema: {
      short: emaShort[emaShort.length - 1] || 0,
      medium: emaMedium[emaMedium.length - 1] || 0,
      long: emaLong[emaLong.length - 1] || 0,
    },
    bollingerBands: bb,
    atr,
    
    trend: trendAnalysis.direction,
    trendStrength: trendAnalysis.strength,
    adx: trendAnalysis.adx,
    
    suggestedEntry,
    suggestedStopLoss,
    suggestedTakeProfit,
    riskRewardRatio,
    
    timestamp: new Date(),
    source: historicalData.source,
    isReal: currentPrice?.isReal ?? false,
    warnings,
  };
}

/**
 * Quick analysis for single symbol
 */
export async function quickAnalysis(symbol: string): Promise<{
  signal: SignalType;
  confidence: number;
  direction: 'CALL' | 'PUT' | 'NEUTRAL';
  reasons: string[];
}> {
  const fullSignal = await generateTradingSignal(symbol);
  
  if (!fullSignal) {
    return {
      signal: 'HOLD',
      confidence: 0,
      direction: 'NEUTRAL',
      reasons: ['لا توجد بيانات كافية'],
    };
  }
  
  const reasons = fullSignal.confirmations
    .filter(c => c.signal !== 'HOLD')
    .map(c => c.reason);
  
  return {
    signal: fullSignal.signal,
    confidence: fullSignal.confidence,
    direction: fullSignal.direction,
    reasons,
  };
}

export default {
  generateTradingSignal,
  quickAnalysis,
  DEFAULT_CONFIG,
};
