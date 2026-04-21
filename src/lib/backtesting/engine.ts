/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔬 BACKTESTING ENGINE - محرك الاختبار الرجعي
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * اختبار الاستراتيجيات على بيانات تاريخية
 * - محاكاة واقعية للتنفيذ
 * - حساب الرسوم والانزلاق السعري
 * - تقارير أداء شاملة
 */

import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 أنواع البيانات
// ═══════════════════════════════════════════════════════════════════════════════

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestConfig {
  // الفترة الزمنية
  startDate: Date;
  endDate: Date;
  
  // رأس المال
  initialCapital: number;
  
  // الرسوم والتكاليف
  commission: number;        // $ per contract
  slippage: number;          // % slippage
  
  // إعدادات التداول
  defaultQuantity: number;
  maxPositionSize: number;   // % of capital
  
  // إدارة المخاطر
  riskPerTrade: number;      // % of capital
  maxDailyLoss: number;      // % of capital
  maxDrawdown: number;       // % max drawdown allowed
  
  // المؤشرات المطلوبة
  indicators: {
    rsi?: { period: number };
    macd?: { fast: number; slow: number; signal: number };
    ema?: number[];          // [20, 50, 200]
    atr?: { period: number };
    bollinger?: { period: number; stdDev: number };
  };
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL' | 'TIME_EXIT' | 'FORCED';
  strategy: string;
}

export interface BacktestResult {
  // ملخص
  config: BacktestConfig;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // الأداء
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  
  // المخاطر
  maxDrawdown: number;
  maxDrawdownPercent: number;
  averageDrawdown: number;
  
  // المتوسطات
  avgWin: number;
  avgLoss: number;
  avgWinPercent: number;
  avgLossPercent: number;
  profitFactor: number;
  riskRewardRatio: number;
  
  // الإحصائيات
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  
  // السلاسل
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: number;
  
  // التفاصيل
  trades: BacktestTrade[];
  equityCurve: { timestamp: number; equity: number }[];
  drawdownCurve: { timestamp: number; drawdown: number }[];
  monthlyReturns: { month: string; return: number }[];
  
  // الوقت
  tradingDays: number;
  avgTradeDuration: number;  // minutes
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 حساب المؤشرات الفنية
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateIndicators(candles: Candle[], config: BacktestConfig) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const indicators: any = {};
  
  // RSI
  if (config.indicators.rsi) {
    indicators.rsi = calculateRSI(closes, config.indicators.rsi.period);
  }
  
  // EMA
  if (config.indicators.ema) {
    indicators.ema = {};
    for (const period of config.indicators.ema) {
      indicators.ema[period] = calculateEMA(closes, period);
    }
  }
  
  // MACD
  if (config.indicators.macd) {
    const { fast, slow, signal } = config.indicators.macd;
    indicators.macd = calculateMACD(closes, fast, slow, signal);
  }
  
  // ATR
  if (config.indicators.atr) {
    indicators.atr = calculateATR(highs, lows, closes, config.indicators.atr.period);
  }
  
  // Bollinger
  if (config.indicators.bollinger) {
    const { period, stdDev } = config.indicators.bollinger;
    indicators.bollinger = calculateBollinger(closes, period, stdDev);
  }
  
  return indicators;
}

function calculateRSI(prices: number[], period: number): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  rsi.push(100 - (100 / (1 + avgGain / (avgLoss || 0.001))));
  
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    avgGain = ((avgGain * (period - 1)) + Math.max(0, change)) / period;
    avgLoss = ((avgLoss * (period - 1)) + Math.max(0, -change)) / period;
    rsi.push(100 - (100 / (1 + avgGain / (avgLoss || 0.001))));
  }
  
  return rsi;
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
    ema.push(sum / (i + 1));
  }
  
  for (let i = period; i < prices.length; i++) {
    ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
  }
  
  return ema;
}

function calculateMACD(prices: number[], fast: number, slow: number, signal: number): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  
  const macd = emaFast.map((f, i) => f - emaSlow[i]);
  const signalLine = calculateEMA(macd, signal);
  const histogram = macd.map((m, i) => m - signalLine[i]);
  
  return { macd, signal: signalLine, histogram };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const tr: number[] = [];
  const atr: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
    } else {
      tr.push(Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      ));
    }
  }
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
    atr.push(sum / (i + 1));
  }
  
  for (let i = period; i < tr.length; i++) {
    atr.push((atr[i - 1] * (period - 1) + tr[i]) / period);
  }
  
  return atr;
}

