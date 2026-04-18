import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ibService } from '@/lib/ib-service';

// POST - Disconnect from IB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('[IB Disconnect] Disconnecting...');

    // Disconnect from IB service (real connection)
    try {
      await ibService.disconnect();
    } catch (e) {
      console.log('[IB Disconnect] No real connection to disconnect');
    }

    // Update database - mark as disconnected and stop bot
    const settings = await db.botSettings.findFirst();
    if (settings) {
      await db.botSettings.update({
        where: { id: settings.id },
        data: { 
          ibConnected: false,
          isRunning: false,
          // Keep accountType as is, just disconnect
        }
      });
    }

    console.log('[IB Disconnect] Disconnected successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'تم قطع الاتصال بنجاح',
      connected: false
    });
  } catch (error: any) {
    console.error('IB Disconnect Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Disconnect failed' 
    }, { status: 500 });
  }
}
