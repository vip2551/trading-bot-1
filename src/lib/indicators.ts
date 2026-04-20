// Technical Indicators Engine
// محرك المؤشرات الفنية الكامل

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

export interface AnalysisResult {
  rsi: IndicatorResult;
  macd: IndicatorResult;
  ema: IndicatorResult;
  bollinger: IndicatorResult;
  overall: {
    direction: 'CALL' | 'PUT' | 'NEUTRAL';
    confidence: number;
    signals: string[];
    warnings: string[];
  };
}

// ==================== RSI ====================
export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate RSI using smoothed averages
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
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

export function analyzeRSI(closes: number[], period: number = 14): IndicatorResult {
  const rsi = calculateRSI(closes, period);
  
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 50;
  let confidence = 50;

  if (rsi < 30) {
    signal = 'BUY';
    strength = Math.max(0, 30 - rsi) * 3 + 70;
    confidence = 70 + (30 - rsi);
  } else if (rsi > 70) {
    signal = 'SELL';
    strength = Math.max(0, rsi - 70) * 3 + 70;
    confidence = 70 + (rsi - 70);
  } else if (rsi < 40) {
    signal = 'BUY';
    strength = 60;
    confidence = 55;
  } else if (rsi > 60) {
    signal = 'SELL';
    strength = 60;
    confidence = 55;
  }

  return {
    value: rsi,
    signal,
    strength: Math.min(100, strength),
    confidence: Math.min(100, confidence)
  };
}

// ==================== MACD ====================
export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMAArray(closes, fastPeriod);
  const slowEMA = calculateEMAArray(closes, slowPeriod);
  
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(fastEMA[i]! - slowEMA[i]!);
    } else {
      macdLine.push(0);
    }
  }

  const signalLine = calculateEMAArray(macdLine.filter(v => v !== 0), signalPeriod);
  const lastMacd = macdLine[macdLine.length - 1] || 0;
  const lastSignal = signalLine[signalLine.length - 1] || 0;
  const histogram = lastMacd - lastSignal;

  return {
    macd: lastMacd,
    signal: lastSignal,
    histogram
  };
}

export function analyzeMACD(closes: number[]): IndicatorResult {
  const macd = calculateMACD(closes);
  const prevMacd = calculateMACD(closes.slice(0, -1));
  
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 50;
  let confidence = 50;

  // Bullish crossover
  if (macd.histogram > 0 && prevMacd.histogram <= 0) {
    signal = 'BUY';
    strength = 75;
    confidence = 70;
  }
  // Bearish crossover
  else if (macd.histogram < 0 && prevMacd.histogram >= 0) {
    signal = 'SELL';
    strength = 75;
    confidence = 70;
  }
  // Bullish momentum
  else if (macd.histogram > 0 && macd.macd > 0) {
    signal = 'BUY';
    strength = 65;
    confidence = 60;
  }
  // Bearish momentum
  else if (macd.histogram < 0 && macd.macd < 0) {
    signal = 'SELL';
    strength = 65;
    confidence = 60;
  }
  // Histogram direction
  else if (macd.histogram > prevMacd.histogram) {
    signal = 'BUY';
    strength = 55;
    confidence = 50;
  }
  else if (macd.histogram < prevMacd.histogram) {
    signal = 'SELL';
    strength = 55;
    confidence = 50;
  }

  return {
    value: macd.macd,
    signal,
    strength,
    confidence
  };
}

// ==================== EMA ====================
export function calculateEMA(price: number, previousEMA: number, period: number): number {
  const multiplier = 2 / (period + 1);
  return (price - previousEMA) * multiplier + previousEMA;
}

export function calculateEMAArray(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let ema: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First EMA is SMA
      ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(ema);
    } else {
      ema = calculateEMA(data[i], ema!, period);
      result.push(ema);
    }
  }

  return result;
}

