/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎯 TRAILING STOP ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * وقف متحرك ذكي:
 * - تفعيل بعد تحقيق ربح 1R
 * - تحريك الوقف خلف السعر
 * - قفل الأرباح تدريجياً
 */

import { db } from './db';

export interface TrailingStopConfig {
  // نسبة التفعيل (من R)
  activationPercent: number;      // 100% = تفعيل عند 1R
  
  // المسافة خلف السعر
  trailPercent: number;           // 0.5 = 0.5% خلف السعر
  
  // حد أدنى للربح المحفوظ
  minProfitLockPercent: number;   // 50% = حفظ 50% من الربح على الأقل
  
  // تحريك تدريجي
  stepPercent: number;            // 0.1 = تحريك 0.1% كل مرة
}

export const DEFAULT_TRAILING_CONFIG: TrailingStopConfig = {
  activationPercent: 100,    // تفعيل عند 1R
  trailPercent: 0.5,         // 0.5% خلف السعر
  minProfitLockPercent: 50,  // حفظ 50% من الربح
  stepPercent: 0.1           // خطوات صغيرة
};

export interface TrailingStopResult {
  shouldUpdate: boolean;
  newStopPrice: number;
  reason: string;
  profitLocked: number;
  activationTriggered: boolean;
}

/**
 * حساب وقف الخسارة المتحرك
 */
export function calculateTrailingStop(params: {
  entryPrice: number;
  currentPrice: number;
  currentStopPrice: number;
  direction: 'LONG' | 'SHORT';
  highestPrice: number;
  lowestPrice: number;
  initialRisk: number;  // المسافة من الدخول للوقف الأولي
  config?: Partial<TrailingStopConfig>;
}): TrailingStopResult {
  const {
    entryPrice,
    currentPrice,
    currentStopPrice,
    direction,
    highestPrice,
    lowestPrice,
    initialRisk,
    config: userConfig
  } = params;

  const config = { ...DEFAULT_TRAILING_CONFIG, ...userConfig };
  const isLong = direction === 'LONG';

  // حساب الربح الحالي (بالنسبة للمخاطرة)
  const currentProfit = isLong 
    ? currentPrice - entryPrice 
    : entryPrice - currentPrice;
  const profitInR = initialRisk > 0 ? currentProfit / initialRisk : 0;
  const profitPercent = isLong
    ? ((currentPrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - currentPrice) / entryPrice) * 100;

  // التحقق من تفعيل الوقف المتحرك
  const activationTriggered = profitInR * 100 >= config.activationPercent;

  if (!activationTriggered) {
    return {
      shouldUpdate: false,
      newStopPrice: currentStopPrice,
      reason: `لم يتم التفعيل بعد: ${profitInR.toFixed(2)}R < ${config.activationPercent / 100}R`,
      profitLocked: 0,
      activationTriggered: false
    };
  }

  // حساب الوقف الجديد
  let newStopPrice: number;
  let trailDistance: number;

  if (isLong) {
    // للصفقات الطويلة: الوقف خلف السعر الأعلى
    trailDistance = highestPrice * (config.trailPercent / 100);
    newStopPrice = highestPrice - trailDistance;
    
    // التأكد من أن الوقف الجديد أعلى من الحالي
    if (newStopPrice <= currentStopPrice) {
      return {
        shouldUpdate: false,
        newStopPrice: currentStopPrice,
        reason: 'الوقف الجديد ليس أفضل',
        profitLocked: Math.max(0, currentStopPrice - entryPrice),
        activationTriggered: true
      };
    }
  } else {
    // للصفقات القصيرة: الوقف خلف السعر الأدنى
    trailDistance = lowestPrice * (config.trailPercent / 100);
    newStopPrice = lowestPrice + trailDistance;
    
    // التأكد من أن الوقف الجديد أقل من الحالي
    if (newStopPrice >= currentStopPrice) {
      return {
        shouldUpdate: false,
        newStopPrice: currentStopPrice,
        reason: 'الوقف الجديد ليس أفضل',
        profitLocked: Math.max(0, entryPrice - currentStopPrice),
        activationTriggered: true
      };
    }
  }

  // التأكد من حفظ الحد الأدنى من الربح
  const potentialProfitLocked = isLong 
    ? newStopPrice - entryPrice 
    : entryPrice - newStopPrice;
  const minProfitLock = currentProfit * (config.minProfitLockPercent / 100);

  if (potentialProfitLocked < minProfitLock) {
    // تعديل الوقف لحفظ الحد الأدنى
    newStopPrice = isLong 
      ? entryPrice + minProfitLock 
      : entryPrice - minProfitLock;
  }

  const profitLocked = isLong 
    ? newStopPrice - entryPrice 
    : entryPrice - newStopPrice;

  return {
    shouldUpdate: true,
    newStopPrice,
    reason: `وقف متحرك: ${isLong ? '↑' : '↓'} ${newStopPrice.toFixed(2)} (ربح محفوظ: $${profitLocked.toFixed(2)})`,
    profitLocked,
    activationTriggered: true
  };
}

