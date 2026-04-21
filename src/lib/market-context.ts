/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 MARKET CONTEXT - Real Data from IB & Database
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * جلب بيانات حقيقية:
 * - رصيد الحساب من IB
 * - P&L اليومي من قاعدة البيانات
 * - عدد الصفقات المفتوحة
 */

import { db } from './db';
import { ibService } from './ib-service';
import { MarketContext } from './trading-protection';

export interface RealMarketContext extends MarketContext {
  // بيانات IB الحقيقية
  ibAccountSummary?: {
    totalCashValue: number;
    availableFunds: number;
    buyingPower: number;
    netLiquidation: number;
    unrealizedPnL: number;
    realizedPnL: number;
  };
  
  // بيانات الصفقات
  tradesInfo?: {
    openCount: number;
    todayTrades: number;
    todayPnL: number;
    todayWins: number;
    todayLosses: number;
  };
  
  // حالة النظام
  systemStatus?: {
    ibConnected: boolean;
    mode: string;
    lastUpdate: Date;
  };
}

/**
 * جلب سياق السوق الحقيقي
 */
export async function getRealMarketContext(): Promise<RealMarketContext> {
  const context: RealMarketContext = {
    ibConnected: ibService.isConnected(),
    accountBalance: 100000, // قيمة افتراضية
    dailyPnL: 0,
    maxDailyLoss: 2,
    openPositions: 0,
    maxOpenPositions: 1,
    currentPrice: 0
  };

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. جلب بيانات الحساب من IB
    // ═══════════════════════════════════════════════════════════════
    if (ibService.isConnected()) {
      try {
        const accountSummary = await ibService.getAccountSummary();
        if (accountSummary) {
          context.ibAccountSummary = {
            totalCashValue: accountSummary.totalCashValue,
            availableFunds: accountSummary.availableFunds,
            buyingPower: accountSummary.buyingPower,
            netLiquidation: accountSummary.netLiquidation,
            unrealizedPnL: accountSummary.unrealizedPnL,
            realizedPnL: accountSummary.realizedPnL
          };
          context.accountBalance = accountSummary.netLiquidation || accountSummary.totalCashValue || 100000;
        }

        // جلب الصفقات المفتوحة من IB
        const positions = await ibService.getPositions();
        context.openPositions = positions.filter(p => p.position !== 0).length;
      } catch (ibError) {
        console.error('[MARKET-CONTEXT] IB error:', ibError);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. جلب بيانات الصفقات من قاعدة البيانات
    // ═══════════════════════════════════════════════════════════════
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // الصفقات المفتوحة
    const openTrades = await db.trade.count({
      where: {
        status: { in: ['OPEN', 'PENDING', 'FILLED'] }
      }
    });
    context.openPositions = openTrades;

    // صفقات اليوم
    const todayTrades = await db.trade.findMany({
      where: {
        createdAt: { gte: today }
      },
      select: {
        pnl: true,
        status: true
      }
    });

    const closedToday = todayTrades.filter(t => t.status === 'CLOSED');
    const todayPnL = closedToday.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const todayWins = closedToday.filter(t => (t.pnl || 0) > 0).length;
    const todayLosses = closedToday.filter(t => (t.pnl || 0) < 0).length;

    context.tradesInfo = {
      openCount: openTrades,
      todayTrades: todayTrades.length,
      todayPnL,
      todayWins,
      todayLosses
    };
    context.dailyPnL = todayPnL;

    // ═══════════════════════════════════════════════════════════════
    // 3. جلب إعدادات المخاطر
    // ═══════════════════════════════════════════════════════════════
    const botSettings = await db.botSettings.findFirst();
    if (botSettings) {
      context.maxDailyLoss = botSettings.maxDailyLoss || 2;
      context.maxOpenPositions = botSettings.maxOpenPositions || 1;
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. حالة النظام
    // ═══════════════════════════════════════════════════════════════
    context.systemStatus = {
      ibConnected: ibService.isConnected(),
      mode: process.env.TRADING_MODE || 'PAPER',
      lastUpdate: new Date()
    };

  } catch (error) {
    console.error('[MARKET-CONTEXT] Error:', error);
  }

  return context;
}

/**
 * حساب إحصائيات الأداء
 */
export async function getPerformanceStats(): Promise<{
  totalTrades: number;
  openTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
}> {
  const trades = await db.trade.findMany({
    where: { status: 'CLOSED' },
    select: { pnl: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  const wins = trades.filter(t => (t.pnl || 0) > 0);
  const losses = trades.filter(t => (t.pnl || 0) < 0);
  
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length) : 0;
  const bestTrade = Math.max(...trades.map(t => t.pnl || 0), 0);
  const worstTrade = Math.min(...trades.map(t => t.pnl || 0), 0);

  // حساب السلسلة الحالية
  let currentStreak = 0;
  for (const trade of trades) {
    if ((trade.pnl || 0) > 0 && currentStreak >= 0) {
      currentStreak++;
    } else if ((trade.pnl || 0) < 0 && currentStreak <= 0) {
      currentStreak--;
    } else {
      break;
    }
  }

  const openTrades = await db.trade.count({
    where: { status: { in: ['OPEN', 'PENDING', 'FILLED'] } }
  });

  return {
    totalTrades: trades.length,
    openTrades,
    winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
    totalPnL,
    avgWin,
    avgLoss,
    bestTrade,
    worstTrade,
    currentStreak
  };
}

/**
 * التحقق من حدود المخاطر
 */
export async function checkRiskLimits(): Promise<{
  withinLimits: boolean;
  warnings: string[];
  dailyLossPercent: number;
  maxDailyLossPercent: number;
}> {
  const context = await getRealMarketContext();
  const warnings: string[] = [];
  
  const dailyLossPercent = context.dailyPnL < 0 
    ? Math.abs(context.dailyPnL) / context.accountBalance * 100 
    : 0;
  const maxDailyLossPercent = context.maxDailyLoss;

  if (dailyLossPercent >= maxDailyLossPercent) {
    warnings.push(`🚨 حد الخسارة اليومية: ${dailyLossPercent.toFixed(1)}% >= ${maxDailyLossPercent}%`);
  } else if (dailyLossPercent >= maxDailyLossPercent * 0.7) {
    warnings.push(`⚠️ اقتراب من حد الخسارة: ${dailyLossPercent.toFixed(1)}%`);
  }

  if (context.openPositions >= context.maxOpenPositions) {
    warnings.push(`⚠️ الحد الأقصى للصفقات: ${context.openPositions}/${context.maxOpenPositions}`);
  }

  return {
    withinLimits: warnings.filter(w => w.startsWith('🚨')).length === 0,
    warnings,
    dailyLossPercent,
    maxDailyLossPercent
  };
}

export default {
  getRealMarketContext,
  getPerformanceStats,
  checkRiskLimits
};
