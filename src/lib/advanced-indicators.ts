/**
 * Advanced Technical Indicators Engine
 * محرك المؤشرات الفنية المتقدم
 * 
 * Includes: RSI, MACD, EMA, Bollinger Bands, ADX, ATR
 * With signal generation and trend analysis
 */

// Types
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp?: number;
}

export interface IndicatorResult {
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 0-100
  confidence: number; // 0-100
}

export interface RSIResult extends IndicatorResult {
  overbought: boolean;
  oversold: boolean;
  divergence?: 'BULLISH' | 'BEARISH' | null;
}

export interface MACDResult extends IndicatorResult {
  macd: number;
  signal: number;
  histogram: number;
  crossover: 'BULLISH' | 'BEARISH' | null;
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
  squeeze: boolean;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
}

export interface ADXResult {
  adx: number;
  plusDI: number;
  minusDI: number;
  trend: 'STRONG_UP' | 'STRONG_DOWN' | 'WEAK' | 'RANGING';
  strength: number;
}

export interface EMAAlignment {
  short: number;
  medium: number;
  long: number;
  alignment: 'BULLISH' | 'BEARISH' | 'MIXED';
  strength: number;
}

export interface ExplosionSignal {
  detected: boolean;
  type: 'VOLUME_SPIKE' | 'BOLLINGER_BREAK' | 'MOMENTUM_SURGE' | null;
  direction: 'UP' | 'DOWN' | null;
  strength: number;
  confidence: number;
  reasons: string[];
}

export interface TrendAnalysis {
  direction: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  strength: number;
  confidence: number;
  reversalProbability: number;
  support: number;
  resistance: number;
}

export interface ReversalSignal {
  detected: boolean;
  type: 'RSI_DIVERGENCE' | 'VOLUME_DIVERGENCE' | 'PRICE_REJECTION' | null;
  direction: 'BULLISH_REVERSAL' | 'BEARISH_REVERSAL' | null;
  confidence: number;
  reasons: string[];
}

export interface InstitutionalActivity {
  detected: boolean;
  type: 'BLOCK_TRADE' | 'UNUSUAL_VOLUME' | 'ACCUMULATION' | 'DISTRIBUTION' | null;
  direction: 'BUYING' | 'SELLING' | null;
  confidence: number;
  volumeRatio: number;
}

export interface SupplyDemandZone {
  type: 'SUPPLY' | 'DEMAND';
  priceStart: number;
  priceEnd: number;
  strength: number;
  tests: number;
  lastTouch: number;
}

export interface TradingSignal {
  direction: 'CALL' | 'PUT' | null;
  confidence: number;
  mode: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  reasons: string[];
  warnings: string[];
  indicators: {
    rsi: RSIResult | null;
    macd: MACDResult | null;
    bollinger: BollingerResult | null;
    adx: ADXResult | null;
    ema: EMAAlignment | null;
  };
  explosion: ExplosionSignal | null;
  reversal: ReversalSignal | null;
  institutional: InstitutionalActivity | null;
  zones: SupplyDemandZone[];
}

// ==================== INDICATOR CALCULATIONS ====================

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(candles: Candle[], period: number = 14): RSIResult | null {
  if (candles.length < period + 1) return null;

  const closes = candles.map(c => c.close);
  const changes: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;

  // Smoothed RSI
  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
    }
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  // Determine signal
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 50;

  if (rsi < 30) {
    signal = 'BUY';
    strength = 100 - rsi; // Lower RSI = stronger buy
  } else if (rsi > 70) {
    signal = 'SELL';
    strength = rsi - 70; // Higher RSI = stronger sell
  }

  // Detect divergence
  const divergence = detectRSIDivergence(candles, rsi);

  return {
    value: rsi,
    signal,
    strength: Math.min(100, Math.max(0, strength)),
    confidence: rsi < 20 || rsi > 80 ? 85 : rsi < 30 || rsi > 70 ? 70 : 50,
    overbought: rsi > 70,
    oversold: rsi < 30,
    divergence
  };
}

