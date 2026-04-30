import { NextRequest, NextResponse } from 'next/server';

// ✅ استخدم API حقيقي للأسعار
async function fetchRealPrice(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    // استخدم Alpha Vantage أو Yahoo Finance
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      console.error('ALPHA_VANTAGE_API_KEY not configured');
      return null;
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`,
      { next: { revalidate: 60 } } // تحديث كل دقيقة
    );

    const data = await response.json();
    
    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', ''))
      };
    }

    return null;
  } catch (error) {
    console.error('Fetch price error:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ 
      success: false, 
      error: 'Symbol required' 
    }, { status: 400 });
  }

  const priceData = await fetchRealPrice(symbol.toUpperCase());

  if (!priceData) {
    return NextResponse.json({
      success: false,
      error: 'Unable to fetch real price data',
      message: 'Configure ALPHA_VANTAGE_API_KEY in environment variables',
      symbol
    }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    symbol: symbol.toUpperCase(),
    ...priceData,
    timestamp: new Date().toISOString()
  });
}