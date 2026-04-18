import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * AI Trading Analysis API
 * تحليل التداول بالذكاء الاصطناعي
 */

// GET - Get AI recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo';
    const analysisType = searchParams.get('type') || 'general';

    // Get recent trades and settings
    let recentTrades: any[] = [];
    let settings: any = null;
    
    try {
      recentTrades = await db.trade.findMany({
        where: { userId },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      settings = await db.botSettings.findFirst();
    } catch {
      console.log('Database not available, using defaults');
    }

    // Calculate stats for AI context
    const closedTrades = recentTrades.filter(t => t.status === 'CLOSED');
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
    const totalPnL = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
    const winRate = closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0;

    // Generate analysis based on type
    let analysis = '';
    
    switch (analysisType) {
      case 'performance':
        analysis = generatePerformanceAnalysis(winRate, totalPnL, wins.length, losses.length, closedTrades.length);
        break;
      case 'market':
        analysis = generateMarketAnalysis(settings);
        break;
      case 'risk':
        analysis = generateRiskAnalysis(winRate, totalPnL, settings);
        break;
      default:
        analysis = generateGeneralAnalysis(winRate, totalPnL, wins.length, losses.length);
    }

    return NextResponse.json({
      success: true,
      analysis,
      analysisType,
      context: {
        totalTrades: recentTrades.length,
        winRate: winRate.toFixed(1),
        totalPnL: totalPnL.toFixed(2),
      },
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Get custom analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, question } = body;

    // Simple response generator
    const analysis = generateCustomResponse(question);

    return NextResponse.json({
      success: true,
      answer: analysis,
      question,
    });

  } catch (error) {
    console.error('AI Q&A error:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}

// Helper functions
function generatePerformanceAnalysis(winRate: number, totalPnL: number, wins: number, losses: number, total: number): string {
  const isArabic = true; // Default to Arabic
  
  let analysis = `## 📊 ${isArabic ? 'ملخص الأداء' : 'Performance Summary'}\n\n`;
  
  if (total === 0) {
    analysis += isArabic 
      ? 'لا توجد صفقات مغلقة بعد. ابدأ التداول لرؤية تحليل الأداء.\n'
      : 'No closed trades yet. Start trading to see performance analysis.\n';
    return analysis;
  }
  
  analysis += `- **${isArabic ? 'نسبة الفوز' : 'Win Rate'}**: ${winRate.toFixed(1)}%\n`;
  analysis += `- **${isArabic ? 'إجمالي الربح/الخسارة' : 'Total P&L'}**: $${totalPnL.toFixed(2)}\n`;
  analysis += `- **${isArabic ? 'الصفقات الرابحة' : 'Winning Trades'}**: ${wins}\n`;
  analysis += `- **${isArabic ? 'الصفقات الخاسرة' : 'Losing Trades'}**: ${losses}\n\n`;
  
  analysis += `### 💪 ${isArabic ? 'نقاط القوة' : 'Strengths'}\n`;
  if (winRate >= 60) {
    analysis += isArabic ? '- نسبة فوز ممتازة فوق 60%\n' : '- Excellent win rate above 60%\n';
  }
  if (totalPnL > 0) {
    analysis += isArabic ? '- ربحية إجمالية إيجابية\n' : '- Positive overall profitability\n';
  }
  
  analysis += `\n### 📈 ${isArabic ? 'توصيات' : 'Recommendations'}\n`;
  if (winRate < 50) {
    analysis += isArabic ? '- راجع استراتيجية الدخول والخروج\n' : '- Review entry and exit strategy\n';
  }
  analysis += isArabic ? '- حافظ على إدارة مخاطر صارمة\n' : '- Maintain strict risk management\n';
  analysis += isArabic ? '- وثّق جميع صفقاتك في يومية التداول\n' : '- Document all trades in your trading journal\n';
  
  return analysis;
}

function generateMarketAnalysis(settings: any): string {
  const isArabic = true;
  
  let analysis = `## 🌐 ${isArabic ? 'نظرة السوق' : 'Market Outlook'}\n\n`;
  
  analysis += `### 📊 ${isArabic ? 'معنويات السوق الحالية' : 'Current Market Sentiment'}\n`;
  analysis += isArabic ? '- **الاتجاه العام**: صعودي مع حذر\n' : '- **Overall Trend**: Cautiously Bullish\n';
  analysis += isArabic ? '- **التقلبات**: متوسطة\n' : '- **Volatility**: Moderate\n';
  analysis += isArabic ? '- **حجم التداول**: طبيعي\n' : '- **Volume**: Normal\n\n';
  
  analysis += `### 🎯 ${isArabic ? 'الاستراتيجيات الموصى بها' : 'Recommended Strategies'}\n`;
  analysis += isArabic ? '1. **SPX 0DTE**: ابحث عن فرص CALL عند الدعم\n' : '1. **SPX 0DTE**: Look for CALL opportunities at support\n';
  analysis += isArabic ? '2. **التحوط**: استخدم PUT كحماية\n' : '2. **Hedging**: Use PUTs for protection\n';
  analysis += isArabic ? '3. **إدارة المخاطر**: لا تخاطر بأكثر من 2% في الصفقة الواحدة\n' : '3. **Risk Management**: Risk no more than 2% per trade\n\n';
  
  analysis += `### ⚠️ ${isArabic ? 'مستويات مهمة للمراقبة' : 'Key Levels to Watch'}\n`;
  analysis += isArabic ? '- **مقاومة SPX**: 5100\n' : '- **SPX Resistance**: 5100\n';
  analysis += isArabic ? '- **دعم SPX**: 5050\n' : '- **SPX Support**: 5050\n';
  analysis += isArabic ? '- **VIX**: 15-18\n' : '- **VIX**: 15-18\n';
  
  return analysis;
}

function generateRiskAnalysis(winRate: number, totalPnL: number, settings: any): string {
  const isArabic = true;
  
  let analysis = `## 🛡️ ${isArabic ? 'تقييم المخاطر' : 'Risk Assessment'}\n\n`;
  
  // Calculate risk score
  let riskScore = 5;
  if (winRate >= 60) riskScore -= 1;
  if (winRate < 40) riskScore += 2;
  if (totalPnL > 0) riskScore -= 1;
  if (totalPnL < -500) riskScore += 1;
  riskScore = Math.max(1, Math.min(10, riskScore));
  
  analysis += `### 📊 ${isArabic ? 'درجة المخاطر' : 'Risk Score'}: ${riskScore}/10\n`;
  analysis += riskScore <= 3 
    ? (isArabic ? '**مخاطر منخفضة** ✅\n\n' : '**Low Risk** ✅\n\n')
    : riskScore <= 6 
    ? (isArabic ? '**مخاطر متوسطة** ⚠️\n\n' : '**Medium Risk** ⚠️\n\n')
    : (isArabic ? '**مخاطر عالية** 🔴\n\n' : '**High Risk** 🔴\n\n');
  
  analysis += `### 📋 ${isArabic ? 'قواعد إدارة المخاطر' : 'Risk Management Rules'}\n`;
  analysis += isArabic 
    ? '1. حدد وقف الخسارة قبل الدخول\n2. لا تزيد حجم المركز عن 5% من رأس المال\n3. استخدم نسبة مخاطرة/عائد 1:2 على الأقل\n4. تجنب المتاجرة أثناء الأخبار المهمة\n'
    : '1. Set stop loss before entry\n2. Keep position size under 5% of capital\n3. Use at least 1:2 risk/reward ratio\n4. Avoid trading during major news events\n';
  
  return analysis;
}

function generateGeneralAnalysis(winRate: number, totalPnL: number, wins: number, losses: number): string {
  const isArabic = true;
  
  let analysis = `## 🎯 ${isArabic ? 'التقييم العام' : 'Overall Assessment'}\n\n`;
  
  // Overall rating
  if (winRate >= 60 && totalPnL > 0) {
    analysis += isArabic ? '**أداء ممتاز! 🌟**\n\n' : '**Excellent Performance! 🌟**\n\n';
  } else if (winRate >= 50) {
    analysis += isArabic ? '**أداء جيد 👍**\n\n' : '**Good Performance 👍**\n\n';
  } else {
    analysis += isArabic ? '**يحتاج تحسين 📈**\n\n' : '**Needs Improvement 📈**\n\n';
  }
  
  analysis += `### ✅ ${isArabic ? 'ما تفعله جيداً' : 'What You\'re Doing Well'}\n`;
  if (wins > 0) {
    analysis += isArabic ? `- لديك ${wins} صفقات رابحة\n` : `- You have ${wins} winning trades\n`;
  }
  if (totalPnL > 0) {
    analysis += isArabic ? `- ربحية إجمالية موجبة\n` : `- Positive overall profit\n`;
  }
  
  analysis += `\n### 🔧 ${isArabic ? 'نصائح للتحسين' : 'Tips for Improvement'}\n`;
  analysis += isArabic 
    ? '- راجع صفقاتك الخاسرة لتجنب تكرار الأخطاء\n- حافظ على يومية تداول منظمة\n- اتبع خطة تداول واضحة\n'
    : '- Review losing trades to avoid repeating mistakes\n- Maintain an organized trading journal\n- Follow a clear trading plan\n';
  
  analysis += `\n### 💡 ${isArabic ? 'نصيحة اليوم' : 'Today\'s Tip'}\n`;
  analysis += isArabic 
    ? '> "الصبر والمثابرة هما مفتاح النجاح في التداول"\n'
    : '> "Patience and perseverance are the keys to trading success"\n';
  
  return analysis;
}

function generateCustomResponse(question: string): string {
  const isArabic = /[\u0600-\u06FF]/.test(question);
  
  // Simple keyword-based responses
  if (question.toLowerCase().includes('stop') || question.includes('وقف')) {
    return isArabic 
      ? '### 🛑 وقف الخسارة\n\nوقف الخسارة ضروري لحماية رأس المال. يُنصح بتحديده بنسبة 1-2% من رأس المال أو عند مستوى دعم/مقاومة واضح.'
      : '### 🛑 Stop Loss\n\nStop loss is essential for capital protection. It\'s recommended to set it at 1-2% of capital or at a clear support/resistance level.';
  }
  
  if (question.toLowerCase().includes('entry') || question.includes('دخول')) {
    return isArabic
      ? '### 🎯 نقطة الدخول\n\nأفضل نقاط الدخول تكون عند:\n- مستويات الدعم والمقاومة\n- تقاطع المؤشرات (RSI, MACD)\n- تأكيد الاتجاه'
      : '### 🎯 Entry Points\n\nBest entry points are at:\n- Support and resistance levels\n- Indicator crossovers (RSI, MACD)\n- Trend confirmation';
  }
  
  // Default response
  return isArabic
    ? '### 📊 تحليل التداول\n\nللحصول على أفضل النتائج:\n1. التزم بخطة التداول\n2. استخدم وقف الخسارة دائماً\n3. لا تتاجر بناءً على العواطف\n4. راجع أداءك بانتظام'
    : '### 📊 Trading Analysis\n\nFor best results:\n1. Stick to your trading plan\n2. Always use stop loss\n3. Don\'t trade based on emotions\n4. Review your performance regularly';
}
