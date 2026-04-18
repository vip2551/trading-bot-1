import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Stop the bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let userId = body.userId;

    // If no userId or demo, find admin
    if (!userId || userId === 'demo') {
      const admin = await db.user.findFirst({
        where: { isAdmin: true }
      });
      if (admin) userId = admin.id;
    }

    console.log('Stopping bot for user:', userId);

    let settings = await db.botSettings.findFirst({
      where: { userId },
    });

    if (settings) {
      await db.botSettings.update({
        where: { id: settings.id },
        data: { isRunning: false, ibConnected: false },
      });
    }

    return NextResponse.json({ 
      success: true, 
      isRunning: false,
      message: 'Bot stopped successfully',
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to stop bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
