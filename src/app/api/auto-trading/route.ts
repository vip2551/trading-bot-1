import { NextRequest, NextResponse } from 'next/server';
import { analyzeTrend } from '@/lib/bot/trend-filter';
import { checkExecution } from '@/lib/bot/execution-guard';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, prices, quantity, action } = body;

    // ✅ رفض البيانات الوهمية
    if (!prices || !Array.isArray(prices) || prices.length < 50) {
      return NextResponse.json({
        success: false,
        error: 'Real price data required',
        message: 'Minimum 50 data points required for analysis. Mock/random data is not accepted.',
        required: {
          prices: 'number[] - Array of closing prices (50+)',
          symbol: 'string - Trading symbol',
          action: 'buy | sell',
          quantity: 'number - Trade quantity'
        }
      }, { status: 400 });
    }

    // التحقق من البيانات المطلوبة
    if (!symbol || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: symbol, action'
      }, { status: 400 });
    }

    // التحقق من أن البيانات حقيقية (ليست كلها متطابقة)
    const uniquePrices = new Set(prices);
    if (uniquePrices.size < 10) {
      return NextResponse.json({
        success: false,
        error: 'Suspicious price data',
        message: 'Price data appears to be mock or generated. Real market data required.'
      }, { status: 400 });
    }

    // تحليل الاتجاه
    const trendAnalysis = analyzeTrend(prices);

    // التحقق من التنفيذ
    const executionCheck = checkExecution(symbol, quantity || 100);

    return NextResponse.json({
      success: true,
      symbol,
      action,
      trend: trendAnalysis,
      execution: executionCheck,
      canExecute: executionCheck.allowed && (
        (action === 'buy' && ['strong_buy', 'buy'].includes(trendAnalysis.recommendation)) ||
        (action === 'sell' && ['strong_sell', 'sell'].includes(trendAnalysis.recommendation))
      )
    });

  } catch (error) {
    console.error('Auto trading error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Auto Trading',
    message: 'POST request with real price data required',
    required: {
      symbol: 'string',
      action: 'buy | sell',
      prices: 'number[] (50+ data points)',
      quantity: 'number (optional)'
    },
    warning: 'Mock/random data will be rejected'
  });
}