export function analyzeEMA(closes: number[]): IndicatorResult {
  const ema9 = calculateEMAArray(closes, 9);
  const ema21 = calculateEMAArray(closes, 21);
  const ema50 = calculateEMAArray(closes, 50);

  const lastEma9 = ema9[ema9.length - 1];
  const lastEma21 = ema21[ema21.length - 1];
  const lastEma50 = ema50[ema50.length - 1];
  const lastPrice = closes[closes.length - 1];

  if (!lastEma9 || !lastEma21 || !lastEma50) {
    return { value: lastPrice, signal: 'NEUTRAL', strength: 50, confidence: 30 };
  }

  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 50;
  let confidence = 50;

  // Strong bullish alignment
  if (lastPrice > lastEma9 && lastEma9 > lastEma21 && lastEma21 > lastEma50) {
    signal = 'BUY';
    strength = 85;
    confidence = 80;
  }
  // Strong bearish alignment
  else if (lastPrice < lastEma9 && lastEma9 < lastEma21 && lastEma21 < lastEma50) {
    signal = 'SELL';
    strength = 85;
    confidence = 80;
  }
  // Price above EMA 21
  else if (lastPrice > lastEma21) {
    signal = 'BUY';
    strength = 65;
    confidence = 55;
  }
  // Price below EMA 21
  else if (lastPrice < lastEma21) {
    signal = 'SELL';
    strength = 65;
    confidence = 55;
  }

  return {
    value: lastEma21,
    signal,
    strength,
    confidence
  };
}

// ==================== Bollinger Bands ====================
export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  width: number;
  percentB: number;
}

export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerBands {
  if (closes.length < period) {
    const avg = closes.reduce((a, b) => a + b, 0) / closes.length;
    return { upper: avg, middle: avg, lower: avg, width: 0, percentB: 0.5 };
  }

  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = slice.map(v => Math.pow(v - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);

  const upper = middle + stdDev * std;
  const lower = middle - stdDev * std;
  const width = (upper - lower) / middle * 100;
  
  const lastPrice = closes[closes.length - 1];
  const percentB = (lastPrice - lower) / (upper - lower);

  return { upper, middle, lower, width, percentB };
}

export function analyzeBollingerBands(closes: number[], period: number = 20): IndicatorResult {
  const bb = calculateBollingerBands(closes, period);
  const prevBB = calculateBollingerBands(closes.slice(0, -1), period);
  const lastPrice = closes[closes.length - 1];

  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 50;
  let confidence = 50;

  // Squeeze detection (low width = potential explosion)
  const squeezeThreshold = 2;
  
  // Price touches lower band (oversold)
  if (lastPrice <= bb.lower) {
    signal = 'BUY';
    strength = 70;
    confidence = 65;
  }
  // Price touches upper band (overbought)
  else if (lastPrice >= bb.upper) {
    signal = 'SELL';
    strength = 70;
    confidence = 65;
  }
  // Price near middle with squeeze
  else if (bb.width < squeezeThreshold) {
    signal = 'NEUTRAL';
    strength = 40;
    confidence = 30;
  }
  // Price above middle
  else if (bb.percentB > 0.5) {
    signal = 'BUY';
    strength = 55;
    confidence = 50;
  }
  // Price below middle
  else if (bb.percentB < 0.5) {
    signal = 'SELL';
    strength = 55;
    confidence = 50;
  }

  return {
    value: bb.percentB,
    signal,
    strength,
    confidence
  };
}

// ==================== ADX (Trend Strength) ====================
export function calculateADX(candles: Candle[], period: number = 14): number {
  if (candles.length < period * 2) return 0;

  const trValues: number[] = [];
  const plusDMValues: number[] = [];
  const minusDMValues: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;

    // True Range
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trValues.push(tr);

    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;

    plusDMValues.push(plusDM);
    minusDMValues.push(minusDM);
  }

  // Smoothed values
  const smoothedTR = smoothArray(trValues, period);
  const smoothedPlusDM = smoothArray(plusDMValues, period);
  const smoothedMinusDM = smoothArray(minusDMValues, period);

  // Directional Index
  const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
  const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

  // DX and ADX
  const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
  
  return isNaN(dx) ? 0 : dx;
}

function smoothArray(values: number[], period: number): number {
  if (values.length < period) return 0;
  
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0);
}

// ==================== Volume Analysis ====================
export function analyzeVolume(volumes: number[]): { 
  ratio: number; 
  isUnusual: boolean; 
  signal: 'HIGH' | 'LOW' | 'NORMAL';
} {
  if (volumes.length < 20) {
    return { ratio: 1, isUnusual: false, signal: 'NORMAL' };
  }

  const lastVolume = volumes[volumes.length - 1];
  const avgVolume = volumes.slice(-20, -1).reduce((a, b) => a + b, 0) / 19;
  const ratio = lastVolume / avgVolume;

  return {
    ratio,
    isUnusual: ratio > 2,
    signal: ratio > 2 ? 'HIGH' : ratio < 0.5 ? 'LOW' : 'NORMAL'
  };
}

