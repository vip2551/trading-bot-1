import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Start the bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let userId = body.userId;

    // If no userId, find admin user
    if (!userId || userId === 'demo') {
      const admin = await db.user.findFirst({
        where: { isAdmin: true }
      });
      if (admin) {
        userId = admin.id;
      } else {
        userId = 'demo';
      }
    }

    console.log('Starting bot for user:', userId);

    // Get or create settings
    let settings = await db.botSettings.findFirst({
      where: { userId },
    });

    if (!settings) {
      // Create settings for the user
      settings = await db.botSettings.create({
        data: { 
          userId, 
          isRunning: true,
          accountType: 'PAPER'
        },
      });
    } else {
      settings = await db.botSettings.update({
        where: { id: settings.id },
        data: { isRunning: true },
      });
    }

    // Get open trades
    let openTrades: any[] = [];
    try {
      openTrades = await db.trade.findMany({
        where: { userId, status: 'OPEN' },
      });
    } catch (e) {
      console.log('Could not fetch trades');
    }

    return NextResponse.json({ 
      success: true, 
      isRunning: true,
      settings: {
        isRunning: true,
        accountType: settings.accountType,
        ibConnected: settings.ibConnected || false
      },
      openTrades: openTrades.length,
      message: openTrades.length > 0 
        ? `Bot started. Found ${openTrades.length} open trades.` 
        : 'Bot started successfully',
    });
  } catch (error) {
    console.error('Error starting bot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to start bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
