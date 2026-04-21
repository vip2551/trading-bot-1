import { NextRequest, NextResponse } from 'next/server';
import { 
  BacktestEngine, 
  BUILT_IN_STRATEGIES, 
  DEFAULT_BACKTEST_CONFIG,
  BacktestConfig,
  BacktestStrategy
} from '@/lib/backtesting/engine';
import { db } from '@/lib/db';

// GET - الحصول على الاستراتيجيات المتاحة
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      strategies: BUILT_IN_STRATEGIES.map(s => ({
        name: s.name,
        description: s.description
      })),
      defaultConfig: {
        startDate: DEFAULT_BACKTEST_CONFIG.startDate.toISOString(),
        endDate: DEFAULT_BACKTEST_CONFIG.endDate.toISOString(),
        initialCapital: DEFAULT_BACKTEST_CONFIG.initialCapital,
        commission: DEFAULT_BACKTEST_CONFIG.commission,
        slippage: DEFAULT_BACKTEST_CONFIG.slippage,
        riskPerTrade: DEFAULT_BACKTEST_CONFIG.riskPerTrade,
        maxDailyLoss: DEFAULT_BACKTEST_CONFIG.maxDailyLoss,
        maxDrawdown: DEFAULT_BACKTEST_CONFIG.maxDrawdown
      }
    });
  } catch (error) {
    console.error('[BACKTEST API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}

// POST - تشغيل الاختبار الرجعي
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // إعداد التكوين
    const config: BacktestConfig = {
      startDate: new Date(body.startDate || DEFAULT_BACKTEST_CONFIG.startDate),
      endDate: new Date(body.endDate || DEFAULT_BACKTEST_CONFIG.endDate),
      initialCapital: body.initialCapital || DEFAULT_BACKTEST_CONFIG.initialCapital,
      commission: body.commission || DEFAULT_BACKTEST_CONFIG.commission,
      slippage: body.slippage || DEFAULT_BACKTEST_CONFIG.slippage,
      defaultQuantity: body.defaultQuantity || DEFAULT_BACKTEST_CONFIG.defaultQuantity,
      maxPositionSize: body.maxPositionSize || DEFAULT_BACKTEST_CONFIG.maxPositionSize,
      riskPerTrade: body.riskPerTrade || DEFAULT_BACKTEST_CONFIG.riskPerTrade,
      maxDailyLoss: body.maxDailyLoss || DEFAULT_BACKTEST_CONFIG.maxDailyLoss,
      maxDrawdown: body.maxDrawdown || DEFAULT_BACKTEST_CONFIG.maxDrawdown,
      indicators: {
        rsi: { period: 14 },
        macd: { fast: 12, slow: 26, signal: 9 },
        ema: [20, 50, 200],
        atr: { period: 14 },
        bollinger: { period: 20, stdDev: 2 }
      }
    };
    
    // التحقق من التواريخ
    if (config.startDate >= config.endDate) {
      return NextResponse.json(
        { success: false, error: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' },
        { status: 400 }
      );
    }
    
    // البحث عن الاستراتيجية
    const strategyName = body.strategy || 'RSI Reversal';
    const strategy = BUILT_IN_STRATEGIES.find(s => s.name === strategyName);
    
    if (!strategy) {
      return NextResponse.json(
        { success: false, error: `استراتيجية غير موجودة: ${strategyName}` },
        { status: 400 }
      );
    }
    
    // إنشاء محرك الاختبار
    const engine = new BacktestEngine(config);
    
    // تحميل البيانات
    const symbol = body.symbol || 'SPX';
    await engine.loadData(symbol);
    
    // تشغيل الاختبار
    const result = await engine.run(strategy);
    
    // حفظ النتيجة في قاعدة البيانات (اختياري)
    if (body.saveResult) {
      try {
        await db.backtest.create({
          data: {
            userId: body.userId || 'demo',
            name: `${strategyName} - ${symbol}`,
            description: `Backtest from ${config.startDate.toDateString()} to ${config.endDate.toDateString()}`,
            symbol,
            timeframe: '1h',
            startDate: config.startDate,
            endDate: config.endDate,
            parameters: JSON.stringify(config),
            totalTrades: result.totalTrades,
            winCount: result.winningTrades,
            lossCount: result.losingTrades,
            winRate: result.winRate,
            totalPnL: result.totalReturn,
            maxDrawdown: result.maxDrawdownPercent,
            status: 'COMPLETED',
            progress: 100,
            trades: JSON.stringify(result.trades.slice(0, 100)), // أول 100 صفقة فقط
            equityCurve: JSON.stringify(result.equityCurve.slice(0, 500)) // أول 500 نقطة
          }
        });
      } catch (dbError) {
        console.error('[BACKTEST API] Database save error:', dbError);
      }
    }
    
    // إرجاع النتيجة
    return NextResponse.json({
      success: true,
      strategy: {
        name: strategy.name,
        description: strategy.description
      },
      result: {
        // ملخص
        totalTrades: result.totalTrades,
        winningTrades: result.winningTrades,
        losingTrades: result.losingTrades,
        winRate: result.winRate.toFixed(2),
        
        // الأداء
        totalReturn: result.totalReturn.toFixed(2),
        totalReturnPercent: result.totalReturnPercent.toFixed(2),
        annualizedReturn: result.annualizedReturn.toFixed(2),
        
        // المخاطر
        maxDrawdown: result.maxDrawdown.toFixed(2),
        maxDrawdownPercent: result.maxDrawdownPercent.toFixed(2),
        averageDrawdown: result.averageDrawdown.toFixed(2),
        
        // المتوسطات
        avgWin: result.avgWin.toFixed(2),
        avgLoss: result.avgLoss.toFixed(2),
        avgWinPercent: result.avgWinPercent.toFixed(2),
        avgLossPercent: result.avgLossPercent.toFixed(2),
        profitFactor: result.profitFactor === Infinity ? '∞' : result.profitFactor.toFixed(2),
        
        // الإحصائيات
        sharpeRatio: result.sharpeRatio.toFixed(2),
        sortinoRatio: result.sortinoRatio.toFixed(2),
        calmarRatio: result.calmarRatio.toFixed(2),
        
        // السلاسل
        maxWinStreak: result.maxWinStreak,
        maxLossStreak: result.maxLossStreak,
        
        // الوقت
        tradingDays: result.tradingDays,
        avgTradeDuration: result.avgTradeDuration.toFixed(0),
        
        // المنحنيات (مخفضة للأداء)
        equityCurve: result.equityCurve.filter((_, i) => i % 4 === 0).slice(0, 250),
        drawdownCurve: result.drawdownCurve.filter((_, i) => i % 4 === 0).slice(0, 250),
        monthlyReturns: result.monthlyReturns,
        
        // آخر 20 صفقة
        recentTrades: result.trades.slice(-20).map(t => ({
          symbol: t.symbol,
          direction: t.direction,
          entryTime: new Date(t.entryTime).toISOString(),
          entryPrice: t.entryPrice.toFixed(2),
          exitTime: new Date(t.exitTime).toISOString(),
          exitPrice: t.exitPrice.toFixed(2),
          pnl: t.pnl.toFixed(2),
          pnlPercent: t.pnlPercent.toFixed(2),
          exitReason: t.exitReason
        }))
      }
    });
    
  } catch (error) {
    console.error('[BACKTEST API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ في تشغيل الاختبار',
        message: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