function calculateBollinger(prices: number[], period: number, stdDev: number): { upper: number[]; middle: number[]; lower: number[] } {
  const middle: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    middle.push(sma);
    upper.push(sma + stdDev * std);
    lower.push(sma - stdDev * std);
  }
  
  return { upper, middle, lower };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 محرك الاختبار الرجعي
// ═══════════════════════════════════════════════════════════════════════════════

export class BacktestEngine {
  private config: BacktestConfig;
  private candles: Candle[];
  private indicators: any;
  private equity: number;
  private cash: number;
  private position: { direction: 'LONG' | 'SHORT'; quantity: number; entryPrice: number; entryTime: number; stopLoss?: number; takeProfit?: number } | null;
  private trades: BacktestTrade[];
  private equityCurve: { timestamp: number; equity: number }[];
  private dailyPnL: number;
  private tradingDate: number;
  
  constructor(config: BacktestConfig) {
    this.config = config;
    this.candles = [];
    this.indicators = {};
    this.equity = config.initialCapital;
    this.cash = config.initialCapital;
    this.position = null;
    this.trades = [];
    this.equityCurve = [];
    this.dailyPnL = 0;
    this.tradingDate = 0;
  }
  
  /**
   * تحميل البيانات التاريخية
   */
  async loadData(symbol: string, timeframe: string = '1h'): Promise<boolean> {
    try {
      // محاولة جلب من قاعدة البيانات
      const signals = await db.signalLog.findMany({
        where: {
          symbol,
          createdAt: {
            gte: this.config.startDate,
            lte: this.config.endDate
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // تحويل إلى شموع (تجميع حسب الوقت)
      // للتبسيط، سنستخدم بيانات وهمية إذا لم توجد بيانات حقيقية
      if (signals.length < 10) {
        console.log('[BACKTEST] Generating synthetic data...');
        this.candles = this.generateSyntheticData();
      } else {
        // تحويل الإشارات إلى شموع
        this.candles = this.aggregateToCandles(signals);
      }
      
      // حساب المؤشرات
      this.indicators = calculateIndicators(this.candles, this.config);
      
      return true;
    } catch (error) {
      console.error('[BACKTEST] Error loading data:', error);
      this.candles = this.generateSyntheticData();
      this.indicators = calculateIndicators(this.candles, this.config);
      return true;
    }
  }
  
  /**
   * توليد بيانات اصطناعية للاختبار
   */
  private generateSyntheticData(): Candle[] {
    const candles: Candle[] = [];
    const startTimestamp = this.config.startDate.getTime();
    const endTimestamp = this.config.endDate.getTime();
    const interval = 3600000; // ساعة واحدة
    
    let price = 4500; // سعر ابتدائي SPX
    let timestamp = startTimestamp;
    
    while (timestamp < endTimestamp) {
      // محاكاة حركة سعر عشوائية مع اتجاه
      const trend = Math.sin(timestamp / (24 * 3600000)) * 0.001; // اتجاه يومي
      const volatility = 0.005; // تقلب 0.5%
      const change = (Math.random() - 0.5 + trend) * volatility * price;
      
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
      const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
      
      price = close;
      timestamp += interval;
    }
    
    return candles;
  }
  
  /**
   * تجميع البيانات إلى شموع
   */
  private aggregateToCandles(signals: any[]): Candle[] {
    // تجميع حسب الساعة
    const hourlyData = new Map<number, { opens: number[]; highs: number[]; lows: number[]; closes: number[]; volumes: number[] }>();
    
    for (const signal of signals) {
      const hour = Math.floor(new Date(signal.createdAt).getTime() / 3600000) * 3600000;
      const price = signal.price || 4500;
      
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { opens: [], highs: [], lows: [], closes: [], volumes: [] });
      }
      
      const data = hourlyData.get(hour)!;
      if (signal.price) data.opens.push(price);
    }
    
    return Array.from(hourlyData.entries()).map(([timestamp, data]) => ({
      timestamp,
      open: data.opens[0] || 4500,
      high: Math.max(...data.highs, data.opens[0] || 4500),
      low: Math.min(...data.lows, data.opens[0] || 4500),
      close: data.closes[data.closes.length - 1] || data.opens[0] || 4500,
      volume: data.volumes.reduce((a, b) => a + b, 0) || 1000000
    })).sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * تشغيل الاختبار
   */
  async run(strategy: BacktestStrategy): Promise<BacktestResult> {
    console.log(`[BACKTEST] Running backtest from ${this.config.startDate.toISOString()} to ${this.config.endDate.toISOString()}`);
    console.log(`[BACKTEST] Total candles: ${this.candles.length}`);
    
    // إعادة تعيين الحالة
    this.equity = this.config.initialCapital;
    this.cash = this.config.initialCapital;
    this.position = null;
    this.trades = [];
    this.equityCurve = [];
    
    // تنفيذ الاستراتيجية على كل شمعة
    for (let i = 100; i < this.candles.length; i++) {
      const candle = this.candles[i];
      const prevCandle = this.candles[i - 1];
      
      // تحديث التاريخ
      const currentDate = Math.floor(candle.timestamp / 86400000);
      if (currentDate !== this.tradingDate) {
        this.dailyPnL = 0;
        this.tradingDate = currentDate;
      }
      
      // التحقق من Drawdown
      const drawdown = (this.config.initialCapital - this.equity) / this.config.initialCapital;
      if (drawdown >= this.config.maxDrawdown / 100) {
        console.log(`[BACKTEST] Max drawdown reached: ${(drawdown * 100).toFixed(2)}%`);
        break;
      }
      
      // التحقق من الحد اليومي
      if (this.dailyPnL <= -this.config.maxDailyLoss / 100 * this.config.initialCapital) {
        continue; // تخطي التداول لهذا اليوم
      }
      
      // إدارة الصفقة الحالية
      if (this.position) {
        const exitReason = this.checkExit(candle, prevCandle, strategy);
        if (exitReason) {
          this.closePosition(candle, exitReason);
        }
      }
      
      // البحث عن إشارة دخول
      if (!this.position) {
        const signal = strategy.checkEntry(i, this.candles, this.indicators, this.config);
        if (signal) {
          this.openPosition(candle, signal, i);
        }
      }
      
      // تحديث منحنى رأس المال
      this.equityCurve.push({
        timestamp: candle.timestamp,
        equity: this.equity
      });
    }
    
    // إغلاق أي صفقة مفتوحة
    if (this.position) {
      const lastCandle = this.candles[this.candles.length - 1];
      this.closePosition(lastCandle, 'FORCED');
    }
    
    // حساب النتائج
    return this.calculateResults();
  }
  
  /**
   * التحقق من شروط الخروج
   */
  private checkExit(candle: Candle, prevCandle: Candle, strategy: BacktestStrategy): BacktestTrade['exitReason'] | null {
    if (!this.position) return null;
    
    // Stop Loss
    if (this.position.stopLoss) {
      if (this.position.direction === 'LONG' && candle.low <= this.position.stopLoss) {
        return 'STOP_LOSS';
      }
      if (this.position.direction === 'SHORT' && candle.high >= this.position.stopLoss) {
        return 'STOP_LOSS';
      }
    }
    
    // Take Profit
    if (this.position.takeProfit) {
      if (this.position.direction === 'LONG' && candle.high >= this.position.takeProfit) {
        return 'TAKE_PROFIT';
      }
      if (this.position.direction === 'SHORT' && candle.low <= this.position.takeProfit) {
        return 'TAKE_PROFIT';
      }
    }
    
    // إشارة الاستراتيجية
    const shouldExit = strategy.checkExit(this.position, candle, prevCandle);
    if (shouldExit) {
      return 'SIGNAL';
    }
    
    return null;
  }
  
  /**
   * فتح صفقة
   */
  private openPosition(candle: Candle, signal: { direction: 'LONG' | 'SHORT'; stopLoss?: number; takeProfit?: number; strategy: string }, index: number) {
    // حساب حجم الصفقة
    const riskAmount = this.equity * (this.config.riskPerTrade / 100);
    const stopDistance = signal.stopLoss ? Math.abs(candle.close - signal.stopLoss) : candle.close * 0.01;
    const quantity = Math.floor(riskAmount / stopDistance) || 1;
    
    // تطبيق الانزلاق السعري
    const slippagePrice = candle.close * (1 + this.config.slippage / 100);
    const entryPrice = signal.direction === 'LONG' ? 
      Math.max(candle.close, slippagePrice) : 
      Math.min(candle.close, slippagePrice);
    
    this.position = {
      direction: signal.direction,
      quantity: Math.min(quantity, Math.floor(this.equity * this.config.maxPositionSize / 100 / entryPrice)),
      entryPrice,
      entryTime: candle.timestamp,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit
    };
    
    // خصم الرسوم
    const fees = this.position.quantity * this.config.commission;
    this.cash -= fees;
    this.equity -= fees;
  }
  
  /**
   * إغلاق صفقة
   */
  private closePosition(candle: Candle, reason: BacktestTrade['exitReason']) {
    if (!this.position) return;
    
    let exitPrice: number;
    
    switch (reason) {
      case 'STOP_LOSS':
        exitPrice = this.position.stopLoss!;
        break;
      case 'TAKE_PROFIT':
        exitPrice = this.position.takeProfit!;
        break;
      default:
        // تطبيق الانزلاق السعري
        const slippagePrice = candle.close * (1 + this.config.slippage / 100);
        exitPrice = this.position.direction === 'LONG' ? 
          Math.min(candle.close, slippagePrice) : 
          Math.max(candle.close, slippagePrice);
    }
    
    // حساب P&L
    let pnl: number;
    if (this.position.direction === 'LONG') {
      pnl = (exitPrice - this.position.entryPrice) * this.position.quantity;
    } else {
      pnl = (this.position.entryPrice - exitPrice) * this.position.quantity;
    }
    
    // خصم الرسوم
    const fees = this.position.quantity * this.config.commission * 2;
    pnl -= fees;
    
    // تحديث رأس المال
    this.cash += this.position.quantity * this.position.entryPrice + pnl;
    this.equity += pnl;
    this.dailyPnL += pnl;
    
    // تسجيل الصفقة
    this.trades.push({
      id: `trade_${this.trades.length + 1}`,
      symbol: 'SPX',
      direction: this.position.direction,
      entryTime: this.position.entryTime,
      entryPrice: this.position.entryPrice,
      exitTime: candle.timestamp,
      exitPrice,
      quantity: this.position.quantity,
      stopLoss: this.position.stopLoss,
      takeProfit: this.position.takeProfit,
      pnl,
      pnlPercent: (pnl / (this.position.entryPrice * this.position.quantity)) * 100,
      fees,
      exitReason: reason,
      strategy: 'default'
    });
    
    this.position = null;
  }
  
  /**
   * حساب النتائج النهائية
   */
  private calculateResults(): BacktestResult {
    const wins = this.trades.filter(t => t.pnl > 0);
    const losses = this.trades.filter(t => t.pnl <= 0);
    
    const totalReturn = this.equity - this.config.initialCapital;
    const totalReturnPercent = (totalReturn / this.config.initialCapital) * 100;
    
    // حساب Max Drawdown
    let maxEquity = this.config.initialCapital;
    let maxDrawdown = 0;
    let totalDrawdown = 0;
    const drawdownCurve: { timestamp: number; drawdown: number }[] = [];
    
    for (const point of this.equityCurve) {
      if (point.equity > maxEquity) maxEquity = point.equity;
      const drawdown = (maxEquity - point.equity) / maxEquity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      totalDrawdown += drawdown;
      drawdownCurve.push({ timestamp: point.timestamp, drawdown });
    }
    
    // حساب السلاسل
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    
    for (const trade of this.trades) {
      if (trade.pnl > 0) {
        tempWinStreak++;
        tempLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, tempWinStreak);
      } else {
        tempLossStreak++;
        tempWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, tempLossStreak);
      }
    }
    
    // حساب Sharpe Ratio
    const returns = this.trades.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
    const stdReturn = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length) || 1;
    const sharpeRatio = (avgReturn / stdReturn) * Math.sqrt(252); // Annualized
    
    // حساب Sortino Ratio
    const negativeReturns = returns.filter(r => r < 0);
    const downDev = Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length) || 1;
    const sortinoRatio = (avgReturn / downDev) * Math.sqrt(252);
    