// ==================== Divergence Detection ====================
export interface DivergenceResult {
  detected: boolean;
  type: 'BULLISH' | 'BEARISH' | null;
  strength: number;
}

export function detectDivergence(
  prices: number[],
  indicator: number[],
  lookback: number = 5
): DivergenceResult {
  if (prices.length < lookback || indicator.length < lookback) {
    return { detected: false, type: null, strength: 0 };
  }

  const priceSlice = prices.slice(-lookback);
  const indicatorSlice = indicator.slice(-lookback);

  // Find price lows and indicator lows
  const priceLow = Math.min(...priceSlice);
  const priceHigh = Math.max(...priceSlice);
  const indicatorLow = Math.min(...indicatorSlice);
  const indicatorHigh = Math.max(...indicatorSlice);

  const currentPrice = prices[prices.length - 1];
  const currentIndicator = indicator[indicator.length - 1];

  // Bullish divergence: price makes lower low, indicator makes higher low
  if (currentPrice <= priceLow * 1.01 && currentIndicator > indicatorLow * 1.05) {
    return {
      detected: true,
      type: 'BULLISH',
      strength: 70 + ((currentIndicator / indicatorLow - 1) * 100)
    };
  }

  // Bearish divergence: price makes higher high, indicator makes lower high
  if (currentPrice >= priceHigh * 0.99 && currentIndicator < indicatorHigh * 0.95) {
    return {
      detected: true,
      type: 'BEARISH',
      strength: 70 + ((1 - currentIndicator / indicatorHigh) * 100)
    };
  }

  return { detected: false, type: null, strength: 0 };
}

// ==================== Supply & Demand Zones ====================
export interface SupplyDemandZone {
  type: 'SUPPLY' | 'DEMAND';
  price: number;
  strength: number;
  tested: number;
}

export function findSupplyDemandZones(
  candles: Candle[],
  lookback: number = 50
): SupplyDemandZone[] {
  if (candles.length < lookback) return [];

  const zones: SupplyDemandZone[] = [];
  const slice = candles.slice(-lookback);

  // Find pivot highs (supply) and lows (demand)
  for (let i = 2; i < slice.length - 2; i++) {
    const candle = slice[i];
    
    // Pivot high (supply)
    if (
      candle.high > slice[i - 1].high &&
      candle.high > slice[i - 2].high &&
      candle.high > slice[i + 1].high &&
      candle.high > slice[i + 2].high
    ) {
      zones.push({
        type: 'SUPPLY',
        price: candle.high,
        strength: candle.volume,
        tested: 0
      });
    }

    // Pivot low (demand)
    if (
      candle.low < slice[i - 1].low &&
      candle.low < slice[i - 2].low &&
      candle.low < slice[i + 1].low &&
      candle.low < slice[i + 2].low
    ) {
      zones.push({
        type: 'DEMAND',
        price: candle.low,
        strength: candle.volume,
        tested: 0
      });
    }
  }

  // Sort and merge nearby zones
  return mergeNearbyZones(zones);
}

function mergeNearbyZones(zones: SupplyDemandZone[], threshold: number = 5): SupplyDemandZone[] {
  if (zones.length === 0) return [];

  const sorted = [...zones].sort((a, b) => a.price - b.price);
  const merged: SupplyDemandZone[] = [];

  let current = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].price - current.price) < threshold && sorted[i].type === current.type) {
      current.strength += sorted[i].strength;
    } else {
      merged.push(current);
      current = sorted[i];
    }
  }
  merged.push(current);

  return merged;
}

