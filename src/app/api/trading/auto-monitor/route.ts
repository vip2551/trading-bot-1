import { NextRequest, NextResponse } from 'next/server';
import { isMarketOpen, getMarketSession, getMarketTime } from '@/lib/timezone';

export async function GET(req: NextRequest) {
  try {
    const marketOpen = isMarketOpen();
    const session = getMarketSession();
    const marketTime = getMarketTime();

    return NextResponse.json({
      success: true,
      marketStatus: {
        isOpen: marketOpen,
        session,
        marketTime: marketTime.toFormat('yyyy-MM-dd HH:mm:ss'),
        timezone: 'America/New_York'
      },
      message: marketOpen 
        ? 'Market is open for trading' 
        : `Market is closed (${session})`
    });

  } catch (error) {
    console.error('Auto monitor error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, prices, position, stopLoss, takeProfit } = body;

    // ✅ رفض البيانات الوهمية
    if (!prices || !Array.isArray(prices) || prices.length < 20) {
      return NextResponse.json({
        success: false,
        error: 'Real price data required (20+ data points)',
        message: 'Mock/random data is not accepted for monitoring'
      }, { status: 400 });
    }

    if (!position || !symbol) {
      return NextResponse.json({
        success: false,
        error: 'Position and symbol required'
      }, { status: 400 });
    }

    const currentPrice = prices[prices.length - 1];
    const entryPrice = position.entryPrice;
    const pnl = position.quantity * (currentPrice - entryPrice);
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

    // التحقق من Stop Loss و Take Profit
    let shouldClose = false;
    let closeReason = '';

    if (stopLoss && currentPrice <= stopLoss) {
      shouldClose = true;
      closeReason = 'Stop loss triggered';
    } else if (takeProfit && currentPrice >= takeProfit) {
      shouldClose = true;
      closeReason = 'Take profit triggered';
    }

    return NextResponse.json({
      success: true,
      symbol,
      currentPrice,
      position: {
        ...position,
        pnl,
        pnlPercent
      },
      shouldClose,
      closeReason,
      stopLoss,
      takeProfit
    });

  } catch (error) {
    console.error('Auto monitor POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}