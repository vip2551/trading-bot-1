import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3005;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// ==================== TECHNICAL INDICATORS ====================

function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
    result.push(NaN);
  }
  
  if (data.length >= period) {
    result[period - 1] = sum / period;
  }
  
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    result.push(ema);
  }
  
  return result;
}

function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
      continue;
    }
    let avgGain = 0, avgLoss = 0;
    for (let j = i - period; j < i; j++) {
      avgGain += gains[j] || 0;
      avgLoss += losses[j] || 0;
    }
    avgGain /= period;
    avgLoss /= period;
    result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  }
  return result;
}

// ✅ MACD صحيح
function calculateMACD(data: number[], fast = 12, slow = 26, signal = 9): {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
} {
  const fastEMA = calculateEMA(data, fast);
  const slowEMA = calculateEMA(data, slow);
  
  // MACD Line = Fast EMA - Slow EMA
  const macdLine: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Signal Line = EMA(9) of MACD Line
  const validMacd = macdLine.filter(v => !isNaN(v));
  const signalEMA = calculateEMA(validMacd, signal);
  
  const signalLine: number[] = [];
  let validIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      signalLine.push(NaN);
    } else {
      signalLine.push(signalEMA[validIndex] ?? NaN);
      validIndex++;
    }
  }
  
  // ✅ Histogram = MACD Line - Signal Line (الصحيح!)
  const histogram: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }
  
  return { macdLine, signalLine, histogram };
}

// ==================== SIGNAL ANALYSIS ====================

interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
  indicators: {
    macd: { signal: string; value: number };
    rsi: { signal: string; value: number };
    sma: { signal: string; value: number };
  };
}

function analyzeSignals(prices: number[]): TradeSignal {
  const reasons: string[] = [];
  let score = 0;
  
  // القيم الافتراضية
  let macdSignal = { signal: 'neutral', value: 0 };
  let rsiSignal = { signal: 'neutral', value: 50 };
  let smaSignal = { signal: 'neutral', value: 0 };
  
  // MACD Analysis
  if (prices.length >= 35) {
    const macd = calculateMACD(prices);
    const lastHist = macd.histogram[macd.histogram.length - 1];
    const prevHist = macd.histogram[macd.histogram.length - 2];
    
    if (!isNaN(lastHist) && !isNaN(prevHist)) {
      if (prevHist <= 0 && lastHist > 0) {
        reasons.push('MACD bullish crossover');
        score += 30;
        macdSignal = { signal: 'bullish', value: lastHist };
      } else if (prevHist >= 0 && lastHist < 0) {
        reasons.push('MACD bearish crossover');
        score -= 30;
        macdSignal = { signal: 'bearish', value: lastHist };
      } else {
        macdSignal = { signal: lastHist > 0 ? 'bullish' : 'bearish', value: lastHist };
        score += lastHist > 0 ? 10 : -10;
      }
    }
  }
  
  // RSI Analysis
  if (prices.length >= 15) {
    const rsi = calculateRSI(prices);
    const lastRsi = rsi[rsi.length - 1];
    
    if (!isNaN(lastRsi)) {
      rsiSignal = { signal: lastRsi > 50 ? 'bullish' : 'bearish', value: lastRsi };
      
      if (lastRsi < 30) {
        reasons.push('RSI oversold');
        score += 25;
      } else if (lastRsi > 70) {
        reasons.push('RSI overbought');
        score -= 25;
      } else {
        score += lastRsi > 50 ? 10 : -10;
      }
    }
  }
  
  // SMA Analysis
  if (prices.length >= 50) {
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const lastPrice = prices[prices.length - 1];
    const lastSma20 = sma20[sma20.length - 1];
    const lastSma50 = sma50[sma50.length - 1];
    
    if (!isNaN(lastSma20) && !isNaN(lastSma50)) {
      if (lastPrice > lastSma20 && lastPrice > lastSma50) {
        reasons.push('Price above SMAs');
        score += 20;
        smaSignal = { signal: 'bullish', value: lastSma20 - lastSma50 };
      } else if (lastPrice < lastSma20 && lastPrice < lastSma50) {
        reasons.push('Price below SMAs');
        score -= 20;
        smaSignal = { signal: 'bearish', value: lastSma20 - lastSma50 };
      }
    }
  }
  
  // Determine action
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  if (score >= 40) action = 'BUY';
  else if (score <= -40) action = 'SELL';
  
  const confidence = Math.min(100, Math.abs(score));
  
  return {
    action,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['No significant signals'],
    indicators: { macd: macdSignal, rsi: rsiSignal, sma: smaSignal }
  };
}

// ==================== API ROUTES ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/analyze', (req, res) => {
  const { prices, symbol } = req.body;
  
  if (!prices || !Array.isArray(prices) || prices.length < 35) {
    return res.status(400).json({
      success: false,
      error: 'Minimum 35 price points required for analysis'
    });
  }
  
  // ✅ التحقق من البيانات الوهمية
  const uniquePrices = new Set(prices);
  if (uniquePrices.size < 5) {
    return res.status(400).json({
      success: false,
      error: 'Price data appears to be mock or generated'
    });
  }
  
  const signal = analyzeSignals(prices);
  
  res.json({
    success: true,
    symbol: symbol || 'UNKNOWN',
    signal,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[Auto-Trader] Running on port ${PORT}`);
  console.log(`[Auto-Trader] CORS: ${process.env.ALLOWED_ORIGINS || 'http://localhost:3000'}`);
});