/**
 * تحديث صفقة مع وقف متحرك
 */
export async function updateTrailingStopForTrade(
  tradeId: string,
  currentPrice: number
): Promise<TrailingStopResult | null> {
  try {
    const trade = await db.trade.findUnique({
      where: { id: tradeId }
    });

    if (!trade || !trade.trailingStopEnabled || trade.status !== 'OPEN') {
      return null;
    }

    // تحديث أعلى/أدنى سعر
    let highestPrice = trade.trailingStopActivated 
      ? Math.max(trade.entryPrice, currentPrice) 
      : currentPrice;
    let lowestPrice = trade.trailingStopActivated 
      ? Math.min(trade.entryPrice, currentPrice) 
      : currentPrice;

    const direction = ['LONG', 'CALL', 'BUY'].includes(trade.direction) ? 'LONG' : 'SHORT';
    const initialRisk = trade.stopLoss 
      ? Math.abs(trade.entryPrice - trade.stopLoss) 
      : trade.entryPrice * 0.01;

    const result = calculateTrailingStop({
      entryPrice: trade.entryPrice,
      currentPrice,
      currentStopPrice: trade.stopLoss || trade.entryPrice,
      direction,
      highestPrice,
      lowestPrice,
      initialRisk,
      config: {
        trailPercent: trade.trailingStopPercent || 0.5,
        activationPercent: 100
      }
    });

    // تحديث قاعدة البيانات
    if (result.shouldUpdate) {
      await db.trade.update({
        where: { id: tradeId },
        data: {
          stopLoss: result.newStopPrice,
          trailingStopActivated: true,
          trailingStopPrice: result.newStopPrice,
          maxProfit: Math.max(trade.maxProfit || 0, currentPrice - trade.entryPrice)
        }
      });

      console.log(`[TRAILING-STOP] ✅ Updated for ${trade.symbol}: ${result.newStopPrice.toFixed(2)}`);
    }

    return result;
  } catch (error) {
    console.error('[TRAILING-STOP] Error:', error);
    return null;
  }
}

/**
 * فحص جميع الصفقات المفتوحة للوقف المتحرك
 */
export async function checkAllTrailingStops(
  priceProvider: (symbol: string) => Promise<number | null>
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    const openTrades = await db.trade.findMany({
      where: {
        status: 'OPEN',
        trailingStopEnabled: true
      }
    });

    for (const trade of openTrades) {
      try {
        const currentPrice = await priceProvider(trade.symbol);
        if (currentPrice) {
          const result = await updateTrailingStopForTrade(trade.id, currentPrice);
          if (result?.shouldUpdate) {
            updated++;
          }
        }
      } catch (err) {
        errors.push(`${trade.symbol}: ${(err as Error).message}`);
      }
    }
  } catch (error) {
    errors.push(`Database error: ${(error as Error).message}`);
  }

  return { updated, errors };
}

export default {
  calculateTrailingStop,
  updateTrailingStopForTrade,
  checkAllTrailingStops,
  DEFAULT_TRAILING_CONFIG
};