// ==================== Full Analysis ====================
export function performFullAnalysis(candles: Candle[]): AnalysisResult {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  // Individual indicators
  const rsi = analyzeRSI(closes);
  const macd = analyzeMACD(closes);
  const ema = analyzeEMA(closes);
  const bollinger = analyzeBollingerBands(closes);

  // Overall analysis
  const signals: string[] = [];
  const warnings: string[] = [];
  let buySignals = 0;
  let sellSignals = 0;
  let totalConfidence = 0;

  // RSI
  if (rsi.signal === 'BUY') {
    buySignals++;
    totalConfidence += rsi.confidence;
    if (rsi.value < 30) signals.push('RSI تشبع بيعي');
    else signals.push('RSI يشير للصعود');
  } else if (rsi.signal === 'SELL') {
    sellSignals++;
    totalConfidence += rsi.confidence;
    if (rsi.value > 70) signals.push('RSI تشبع شرائي');
    else signals.push('RSI يشير للهبوط');
  }

  // MACD
  if (macd.signal === 'BUY') {
    buySignals++;
    totalConfidence += macd.confidence;
    signals.push('MACD تقاطع صاعد');
  } else if (macd.signal === 'SELL') {
    sellSignals++;
    totalConfidence += macd.confidence;
    signals.push('MACD تقاطع هابط');
  }

  // EMA
  if (ema.signal === 'BUY') {
    buySignals++;
    totalConfidence += ema.confidence;
    signals.push('السعر فوق EMA');
  } else if (ema.signal === 'SELL') {
    sellSignals++;
    totalConfidence += ema.confidence;
    signals.push('السعر تحت EMA');
  }

  // Bollinger
  if (bollinger.signal === 'BUY') {
    buySignals++;
    totalConfidence += bollinger.confidence;
    if (bollinger.value < 0.1) signals.push('السعر عند الحد السفلي لبولينجر');
  } else if (bollinger.signal === 'SELL') {
    sellSignals++;
    totalConfidence += bollinger.confidence;
    if (bollinger.value > 0.9) signals.push('السعر عند الحد العلوي لبولينجر');
  }

  // Check for squeeze (potential explosion)
  const bb = calculateBollingerBands(closes);
  if (bb.width < 3) {
    signals.push('⚠️ ضيق بولينجر - انفجار متوقع');
  }

  // Volume analysis
  const volumeAnalysis = analyzeVolume(volumes);
  if (volumeAnalysis.isUnusual) {
    signals.push('حجم تداول غير عادي');
  }

  // Divergence check
  const rsiValues = [];
  for (let i = 14; i <= closes.length; i++) {
    rsiValues.push(calculateRSI(closes.slice(0, i)));
  }
  const divergence = detectDivergence(closes, rsiValues);
  if (divergence.detected) {
    if (divergence.type === 'BULLISH') {
      warnings.push('تباعد صعودي على RSI');
      buySignals++;
    } else {
      warnings.push('تباعد هبوطي على RSI');
      sellSignals++;
    }
  }

  // Determine overall direction
  let direction: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  const activeSignals = buySignals + sellSignals;
  
  if (activeSignals > 0) {
    if (buySignals > sellSignals && buySignals >= 2) {
      direction = 'CALL';
    } else if (sellSignals > buySignals && sellSignals >= 2) {
      direction = 'PUT';
    }
  }

  // Calculate confidence
  const confidence = activeSignals > 0 ? Math.min(95, totalConfidence / activeSignals) : 30;

  return {
    rsi,
    macd,
    ema,
    bollinger,
    overall: {
      direction,
      confidence: Math.round(confidence),
      signals,
      warnings
    }
  };
}

// ==================== Explosion Detection ====================
export interface ExplosionSignal {
  detected: boolean;
  direction: 'CALL' | 'PUT' | 'NEUTRAL';
  confidence: number;
  reasons: string[];
}