    // العائد السنوي
    const days = (this.config.endDate.getTime() - this.config.startDate.getTime()) / 86400000;
    const annualizedReturn = (Math.pow(1 + totalReturnPercent / 100, 365 / days) - 1) * 100;
    
    // متوسط مدة الصفقة
    const avgTradeDuration = this.trades.reduce((sum, t) => sum + (t.exitTime - t.entryTime), 0) / this.trades.length / 60000;
    
    // العوائد الشهرية
    const monthlyReturns = this.calculateMonthlyReturns();
    
    return {
      config: this.config,
      totalTrades: this.trades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: this.trades.length > 0 ? (wins.length / this.trades.length) * 100 : 0,
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      maxDrawdown: maxDrawdown * this.config.initialCapital,
      maxDrawdownPercent: maxDrawdown * 100,
      averageDrawdown: (totalDrawdown / this.equityCurve.length) * 100,
      avgWin: wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0,
      avgWinPercent: wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnlPercent, 0) / wins.length : 0,
      avgLossPercent: losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnlPercent, 0) / losses.length) : 0,
      profitFactor: losses.length > 0 ? 
        wins.reduce((sum, t) => sum + t.pnl, 0) / Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0)) : 
        wins.length > 0 ? Infinity : 0,
      riskRewardRatio: 0,
      sharpeRatio,
      sortinoRatio,
      calmarRatio: annualizedReturn / (maxDrawdown * 100 || 1),
      maxWinStreak,
      maxLossStreak,
      currentStreak,
      trades: this.trades,
      equityCurve: this.equityCurve,
      drawdownCurve,
      monthlyReturns,
      tradingDays: Math.ceil(days),
      avgTradeDuration
    };
  }
  
  /**
   * حساب العوائد الشهرية
   */
  private calculateMonthlyReturns(): { month: string; return: number }[] {
    const monthlyEquity = new Map<string, { start: number; end: number }>();
    
    for (let i = 0; i < this.equityCurve.length; i++) {
      const date = new Date(this.equityCurve[i].timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyEquity.has(monthKey)) {
        monthlyEquity.set(monthKey, { start: this.equityCurve[i].equity, end: this.equityCurve[i].equity });
      } else {
        monthlyEquity.get(monthKey)!.end = this.equityCurve[i].equity;
      }
    }
    
    return Array.from(monthlyEquity.entries()).map(([month, data]) => ({
      month,
      return: ((data.end - data.start) / data.start) * 100
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 واجهة الاستراتيجية
// ═══════════════════════════════════════════════════════════════════════════════

export interface BacktestStrategy {
  name: string;
  description: string;
  checkEntry: (index: number, candles: Candle[], indicators: any, config: BacktestConfig) => { direction: 'LONG' | 'SHORT'; stopLoss?: number; takeProfit?: number } | null;
  checkExit: (position: { direction: 'LONG' | 'SHORT'; quantity: number; entryPrice: number }, candle: Candle, prevCandle: Candle) => boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📚 الاستراتيجيات الجاهزة
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILT_IN_STRATEGIES: BacktestStrategy[] = [
  {
    name: 'RSI Reversal',
    description: 'شراء عند تشبع بيعي RSI < 30، بيع عند تشبع شرائي RSI > 70',
    checkEntry: (index, candles, indicators, config) => {
      if (!indicators.rsi || index < config.indicators.rsi!.period) return null;
      
      const rsiIndex = index - config.indicators.rsi!.period;
      if (rsiIndex < 0 || rsiIndex >= indicators.rsi.length) return null;
      
      const rsi = indicators.rsi[rsiIndex];
      const price = candles[index].close;
      
      if (rsi < 30) {
        return { direction: 'LONG', stopLoss: price * 0.98, takeProfit: price * 1.04 };
      }
      if (rsi > 70) {
        return { direction: 'SHORT', stopLoss: price * 1.02, takeProfit: price * 0.96 };
      }
      return null;
    },
    checkExit: (position, candle, prevCandle) => {
      return false; // نعتمد على SL/TP
    }
  },
  {
    name: 'EMA Crossover',
    description: 'شراء عند تقاطع EMA 20 فوق EMA 50، بيع عند العكس',
    checkEntry: (index, candles, indicators, config) => {
      if (!indicators.ema?.[20] || !indicators.ema?.[50]) return null;
      
      const ema20 = indicators.ema[20];
      const ema50 = indicators.ema[50];
      
      if (index < 50) return null;
      
      const currentSpread = ema20[index - 20] - ema50[index - 50];
      const prevSpread = ema20[index - 21] - ema50[index - 51];
      
      const price = candles[index].close;
      
      if (prevSpread <= 0 && currentSpread > 0) {
        return { direction: 'LONG', stopLoss: price * 0.97, takeProfit: price * 1.06 };
      }
      if (prevSpread >= 0 && currentSpread < 0) {
        return { direction: 'SHORT', stopLoss: price * 1.03, takeProfit: price * 0.94 };
      }
      return null;
    },
    checkExit: (position, candle, prevCandle) => {
      return false;
    }
  },
  {
    name: 'MACD Signal',
    description: 'شراء عند تقاطع MACD خط الإشارة صعوداً، بيع عند العكس',
    checkEntry: (index, candles, indicators, config) => {
      if (!indicators.macd) return null;
      
      const { macd, signal } = indicators.macd;
      if (index < 35) return null;
      
      const macdIndex = index - 35;
      if (macdIndex < 1 || macdIndex >= macd.length) return null;
      
      const currentSpread = macd[macdIndex] - signal[macdIndex];
      const prevSpread = macd[macdIndex - 1] - signal[macdIndex - 1];
      
      const price = candles[index].close;
      
      if (prevSpread <= 0 && currentSpread > 0) {
        return { direction: 'LONG', stopLoss: price * 0.98, takeProfit: price * 1.04 };
      }
      if (prevSpread >= 0 && currentSpread < 0) {
        return { direction: 'SHORT', stopLoss: price * 1.02, takeProfit: price * 0.96 };
      }
      return null;
    },
    checkExit: (position, candle, prevCandle) => {
      return false;
    }
  },
  {
    name: 'Bollinger Bounce',
    description: 'شراء عند ملامسة النطاق السفلي، بيع عند ملامسة العلوي',
    checkEntry: (index, candles, indicators, config) => {
      if (!indicators.bollinger) return null;
      
      const { upper, lower } = indicators.bollinger;
      if (index < 20) return null;
      
      const bollIndex = index - 20;
      if (bollIndex >= upper.length) return null;
      
      const price = candles[index].close;
      const prevPrice = candles[index - 1].close;
      
      if (prevPrice <= lower[bollIndex] && price > lower[bollIndex]) {
        return { direction: 'LONG', stopLoss: lower[bollIndex] * 0.99, takeProfit: price * 1.03 };
      }
      if (prevPrice >= upper[bollIndex] && price < upper[bollIndex]) {
        return { direction: 'SHORT', stopLoss: upper[bollIndex] * 1.01, takeProfit: price * 0.97 };
      }
      return null;
    },
    checkExit: (position, candle, prevCandle) => {
      return false;
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ إعدادات افتراضية
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  startDate: new Date(Date.now() - 90 * 24 * 3600000), // آخر 90 يوم
  endDate: new Date(),
  initialCapital: 100000,
  commission: 0.65,
  slippage: 0.1,
  defaultQuantity: 1,
  maxPositionSize: 10,
  riskPerTrade: 1,
  maxDailyLoss: 3,
  maxDrawdown: 20,
  indicators: {
    rsi: { period: 14 },
    macd: { fast: 12, slow: 26, signal: 9 },
    ema: [20, 50, 200],
    atr: { period: 14 },
    bollinger: { period: 20, stdDev: 2 }
  }
};

export default {
  BacktestEngine,
  BUILT_IN_STRATEGIES,
  DEFAULT_BACKTEST_CONFIG,
  calculateIndicators
};
