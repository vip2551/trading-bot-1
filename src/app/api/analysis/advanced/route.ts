/**
 * Advanced Technical Analysis API
 * واجهة برمجة التطبيقات للتحليل الفني المتقدم
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateTradingSignal,
  analyzeTrend,
  detectExplosion,
  detectReversal,
  detectInstitutionalActivity,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateADX,
  calculateATR,
  type Candle,
  type TradingMode
} from '@/lib/advanced-indicators';

// Supported symbols
const SUPPORTED_SYMBOLS = ['SPX', 'SPY', 'QQQ', 'IWM', 'ES', 'NQ'];

// Simulated market data (in production, this would come from IB API)
function getSimulatedCandles(symbol: string, count: number = 100): Candle[] {
  const candles: Candle[] = [];
  let price = getBasePrice(symbol);
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const volatility = 0.002;
    const change = (Math.random() - 0.5) * 2 * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    candles.push({
      open,
      high,
      low,
      close,
      volume,
      timestamp: now - (count - i) * 60000 // 1-minute candles
    });
    
    price = close;
  }
  
  return candles;
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'SPX': 5200,
    'SPY': 520,
    'QQQ': 450,
    'IWM': 200,
    'ES': 5200,
    'NQ': 18500
  };
  return prices[symbol] || 100;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'SPX';
    const mode = (searchParams.get('mode') || 'BALANCED') as TradingMode;
    const analysisType = searchParams.get('type') || 'full';

    if (!SUPPORTED_SYMBOLS.includes(symbol)) {
      return NextResponse.json({
        success: false,
        error: `الرمز ${symbol} غير مدعوم. الرموز المدعومة: ${SUPPORTED_SYMBOLS.join(', ')}`
      }, { status: 400 });
    }

    // Get market data
    const candles = getSimulatedCandles(symbol, 100);
    const currentPrice = candles[candles.length - 1].close;

    // Perform analysis based on type
    let result: Record<string, unknown> = {
      symbol,
      currentPrice,
      timestamp: new Date().toISOString()
    };

    switch (analysisType) {
      case 'signal':
        result.signal = generateTradingSignal(candles, mode, currentPrice);
        break;
      
      case 'trend':
        result.trend = analyzeTrend(candles);
        break;
      
      case 'explosion':
        result.explosion = detectExplosion(candles);
        break;
      
      case 'reversal':
        result.reversal = detectReversal(candles);
        break;
      
      case 'institutional':
        result.institutional = detectInstitutionalActivity(candles);
        break;
      
      case 'indicators':
        result.indicators = {
          rsi: calculateRSI(candles),
          macd: calculateMACD(candles),
          bollinger: calculateBollingerBands(candles),
          adx: calculateADX(candles),
          atr: calculateATR(candles)
        };
        break;
      
      case 'full':
      default:
        result = {
          ...result,
          signal: generateTradingSignal(candles, mode, currentPrice),
          trend: analyzeTrend(candles),
          explosion: detectExplosion(candles),
          reversal: detectReversal(candles),
          institutional: detectInstitutionalActivity(candles),
          indicators: {
            rsi: calculateRSI(candles),
            macd: calculateMACD(candles),
            bollinger: calculateBollingerBands(candles),
            adx: calculateADX(candles),
            atr: calculateATR(candles)
          }
        };
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء التحليل'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      candles: inputCandles, 
      mode = 'BALANCED',
      analysisType = 'full'
    } = body;

    let candles: Candle[] = inputCandles;

    // If no candles provided, use simulated data
    if (!candles || candles.length === 0) {
      const symbol = body.symbol || 'SPX';
      candles = getSimulatedCandles(symbol, 100);
    }

    if (candles.length < 14) {
      return NextResponse.json({
        success: false,
        error: 'تحتاج على الأقل 14 شمعة للتحليل'
      }, { status: 400 });
    }

    const currentPrice = candles[candles.length - 1].close;
    let result: Record<string, unknown> = {
      currentPrice,
      timestamp: new Date().toISOString()
    };

    switch (analysisType) {
      case 'signal':
        result.signal = generateTradingSignal(candles, mode as TradingMode, currentPrice);
        break;
      
      case 'trend':
        result.trend = analyzeTrend(candles);
        break;
      
      case 'explosion':
        result.explosion = detectExplosion(candles);
        break;
      
      case 'reversal':
        result.reversal = detectReversal(candles);
        break;
      
      case 'institutional':
        result.institutional = detectInstitutionalActivity(candles);
        break;
      
      case 'indicators':
        result.indicators = {
          rsi: calculateRSI(candles),
          macd: calculateMACD(candles),
          bollinger: calculateBollingerBands(candles),
          adx: calculateADX(candles),
          atr: calculateATR(candles)
        };
        break;
      
      case 'full':
      default:
        result = {
          ...result,
          signal: generateTradingSignal(candles, mode as TradingMode, currentPrice),
          trend: analyzeTrend(candles),
          explosion: detectExplosion(candles),
          reversal: detectReversal(candles),
          institutional: detectInstitutionalActivity(candles),
          indicators: {
            rsi: calculateRSI(candles),
            macd: calculateMACD(candles),
            bollinger: calculateBollingerBands(candles),
            adx: calculateADX(candles),
            atr: calculateATR(candles)
          }
        };
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء التحليل'
    }, { status: 500 });
  }
}