/**
 * Detect RSI Divergence
 */
function detectRSIDivergence(candles: Candle[], currentRSI: number): 'BULLISH' | 'BEARISH' | null {
  if (candles.length < 10) return null;

  const recentCandles = candles.slice(-10);
  const closes = recentCandles.map(c => c.close);
  
  // Find price lows and RSI lows
  let priceLows: number[] = [];
  let rsiLows: number[] = [];
  let priceHighs: number[] = [];
  let rsiHighs: number[] = [];

  // Simple divergence detection
  const midIndex = Math.floor(closes.length / 2);
  const firstHalf = closes.slice(0, midIndex);
  const secondHalf = closes.slice(midIndex);

  const firstLow = Math.min(...firstHalf);
  const secondLow = Math.min(...secondHalf);
  const firstHigh = Math.max(...firstHalf);
  const secondHigh = Math.max(...secondHalf);

  // Bullish divergence: price makes lower low, RSI makes higher low
  if (secondLow < firstLow && currentRSI > 30) {
    return 'BULLISH';
  }

  // Bearish divergence: price makes higher high, RSI makes lower high
  if (secondHigh > firstHigh && currentRSI < 70) {
    return 'BEARISH';
  }

  return null;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult | null {
  if (candles.length < slowPeriod + signalPeriod) return null;

  const closes = candles.map(c => c.close);
  
  // Calculate EMAs
  const fastEMA = calculateEMAArray(closes, fastPeriod);
  const slowEMA = calculateEMAArray(closes, slowPeriod);

  if (!fastEMA || !slowEMA) return null;

  // Calculate MACD line
  const macdLine: number[] = [];
  const minLength = Math.min(fastEMA.length, slowEMA.length);
  
  for (let i = 0; i < minLength; i++) {
    macdLine.push(fastEMA[fastEMA.length - minLength + i] - slowEMA[slowEMA.length - minLength + i]);
  }

  // Calculate Signal line
  const signalLine = calculateEMAArray(macdLine, signalPeriod);
  if (!signalLine) return null;

  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  const histogram = macd - signal;

  // Determine crossover
  let crossover: 'BULLISH' | 'BEARISH' | null = null;
  if (macdLine.length >= 2 && signalLine.length >= 2) {
    const prevMacd = macdLine[macdLine.length - 2];
    const prevSignal = signalLine[signalLine.length - 2];
    
    if (prevMacd <= prevSignal && macd > signal) {
      crossover = 'BULLISH';
    } else if (prevMacd >= prevSignal && macd < signal) {
      crossover = 'BEARISH';
    }
  }

  // Determine signal
  let tradeSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 50;

  if (crossover === 'BULLISH') {
    tradeSignal = 'BUY';
    strength = 80;
  } else if (crossover === 'BEARISH') {
    tradeSignal = 'SELL';
    strength = 80;
  } else if (histogram > 0 && macd > 0) {
    tradeSignal = 'BUY';
    strength = 60;
  } else if (histogram < 0 && macd < 0) {
    tradeSignal = 'SELL';
    strength = 60;
  }

  return {
    value: macd,
    signal: tradeSignal,
    strength,
    confidence: crossover ? 85 : 65,
    macd,
    signal,
    histogram,
    crossover
  };
}

/**
 * Calculate EMA Array
 */
function calculateEMAArray(data: number[], period: number): number[] | null {
  if (data.length < period) return null;

  const multiplier = 2 / (period + 1);
  const ema: number[] = [];

  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);

  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    const newEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(newEMA);
  }

  return ema;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDev: number = 2
): BollingerResult | null {
  if (candles.length < period) return null;

  const closes = candles.slice(-period).map(c => c.close);
  
  // Calculate SMA
  const sma = closes.reduce((a, b) => a + b, 0) / period;
  
  // Calculate Standard Deviation
  const squaredDiffs = closes.map(c => Math.pow(c - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);

  const upper = sma + (stdDev * std);
  const lower = sma - (stdDev * std);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate bandwidth (volatility indicator)
  const bandwidth = ((upper - lower) / sma) * 100;
  
  // Calculate %B (position within bands)
  const percentB = (currentPrice - lower) / (upper - lower);

  // Detect squeeze (low volatility before explosion)
  const historicalBandwidth = candles.length >= period * 2
    ? calculateHistoricalBandwidth(candles.slice(0, -period), period)
    : bandwidth;
  
  const squeeze = bandwidth < historicalBandwidth * 0.5;

  // Determine signal
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 50;

  if (currentPrice <= lower) {
    signal = 'BUY';
    strength = 80;
  } else if (currentPrice >= upper) {
    signal = 'SELL';
    strength = 80;
  } else if (percentB < 0.2) {
    signal = 'BUY';
    strength = 60;
  } else if (percentB > 0.8) {
    signal = 'SELL';
    strength = 60;
  }

  return {
    upper,
    middle: sma,
    lower,
    bandwidth,
    percentB,
    squeeze,
    signal,
    strength
  };
}

/**
 * Calculate Historical Bandwidth
 */
function calculateHistoricalBandwidth(candles: Candle[], period: number): number {
  if (candles.length < period) return 0;

  const closes = candles.slice(-period).map(c => c.close);
  const sma = closes.reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = closes.map(c => Math.pow(c - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);
  
  return ((sma + 2 * std - (sma - 2 * std)) / sma) * 100;
}

/**
 * Calculate ADX (Average Directional Index)
 */
export function calculateADX(candles: Candle[], period: number = 14): ADXResult | null {
  if (candles.length < period * 2) return null;

  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const close = candles[i - 1].close;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;

    // True Range
    const tr = Math.max(
      high - low,
      Math.abs(high - close),
      Math.abs(low - close)
    );
    trueRanges.push(tr);

    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;

    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }

  // Smooth the values
  const smoothTR = smoothArray(trueRanges, period);
  const smoothPlusDM = smoothArray(plusDMs, period);
  const smoothMinusDM = smoothArray(minusDMs, period);

  if (!smoothTR || !smoothPlusDM || !smoothMinusDM) return null;

  // Calculate DI
  const plusDI = (smoothPlusDM / smoothTR) * 100;
  const minusDI = (smoothMinusDM / smoothTR) * 100;

  // Calculate DX
  const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;

  // Calculate ADX (smoothed DX)
  const adx = dx; // Simplified - in production would smooth this further

  // Determine trend
  let trend: 'STRONG_UP' | 'STRONG_DOWN' | 'WEAK' | 'RANGING';
  let strength: number;

  if (adx > 25) {
    if (plusDI > minusDI) {
      trend = 'STRONG_UP';
      strength = Math.min(100, adx + 20);
    } else {
      trend = 'STRONG_DOWN';
      strength = Math.min(100, adx + 20);
    }
  } else if (adx > 20) {
    trend = 'WEAK';
    strength = 50;
  } else {
    trend = 'RANGING';
    strength = 30;
  }

  return {
    adx,
    plusDI,
    minusDI,
    trend,
    strength
  };
}

/**
 * Smooth array using Wilder's smoothing
 */
function smoothArray(data: number[], period: number): number | null {
  if (data.length < period) return null;

  let smoothed = data.slice(0, period).reduce((a, b) => a + b, 0);
  
  for (let i = period; i < data.length; i++) {
    smoothed = smoothed - (smoothed / period) + data[i];
  }

  return smoothed;
}

/**
 * Calculate EMA Alignment (Trend Direction)
 */
export function calculateEMAAlignment(
  candles: Candle[],
  shortPeriod: number = 9,
  mediumPeriod: number = 21,
  longPeriod: number = 50
): EMAAlignment | null {
  if (candles.length < longPeriod) return null;

  const closes = candles.map(c => c.close);
  
  const shortEMA = calculateEMAArray(closes, shortPeriod);
  const mediumEMA = calculateEMAArray(closes, mediumPeriod);
  const longEMA = calculateEMAArray(closes, longPeriod);

  if (!shortEMA || !mediumEMA || !longEMA) return null;

  const short = shortEMA[shortEMA.length - 1];
  const medium = mediumEMA[mediumEMA.length - 1];
  const long = longEMA[longEMA.length - 1];

  let alignment: 'BULLISH' | 'BEARISH' | 'MIXED';
  let strength: number;

  if (short > medium && medium > long) {
    alignment = 'BULLISH';
    strength = 85;
  } else if (short < medium && medium < long) {
    alignment = 'BEARISH';
    strength = 85;
  } else {
    alignment = 'MIXED';
    strength = 40;
  }

  return {
    short,
    medium,
    long,
    alignment,
    strength
  };
}

/**
 * Calculate ATR (Average True Range) - for volatility measurement
 */
export function calculateATR(candles: Candle[], period: number = 14): number | null {
  if (candles.length < period + 1) return null;

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate ATR
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((a, b) => a + b, 0) / period;
}

// ==================== SIGNAL GENERATION ====================

/**
 * Detect Price Explosion
 */
export function detectExplosion(
  candles: Candle[],
  volumeThreshold: number = 2.0,
  volatilityThreshold: number = 1.5
): ExplosionSignal {
  if (candles.length < 20) {
    return {
      detected: false,
      type: null,
      direction: null,
      strength: 0,
      confidence: 0,
      reasons: []
    };
  }

  const reasons: string[] = [];
  let detected = false;
  let type: ExplosionSignal['type'] = null;
  let direction: ExplosionSignal['direction'] = null;
  let strength = 0;
  let confidence = 0;

  // Volume Spike Detection
  const volumes = candles.slice(-20).map(c => c.volume);
  const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
  const currentVolume = volumes[volumes.length - 1];
  const volumeRatio = currentVolume / avgVolume;

  if (volumeRatio >= volumeThreshold) {
    detected = true;
    type = 'VOLUME_SPIKE';
    reasons.push(`Volume spike: ${volumeRatio.toFixed(1)}x average`);
    strength += 30;
    confidence += 20;
  }

  // Bollinger Squeeze Breakout
  const bollinger = calculateBollingerBands(candles);
  if (bollinger?.squeeze) {
    const lastCandle = candles[candles.length - 1];
    if (lastCandle.close > bollinger.upper) {
      detected = true;
      type = 'BOLLINGER_BREAK';
      direction = 'UP';
      reasons.push('Bollinger squeeze breakout (UP)');
      strength += 40;
      confidence += 30;
    } else if (lastCandle.close < bollinger.lower) {
      detected = true;
      type = 'BOLLINGER_BREAK';
      direction = 'DOWN';
      reasons.push('Bollinger squeeze breakout (DOWN)');
      strength += 40;
      confidence += 30;
    }
  }

  // Momentum Surge (large price movement)
  const closes = candles.slice(-5).map(c => c.close);
  const priceChange = Math.abs(closes[closes.length - 1] - closes[0]) / closes[0] * 100;
  
  if (priceChange > 1) { // More than 1% in 5 candles
    detected = true;
    type = 'MOMENTUM_SURGE';
    direction = closes[closes.length - 1] > closes[0] ? 'UP' : 'DOWN';
    reasons.push(`Momentum surge: ${priceChange.toFixed(2)}% move`);
    strength += 35;
    confidence += 25;
  }

  // Determine direction if not set
  if (detected && !direction) {
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    direction = lastCandle.close > prevCandle.close ? 'UP' : 'DOWN';
  }

  return {
    detected,
    type,
    direction,
    strength: Math.min(100, strength),
    confidence: Math.min(100, confidence),
    reasons
  };
}

/**
 * Detect Reversal Signals
 */
export function detectReversal(candles: Candle[]): ReversalSignal {
  if (candles.length < 14) {
    return {
      detected: false,
      type: null,
      direction: null,
      confidence: 0,
      reasons: []
    };
  }

  const reasons: string[] = [];
  let detected = false;
  let type: ReversalSignal['type'] = null;
  let direction: ReversalSignal['direction'] = null;
  let confidence = 0;

  // RSI Divergence
  const rsi = calculateRSI(candles);
  if (rsi?.divergence) {
    detected = true;
    type = 'RSI_DIVERGENCE';
    direction = rsi.divergence === 'BULLISH' ? 'BULLISH_REVERSAL' : 'BEARISH_REVERSAL';
    reasons.push(`RSI ${rsi.divergence} divergence detected`);
    confidence += 40;
  }

  // Volume Divergence
  const recentCandles = candles.slice(-10);
  const priceTrend = recentCandles[recentCandles.length - 1].close - recentCandles[0].close;
  const volumeTrend = recentCandles[recentCandles.length - 1].volume - recentCandles[0].volume;

  if ((priceTrend > 0 && volumeTrend < 0) || (priceTrend < 0 && volumeTrend > 0)) {
    if (!detected) {
      detected = true;
      type = 'VOLUME_DIVERGENCE';
    }
    direction = priceTrend > 0 ? 'BEARISH_REVERSAL' : 'BULLISH_REVERSAL';
    reasons.push('Price-Volume divergence');
    confidence += 30;
  }

  // Price Rejection (long wicks)
  const lastCandle = candles[candles.length - 1];
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
  const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;

  if (upperWick > bodySize * 2 && lastCandle.close < lastCandle.open) {
    detected = true;
    type = 'PRICE_REJECTION';
    direction = 'BEARISH_REVERSAL';
    reasons.push('Strong upper rejection (selling pressure)');
    confidence += 35;
  } else if (lowerWick > bodySize * 2 && lastCandle.close > lastCandle.open) {
    detected = true;
    type = 'PRICE_REJECTION';
    direction = 'BULLISH_REVERSAL';
    reasons.push('Strong lower rejection (buying pressure)');
    confidence += 35;
  }

  return {
    detected,
    type,
    direction,
    confidence: Math.min(100, confidence),
    reasons
  };
}

/**
 * Detect Institutional Activity
 */
export function detectInstitutionalActivity(
  candles: Candle[],
  volumeThreshold: number = 3.0
): InstitutionalActivity {
  if (candles.length < 20) {
    return {
      detected: false,
      type: null,
      direction: null,
      confidence: 0,
      volumeRatio: 0
    };
  }

  let detected = false;
  let type: InstitutionalActivity['type'] = null;
  let direction: InstitutionalActivity['direction'] = null;
  let confidence = 0;

  // Volume Analysis
  const volumes = candles.slice(-20).map(c => c.volume);
  const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
  const currentVolume = volumes[volumes.length - 1];
  const volumeRatio = currentVolume / avgVolume;

  if (volumeRatio >= volumeThreshold) {
    detected = true;
    type = 'UNUSUAL_VOLUME';
    confidence += 40;

    // Determine direction based on price
    const lastCandle = candles[candles.length - 1];
    direction = lastCandle.close > lastCandle.open ? 'BUYING' : 'SELLING';

    // Check for block trade characteristics
    if (volumeRatio >= 5.0) {
      type = 'BLOCK_TRADE';
      confidence += 30;
    }
  }

  // Accumulation/Distribution detection
  const closes = candles.slice(-10).map(c => c.close);
  const volumes10 = candles.slice(-10).map(c => c.volume);
  
  let adLine = 0;
  for (let i = 0; i < closes.length - 1; i++) {
    const high = candles[candles.length - 10 + i].high;
    const low = candles[candles.length - 10 + i].low;
    const close = closes[i];
    const volume = volumes10[i];

    if (high !== low) {
      adLine += ((close - low) - (high - close)) / (high - low) * volume;
    }
  }

  const priceChange = (closes[closes.length - 1] - closes[0]) / closes[0];
  const adTrend = adLine > 0;

  if (priceChange > 0 && adTrend) {
    if (!detected) {
      detected = true;
      type = 'ACCUMULATION';
      direction = 'BUYING';
    }
    confidence += 25;
  } else if (priceChange < 0 && !adTrend) {
    if (!detected) {
      detected = true;
      type = 'DISTRIBUTION';
      direction = 'SELLING';
    }
    confidence += 25;
  }

  return {
    detected,
    type,
    direction,
    confidence: Math.min(100, confidence),
    volumeRatio
  };
}

/**
 * Identify Supply/Demand Zones
 */
export function identifySupplyDemandZones(candles: Candle[]): SupplyDemandZone[] {
  if (candles.length < 20) return [];

  const zones: SupplyDemandZone[] = [];
  
  // Look for consolidation zones followed by strong moves
  for (let i = 5; i < candles.length - 5; i++) {
    const baseCandles = candles.slice(i - 5, i);
    const futureCandles = candles.slice(i, i + 5);

    // Calculate base range
    const baseHigh = Math.max(...baseCandles.map(c => c.high));
    const baseLow = Math.min(...baseCandles.map(c => c.low));
    const baseRange = baseHigh - baseLow;

    // Check for strong move after base
    const futureHigh = Math.max(...futureCandles.map(c => c.high));
    const futureLow = Math.min(...futureCandles.map(c => c.low));

    // Demand zone: consolidation followed by upward move
    if (futureHigh > baseHigh + baseRange * 2) {
      zones.push({
        type: 'DEMAND',
        priceStart: baseLow,
        priceEnd: baseHigh,
        strength: 60,
        tests: 0,
        lastTouch: candles[i].timestamp || i
      });
    }

    // Supply zone: consolidation followed by downward move
    if (futureLow < baseLow - baseRange * 2) {
      zones.push({
        type: 'SUPPLY',
        priceStart: baseLow,
        priceEnd: baseHigh,
        strength: 60,
        tests: 0,
        lastTouch: candles[i].timestamp || i
      });
    }
  }

  // Filter and merge overlapping zones
  const filteredZones: SupplyDemandZone[] = [];
  const sortedZones = zones.sort((a, b) => b.strength - a.strength);

  for (const zone of sortedZones) {
    const overlapping = filteredZones.find(z => 
      Math.abs(z.priceStart - zone.priceStart) < (zone.priceEnd - zone.priceStart) * 0.5 &&
      z.type === zone.type
    );

    if (!overlapping) {
      filteredZones.push(zone);
    }
  }

  return filteredZones.slice(0, 5); // Return top 5 zones
}

/**
 * Analyze Trend
 */
export function analyzeTrend(candles: Candle[]): TrendAnalysis {
  if (candles.length < 50) {
    return {
      direction: 'SIDEWAYS',
      strength: 0,
      confidence: 0,
      reversalProbability: 0,
      support: 0,
      resistance: 0
    };
  }

  // Use EMA alignment for trend direction
  const emaAlignment = calculateEMAAlignment(candles);
  const adx = calculateADX(candles);

  let direction: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
  let strength = 0;
  let confidence = 50;

  if (emaAlignment) {
    if (emaAlignment.alignment === 'BULLISH') {
      direction = 'BULLISH';
      strength = emaAlignment.strength;
    } else if (emaAlignment.alignment === 'BEARISH') {
      direction = 'BEARISH';
      strength = emaAlignment.strength;
    }
  }

  if (adx) {
    strength = Math.max(strength, adx.strength);
    if (adx.trend === 'RANGING') {
      direction = 'SIDEWAYS';
    }
  }

  // Calculate support and resistance
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // Simple pivot-based S/R
  const support = Math.min(...lows.slice(-20));
  const resistance = Math.max(...highs.slice(-20));

  // Calculate reversal probability based on RSI and price position
  const rsi = calculateRSI(candles);
  let reversalProbability = 0;

  if (rsi) {
    if (direction === 'BULLISH' && rsi.value > 70) {
      reversalProbability = 60 + (rsi.value - 70) * 2;
    } else if (direction === 'BEARISH' && rsi.value < 30) {
      reversalProbability = 60 + (30 - rsi.value) * 2;
    }
  }

  confidence = Math.min(100, strength + (adx?.adx || 0));

  return {
    direction,
    strength,
    confidence,
    reversalProbability: Math.min(100, reversalProbability),
    support,
    resistance
  };
}

// ==================== MAIN SIGNAL GENERATOR ====================

/**
 * Trading Mode Configuration
 */
export const TRADING_MODES = {
  CONSERVATIVE: {
    name: 'محافظ',
    nameEn: 'Conservative',
    minConfidence: 80,
    description: 'صفقات عالية الجودة فقط - أقل عدد صفقات'
  },
  BALANCED: {
    name: 'متوازن',
    nameEn: 'Balanced',
    minConfidence: 70,
    description: 'توازن بين الجودة والعدد'
  },
  AGGRESSIVE: {
    name: 'عدواني',
    nameEn: 'Aggressive',
    minConfidence: 60,
    description: 'المزيد من الصفقات - متطلبات أقل'
  }
} as const;

export type TradingMode = keyof typeof TRADING_MODES;

/**
 * Generate Comprehensive Trading Signal
 */
export function generateTradingSignal(
  candles: Candle[],
  mode: TradingMode = 'BALANCED',
  currentPrice?: number
): TradingSignal {
  const minConfidence = TRADING_MODES[mode].minConfidence;
  const reasons: string[] = [];
  const warnings: string[] = [];

  // Calculate all indicators
  const rsi = calculateRSI(candles);
  const macd = calculateMACD(candles);
  const bollinger = calculateBollingerBands(candles);
  const adx = calculateADX(candles);
  const ema = calculateEMAAlignment(candles);

  // Detect special signals
  const explosion = detectExplosion(candles);
  const reversal = detectReversal(candles);
  const institutional = detectInstitutionalActivity(candles);
  const zones = identifySupplyDemandZones(candles);

  // Calculate overall direction confidence
  let bullishScore = 0;
  let bearishScore = 0;

  // RSI signals
  if (rsi) {
    if (rsi.signal === 'BUY') {
      bullishScore += rsi.strength * 0.8;
      if (rsi.oversold) reasons.push('RSI في منطقة التشبع البيعي');
    } else if (rsi.signal === 'SELL') {
      bearishScore += rsi.strength * 0.8;
      if (rsi.overbought) reasons.push('RSI في منطقة التشبع الشرائي');
    }
    if (rsi.divergence === 'BULLISH') {
      bullishScore += 25;
      reasons.push('تباعد صعودي في RSI');
    } else if (rsi.divergence === 'BEARISH') {
      bearishScore += 25;
      reasons.push('تباعد هبوطي في RSI');
    }
  }

  // MACD signals
  if (macd) {
    if (macd.crossover === 'BULLISH') {
      bullishScore += 35;
      reasons.push('تقاطع صعودي في MACD');
    } else if (macd.crossover === 'BEARISH') {
      bearishScore += 35;
      reasons.push('تقاطع هبوطي في MACD');
    }
    if (macd.histogram > 0) bullishScore += 15;
    if (macd.histogram < 0) bearishScore += 15;
  }

  // Bollinger signals
  if (bollinger) {
    if (bollinger.signal === 'BUY') {
      bullishScore += bollinger.strength * 0.6;
      reasons.push('السعر قرب الحد السفلي لبولينجر');
    } else if (bollinger.signal === 'SELL') {
      bearishScore += bollinger.strength * 0.6;
      reasons.push('السعر قرب الحد العلوي لبولينجر');
    }
    if (bollinger.squeeze) {
      warnings.push('ضغط في بولينجر - قد يحدث انفجار قريباً');
    }
  }

  // ADX/Trend signals
  if (adx) {
    if (adx.trend === 'STRONG_UP') {
      bullishScore += 25;
      reasons.push('اتجاه صعودي قوي (ADX)');
    } else if (adx.trend === 'STRONG_DOWN') {
      bearishScore += 25;
      reasons.push('اتجاه هبوطي قوي (ADX)');
    } else if (adx.trend === 'RANGING') {
      warnings.push('السوق في حالة تذبذب');
    }
  }

  // EMA alignment
  if (ema) {
    if (ema.alignment === 'BULLISH') {
      bullishScore += 20;
      reasons.push('EMA مصطفة صعودياً');
    } else if (ema.alignment === 'BEARISH') {
      bearishScore += 20;
      reasons.push('EMA مصطفة هبوطياً');
    }
  }

  // Explosion signals
  if (explosion.detected) {
    if (explosion.direction === 'UP') {
      bullishScore += explosion.strength * 0.9;
      reasons.push(...explosion.reasons);
    } else if (explosion.direction === 'DOWN') {
      bearishScore += explosion.strength * 0.9;
      reasons.push(...explosion.reasons);
    }
  }

  // Reversal signals
  if (reversal.detected) {
    if (reversal.direction === 'BULLISH_REVERSAL') {
      bullishScore += reversal.confidence * 0.7;
      reasons.push(...reversal.reasons);
    } else if (reversal.direction === 'BEARISH_REVERSAL') {
      bearishScore += reversal.confidence * 0.7;
      reasons.push(...reversal.reasons);
    }
  }

  // Institutional activity
  if (institutional.detected) {
    if (institutional.direction === 'BUYING') {
      bullishScore += institutional.confidence * 0.8;
      reasons.push(`نشاط مؤسسي: ${institutional.type}`);
    } else if (institutional.direction === 'SELLING') {
      bearishScore += institutional.confidence * 0.8;
      reasons.push(`نشاط مؤسسي: ${institutional.type}`);
    }
  }

  // Supply/Demand zones
  const price = currentPrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);
  if (price > 0) {
    for (const zone of zones) {
      if (zone.type === 'DEMAND' && price >= zone.priceStart && price <= zone.priceEnd) {
        bullishScore += zone.strength * 0.5;
        reasons.push('السعر في منطقة طلب');
      } else if (zone.type === 'SUPPLY' && price >= zone.priceStart && price <= zone.priceEnd) {
        bearishScore += zone.strength * 0.5;
        reasons.push('السعر في منطقة عرض');
      }
    }
  }

  // Determine final signal
  let direction: 'CALL' | 'PUT' | null = null;
  let confidence = 0;

  const totalScore = bullishScore + bearishScore;
  if (totalScore > 0) {
    if (bullishScore > bearishScore && bullishScore >= 30) {
      direction = 'CALL';
      confidence = Math.min(100, (bullishScore / (bullishScore + bearishScore)) * 100);
    } else if (bearishScore > bullishScore && bearishScore >= 30) {
      direction = 'PUT';
      confidence = Math.min(100, (bearishScore / (bullishScore + bearishScore)) * 100);
    }
  }

  // Apply mode filter
  if (confidence < minConfidence) {
    warnings.push(`الثقة ${confidence.toFixed(0)}% أقل من حد ${mode} (${minConfidence}%)`);
    // Don't clear direction, but mark as low confidence
  }

  // Add trend analysis warnings
  const trend = analyzeTrend(candles);
  if (trend.reversalProbability > 50) {
    warnings.push(`احتمالية انعكاس ${trend.reversalProbability.toFixed(0)}%`);
  }

  return {
    direction,
    confidence,
    mode,
    reasons,
    warnings,
    indicators: { rsi, macd, bollinger, adx, ema },
    explosion,
    reversal,
    institutional,
    zones
  };
}

export default {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateADX,
  calculateEMAAlignment,
  calculateATR,
  detectExplosion,
  detectReversal,
  detectInstitutionalActivity,
  identifySupplyDemandZones,
  analyzeTrend,
  generateTradingSignal,
  TRADING_MODES
};