export function detectExplosion(candles: Candle[]): ExplosionSignal {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  const reasons: string[] = [];
  let buySignals = 0;
  let sellSignals = 0;
  let confidence = 0;

  // 1. Bollinger Squeeze
  const bb = calculateBollingerBands(closes);
  if (bb.width < 3) {
    reasons.push('ضيق بولينجر شديد');
    confidence += 20;
  }

  // 2. Volume Spike
  const volumeAnalysis = analyzeVolume(volumes);
  if (volumeAnalysis.isUnusual) {
    reasons.push(`حجم تداول ${volumeAnalysis.ratio.toFixed(1)}x المتوسط`);
    confidence += 25;
  }

  // 3. ATR Expansion
  const atr = calculateATR(candles, 14);
  const prevAtr = calculateATR(candles.slice(0, -1), 14);
  if (atr > prevAtr * 1.5) {
    reasons.push('توسع في التقلبات');
    confidence += 20;
  }

  // 4. Momentum
  const momentum = closes[closes.length - 1] - closes[closes.length - 5];
  if (Math.abs(momentum) > atr * 2) {
    if (momentum > 0) {
      buySignals++;
      reasons.push('زخم صعودي قوي');
    } else {
      sellSignals++;
      reasons.push('زخم هبوطي قوي');
    }
    confidence += 25;
  }

  // 5. Price break from squeeze
  if (bb.width < 5 && volumes[volumes.length - 1] > volumes[volumes.length - 2] * 2) {
    const priceChange = closes[closes.length - 1] - closes[closes.length - 2];
    if (priceChange > 0) {
      buySignals += 2;
      reasons.push('اختراق صعودي من ضيق');
    } else {
      sellSignals += 2;
      reasons.push('اختراق هبوطي من ضيق');
    }
    confidence += 30;
  }

  let direction: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (buySignals > sellSignals) direction = 'CALL';
  else if (sellSignals > buySignals) direction = 'PUT';

  return {
    detected: reasons.length >= 2,
    direction,
    confidence: Math.min(95, confidence),
    reasons
  };
}

// ==================== ATR ====================
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;

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

  return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// ==================== Trend Strength ====================
export interface TrendAnalysis {
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number; // 0-100
  adx: number;
  isStrong: boolean;
}

export function analyzeTrend(candles: Candle[]): TrendAnalysis {
  const closes = candles.map(c => c.close);
  const adx = calculateADX(candles);
  
  // EMA alignment
  const ema9 = calculateEMAArray(closes, 9);
  const ema21 = calculateEMAArray(closes, 21);
  
  const lastEma9 = ema9[ema9.length - 1];
  const lastEma21 = ema21[ema21.length - 1];
  const lastPrice = closes[closes.length - 1];

  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 0;

  if (lastEma9 && lastEma21) {
    if (lastPrice > lastEma9 && lastEma9 > lastEma21) {
      direction = 'BULLISH';
      strength = 60;
    } else if (lastPrice < lastEma9 && lastEma9 < lastEma21) {
      direction = 'BEARISH';
      strength = 60;
    }
  }

  // Add ADX contribution
  if (adx > 25) {
    strength += 40;
  } else if (adx > 20) {
    strength += 20;
  }

  return {
    direction,
    strength: Math.min(100, strength),
    adx,
    isStrong: adx > 25
  };
}

// ==================== Support & Resistance ====================
export interface SupportResistanceLevel {
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  touches: number;
  strength: number;
}

export function findSupportResistance(
  candles: Candle[],
  lookback: number = 50
): SupportResistanceLevel[] {
  if (candles.length < lookback) return [];

  const levels: SupportResistanceLevel[] = [];
  const slice = candles.slice(-lookback);
  const tolerance = slice[slice.length - 1].close * 0.002; // 0.2%

  // Find pivot points
  for (let i = 2; i < slice.length - 2; i++) {
    const candle = slice[i];
    
    // Resistance (pivot high)
    if (
      candle.high > slice[i - 1].high &&
      candle.high > slice[i - 2].high &&
      candle.high > slice[i + 1].high &&
      candle.high > slice[i + 2].high
    ) {
      levels.push({
        price: candle.high,
        type: 'RESISTANCE',
        touches: 1,
        strength: candle.volume
      });
    }

    // Support (pivot low)
    if (
      candle.low < slice[i - 1].low &&
      candle.low < slice[i - 2].low &&
      candle.low < slice[i + 1].low &&
      candle.low < slice[i + 2].low
    ) {
      levels.push({
        price: candle.low,
        type: 'SUPPORT',
        touches: 1,
        strength: candle.volume
      });
    }
  }

  // Merge nearby levels
  const merged: SupportResistanceLevel[] = [];
  const sorted = [...levels].sort((a, b) => a.price - b.price);

  for (const level of sorted) {
    const existing = merged.find(
      l => l.type === level.type && Math.abs(l.price - level.price) < tolerance
    );
    if (existing) {
      existing.touches++;
      existing.strength += level.strength;
    } else {
      merged.push({ ...level });
    }
  }

  return merged.sort((a, b) => b.strength - a.strength).slice(0, 5);
}
