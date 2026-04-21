import { NextRequest, NextResponse } from 'next/server';
import { generateTradingSignal, quickAnalysis, DEFAULT_CONFIG, StrategyConfig } from '@/lib/strategy-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 SMART ANALYSIS API - Real Market Data + Advanced Strategy
// ═══════════════════════════════════════════════════════════════════════════════

// GET - Quick analysis for single symbol
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const mode = searchParams.get('mode') || 'quick'; // 'quick' or 'full'
  
  if (!symbol) {
    return NextResponse.json({
      success: false,
      error: 'symbol مطلوب',
      usage: '/api/smart-analysis?symbol=SPX&mode=quick'
    }, { status: 400 });
  }
  
  try {
    if (mode === 'full') {
      // Full analysis with all indicators
      const signal = await generateTradingSignal(symbol.toUpperCase(), DEFAULT_CONFIG);
      
      if (!signal) {
        return NextResponse.json({
          success: false,
          error: 'لا توجد بيانات كافية للتحليل',
          symbol,
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: signal,
        summary: {
          signal: signal.signal,
          direction: signal.direction,
          confidence: signal.confidence,
          confirmations: signal.confirmationCount,
          riskReward: signal.riskRewardRatio.toFixed(2),
          isReal: signal.isReal,
        }
      });
    } else {
      // Quick analysis
      const analysis = await quickAnalysis(symbol.toUpperCase());
      
      return NextResponse.json({
        success: true,
        symbol: symbol.toUpperCase(),
        ...analysis,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء التحليل',
      details: (error as Error).message
    }, { status: 500 });
  }
}

// POST - Batch analysis for multiple symbols
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symbols = body.symbols || [];
    const mode = body.mode || 'quick';
    
    if (!symbols.length) {
      return NextResponse.json({
        success: false,
        error: 'symbols مطلوب (array)',
        usage: { symbols: ['SPX', 'AAPL', 'TSLA'], mode: 'quick' }
      }, { status: 400 });
    }
    
    const results = await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          if (mode === 'full') {
            const signal = await generateTradingSignal(symbol.toUpperCase());
            return signal ? { symbol, ...signal } : { symbol, error: 'لا توجد بيانات' };
          } else {
            const analysis = await quickAnalysis(symbol.toUpperCase());
            return { symbol, ...analysis };
          }
        } catch (e) {
          return { symbol, error: (e as Error).message };
        }
      })
    );
    
    // Summary
    const strongBuys = results.filter(r => r.signal === 'STRONG_BUY').length;
    const buys = results.filter(r => r.signal === 'BUY').length;
    const holds = results.filter(r => r.signal === 'HOLD').length;
    const sells = results.filter(r => r.signal === 'SELL').length;
    const strongSells = results.filter(r => r.signal === 'STRONG_SELL').length;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: symbols.length,
        strongBuys,
        buys,
        holds,
        sells,
        strongSells,
      },
      results,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء التحليل',
      details: (error as Error).message
    }, { status: 500 });
  }
}
