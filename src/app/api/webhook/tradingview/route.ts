import { NextRequest, NextResponse } from 'next/server';

// ✅ Redirect إلى المسار الرسمي
export async function POST(req: NextRequest) {
  // إعادة توجيه إلى المسار الرسمي
  const url = new URL('/api/tradingview/webhook', req.url);
  return NextResponse.rewrite(url);
}

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint is deprecated',
    useInstead: '/api/tradingview/webhook'
  }, { status: 410 });
}