import { NextRequest, NextResponse } from 'next/server';
import { analyzeTrend } from '@/lib/bot/trend-filter';
import { checkExecution } from '@/lib/bot/execution-guard';
import { isMarketOpen, getMarketSession } from '@/lib/timezone';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, prices, quantity, action } = body;

    // ✅ رفض البيانات الوهمية
    if (!prices || !Array.isArray(prices) || prices.length < 50) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: 'Real price data required (50+ data points)',
        message: 'This endpoint does not accept mock or random data'
      }, { status: 400 });
    }

    // التحقق من ساعات التداول
    const marketOpen = isMarketOpen();
    const session = getMarketSession();

    if (!marketOpen) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: `Market closed - Current session: ${session}`,
        canSchedule: session === 'pre-market'
      }, { status: 403 });
    }

    // التحقق من التنفيذ
    const executionCheck = checkExecution(symbol, quantity || 100);

    if (!executionCheck.allowed) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: executionCheck.reason,
        session: executionCheck.session
      }, { status: 403 });
    }

    // تحليل الاتجاه
    const trendAnalysis = analyzeTrend(prices);

    // التحقق من التوافق
    const isActionCompatible = action === 'buy' 
      ? ['strong_buy', 'buy'].includes(trendAnalysis.recommendation)
      : ['strong_sell', 'sell'].includes(trendAnalysis.recommendation);

    return NextResponse.json({
      success: true,
      verified: isActionCompatible && executionCheck.allowed,
      symbol,
      action,
      trend: trendAnalysis,
      execution: executionCheck,
      session,
      warnings: [
        !isActionCompatible ? `Trend analysis suggests ${trendAnalysis.recommendation}, not ${action}` : null,
        trendAnalysis.confidence < 50 ? 'Low confidence in trend analysis' : null
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('Trade verify error:', error);
    return NextResponse.json({
      success: false,
      verified: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}