// Smart Analysis API
// واجهة برمجة التحليل الذكي الكامل

import { NextRequest, NextResponse } from 'next/server';
import { 
  performFullAnalysis, 
  detectExplosion, 
  analyzeTrend,
  findSupplyDemandZones,
  findSupportResistance,
  analyzeVolume,
  Candle 
} from '@/lib/indicators';

// Mock data generator for testing (will be replaced with IB API data)
function generateMockCandles(symbol: string, count: number = 100): Candle[] {
  const candles: Candle[] = [];
  let price = symbol === 'SPX' ? 5400 : symbol === 'SPY' ? 540 : 100;
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 20;
    const open = price;
    price += change;
    const high = Math.max(open, price) + Math.random() * 5;
    const low = Math.min(open, price) - Math.random() * 5;
    const volume = Math.floor(Math.random() * 10000) + 1000;
    
    candles.push({
      open,
      high,
      low,
      close: price,
      volume,
      timestamp: Date.now() - (count - i) * 60000
    });
  }
  
  return candles;
}

// Get real data from IB (placeholder - will be implemented with IB API)
async function getRealData(symbol: string): Promise<Candle[] | null> {
  // For now, return mock data
  // TODO: Implement IB API data fetching
  return generateMockCandles(symbol);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'SPX';
    const action = searchParams.get('action') || 'full';

    // Get candle data
    const candles = await getRealData(symbol);
    
    if (!candles || candles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data available'
      }, { status: 400 });
    }

    const lastCandle = candles[candles.length - 1];
    const lastPrice = lastCandle.close;

    switch (action) {
      case 'full': {
        // Full analysis
        const analysis = performFullAnalysis(candles);
        const explosion = detectExplosion(candles);
        const trend = analyzeTrend(candles);
        const supplyDemand = findSupplyDemandZones(candles);
        const supportResistance = findSupportResistance(candles);
        const volume = analyzeVolume(candles.map(c => c.volume));

        return NextResponse.json({
          success: true,
          symbol,
          price: lastPrice,
          timestamp: Date.now(),
          analysis,
          explosion,
          trend,
          supplyDemand,
          supportResistance,
          volume,
          candle: {
            open: lastCandle.open,
            high: lastCandle.high,
            low: lastCandle.low,
            close: lastCandle.close,
            volume: lastCandle.volume
          }
        });
      }

      case 'indicators': {
        const analysis = performFullAnalysis(candles);
        return NextResponse.json({
          success: true,
          symbol,
          price: lastPrice,
          indicators: {
            rsi: analysis.rsi,
            macd: analysis.macd,
            ema: analysis.ema,
            bollinger: analysis.bollinger
          },
          overall: analysis.overall
        });
      }

      case 'explosion': {
        const explosion = detectExplosion(candles);
        return NextResponse.json({
          success: true,
          symbol,
          price: lastPrice,
          explosion
        });
      }

      case 'trend': {
        const trend = analyzeTrend(candles);
        return NextResponse.json({
          success: true,
          symbol,
          price: lastPrice,
          trend
        });
      }

      case 'zones': {
        const supplyDemand = findSupplyDemandZones(candles);
        const supportResistance = findSupportResistance(candles);
        return NextResponse.json({
          success: true,
          symbol,
          price: lastPrice,
          supplyDemand,
          supportResistance
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Smart analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed'
    }, { status: 500 });
  }
}

// POST for trading signal processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      symbol, 
      signal, 
      direction, 
      price,
      confidence: incomingConfidence,
      userId 
    } = body;

    if (!symbol || !signal) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Get current market data
    const candles = await getRealData(symbol);
    
    if (!candles || candles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No market data available'
      }, { status: 400 });
    }

    // Perform analysis to verify/enhance signal
    const analysis = performFullAnalysis(candles);
    const explosion = detectExplosion(candles);
    const trend = analyzeTrend(candles);

    // Determine final direction if not provided
    let finalDirection = direction;
    let finalConfidence = incomingConfidence || 50;

    if (!finalDirection) {
      // Use analysis to determine direction
      if (analysis.overall.direction !== 'NEUTRAL') {
        finalDirection = analysis.overall.direction;
        finalConfidence = Math.max(finalConfidence, analysis.overall.confidence);
      } else if (explosion.detected && explosion.direction !== 'NEUTRAL') {
        finalDirection = explosion.direction;
        finalConfidence = Math.max(finalConfidence, explosion.confidence);
      } else if (trend.direction !== 'NEUTRAL') {
        // Convert trend direction to option direction
        finalDirection = trend.direction === 'BULLISH' ? 'CALL' : 'PUT';
        finalConfidence = Math.max(finalConfidence, trend.strength);
      }
    }

    // Enhance confidence based on confluence
    const confluenceFactors: string[] = [];
    let confluenceBonus = 0;

    // Check if analysis agrees
    if (analysis.overall.direction === finalDirection) {
      confluenceFactors.push('تحليل المؤشرات متوافق');
      confluenceBonus += 10;
    }

    // Check if explosion detected in same direction
    if (explosion.detected && explosion.direction === finalDirection) {
      confluenceFactors.push('انفجار سعري متوقع');
      confluenceBonus += 15;
    }

    // Check trend alignment
    const trendDirection = trend.direction === 'BULLISH' ? 'CALL' : 'PUT';
    if (trend.isStrong && trendDirection === finalDirection) {
      confluenceFactors.push('اتجاه قوي متوافق');
      confluenceBonus += 10;
    }

    finalConfidence = Math.min(95, finalConfidence + confluenceBonus);

    // Calculate suggested strike
    const lastPrice = candles[candles.length - 1].close;
    const suggestedStrike = calculateStrike(lastPrice, finalDirection);

    return NextResponse.json({
      success: true,
      symbol,
      signal,
      direction: finalDirection,
      confidence: finalConfidence,
      suggestedStrike,
      currentPrice: lastPrice,
      confluence: confluenceFactors,
      analysis: {
        indicators: analysis.overall,
        explosion: explosion.detected ? explosion : null,
        trend: {
          direction: trend.direction,
          strength: trend.strength,
          isStrong: trend.isStrong
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Signal processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Signal processing failed'
    }, { status: 500 });
  }
}

// Calculate strike based on ATM
function calculateStrike(currentPrice: number, direction: string): number {
  // Round to nearest 5 for SPX
  const atm = Math.round(currentPrice / 5) * 5;
  
  // Add offset based on direction (default +5 for CALL, -5 for PUT)
  const offset = 5;
  
  if (direction === 'CALL') {
    return atm + offset;
  } else {
    return atm - offset;
  }
}
