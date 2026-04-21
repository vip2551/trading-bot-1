import { NextRequest, NextResponse } from 'next/server';
import { getRealMarketContext, getPerformanceStats, checkRiskLimits } from '@/lib/market-context';
import { ibService } from '@/lib/ib-service';
import { db } from '@/lib/db';
import { MODE, getCurrentModeConfig } from '@/config/trading-mode';
import { isInNewsBlockWindow, DEFAULT_RISK_SETTINGS } from '@/lib/trading-protection';
import { webhookRateLimiter } from '@/lib/rate-limiter';

// GET - حالة النظام الكاملة
export async function GET(request: NextRequest) {
  try {
    // الحصول على IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // التحقق من rate limit
    const rateLimitCheck = webhookRateLimiter.check(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetIn: rateLimitCheck.resetIn },
        { status: 429 }
      );
    }

    // جلب جميع البيانات بالتوازي
    const [marketContext, performance, riskCheck] = await Promise.all([
      getRealMarketContext(),
      getPerformanceStats(),
      checkRiskLimits()
    ]);

    // حالة الأخبار
    const newsCheck = isInNewsBlockWindow();

    // آخر 10 إشارات
    const recentSignals = await db.signalLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        symbol: true,
        action: true,
        direction: true,
        price: true,
        status: true,
        strategy: true,
        createdAt: true,
        errorMessage: true
      }
    });

    // الصفقات المفتوحة
    const openTrades = await db.trade.findMany({
      where: {
        status: { in: ['OPEN', 'PENDING', 'FILLED'] }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        symbol: true,
        direction: true,
        quantity: true,
        entryPrice: true,
        stopLoss: true,
        takeProfit: true,
        pnl: true,
        trailingStopEnabled: true,
        trailingStopActivated: true,
        trailingStopPrice: true,
        createdAt: true,
        ibOrderId: true
      }
    });

    // إعدادات البوت
    const botSettings = await db.botSettings.findFirst();

    // معلومات الـ Mode
    const modeConfig = getCurrentModeConfig();

    // إحصائيات Rate Limiter
    const rateLimitStats = webhookRateLimiter.getStats();

    // الرد
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      
      // ═══════════════════════════════════════════════════════════════
      // 🤖 حالة النظام
      // ═══════════════════════════════════════════════════════════════
      system: {
        mode: MODE,
        modeDescription: modeConfig.description,
        allowRealTrades: modeConfig.allowRealTrades,
        ibConnected: ibService.isConnected(),
        newsBlocked: newsCheck.blocked,
        newsWindow: newsCheck.blocked ? newsCheck.window : null
      },

      // ═══════════════════════════════════════════════════════════════
      // 💰 بيانات الحساب الحقيقية
      // ═══════════════════════════════════════════════════════════════
      account: {
        balance: marketContext.accountBalance,
        dailyPnL: marketContext.dailyPnL,
        dailyPnLPercent: marketContext.accountBalance > 0 
          ? (marketContext.dailyPnL / marketContext.accountBalance) * 100 
          : 0,
        availableFunds: marketContext.ibAccountSummary?.availableFunds,
        buyingPower: marketContext.ibAccountSummary?.buyingPower,
        unrealizedPnL: marketContext.ibAccountSummary?.unrealizedPnL,
        ibData: marketContext.ibAccountSummary || null
      },

      // ═══════════════════════════════════════════════════════════════
      // 📊 إحصائيات الأداء
      // ═══════════════════════════════════════════════════════════════
      performance: {
        totalTrades: performance.totalTrades,
        openTrades: performance.openTrades,
        winRate: performance.winRate,
        totalPnL: performance.totalPnL,
        avgWin: performance.avgWin,
        avgLoss: performance.avgLoss,
        bestTrade: performance.bestTrade,
        worstTrade: performance.worstTrade,
        currentStreak: performance.currentStreak,
        today: marketContext.tradesInfo
      },

      // ═══════════════════════════════════════════════════════════════
      // ⚠️ المخاطر
      // ═══════════════════════════════════════════════════════════════
      risk: {
        withinLimits: riskCheck.withinLimits,
        warnings: riskCheck.warnings,
        dailyLossPercent: riskCheck.dailyLossPercent,
        maxDailyLossPercent: riskCheck.maxDailyLossPercent,
        maxOpenPositions: marketContext.maxOpenPositions,
        currentPositions: marketContext.openPositions,
        riskPerTrade: DEFAULT_RISK_SETTINGS.riskPerTrade,
        minRiskReward: DEFAULT_RISK_SETTINGS.minRiskReward
      },

      // ═══════════════════════════════════════════════════════════════
      // 📋 الصفقات المفتوحة
      // ═══════════════════════════════════════════════════════════════
      openTrades: openTrades.map(trade => ({
        ...trade,
        hasTrailingStop: trade.trailingStopEnabled,
        trailingActive: trade.trailingStopActivated
      })),

      // ═══════════════════════════════════════════════════════════════
      // 📩 آخر الإشارات
      // ═══════════════════════════════════════════════════════════════
      recentSignals: recentSignals,

      // ═══════════════════════════════════════════════════════════════
      // 🛡️ الحماية
      // ═══════════════════════════════════════════════════════════════
      protection: {
        rateLimit: rateLimitStats,
        signalCache: 'active',
        newsFilter: newsCheck.blocked ? 'BLOCKING' : 'PASSIVE',
        trendFilter: 'EMA_200'
      },

      // ═══════════════════════════════════════════════════════════════
      // ⚙️ إعدادات التداول
      // ═══════════════════════════════════════════════════════════════
      settings: {
        telegramEnabled: botSettings?.telegramEnabled || false,
        autoTradingEnabled: botSettings?.autoTradingEnabled || false,
        tradingMode: botSettings?.tradingMode || 'BALANCED',
        primarySymbol: botSettings?.primarySymbol || 'SPX'
      }
    });

  } catch (error) {
    console.error('[MONITORING] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ في جلب البيانات',
        message: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
