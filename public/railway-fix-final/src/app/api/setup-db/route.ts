import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Creating database tables...');
    
    // Create User table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" TEXT UNIQUE,
        "name" TEXT,
        "password" TEXT,
        "image" TEXT,
        "isAdmin" BOOLEAN DEFAULT false,
        "emailVerified" BOOLEAN DEFAULT false,
        "emailVerifiedAt" TIMESTAMP,
        "verificationToken" TEXT,
        "verificationExpires" TIMESTAMP,
        "resetToken" TEXT,
        "resetExpires" TIMESTAMP,
        "twoFactorEnabled" BOOLEAN DEFAULT false,
        "twoFactorSecret" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('User table created');
    
    // Create Plan table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Plan" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT UNIQUE,
        "displayName" TEXT,
        "displayNameEn" TEXT,
        "description" TEXT,
        "priceMonthly" FLOAT DEFAULT 0,
        "priceYearly" FLOAT DEFAULT 0,
        "maxTradesPerDay" INTEGER DEFAULT 5,
        "maxActiveTrades" INTEGER DEFAULT 2,
        "trialDays" INTEGER DEFAULT 0,
        "features" TEXT,
        "featuresAr" TEXT,
        "isPopular" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "sortOrder" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Plan table created');
    
    // Create Subscription table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT UNIQUE,
        "planId" TEXT,
        "planName" TEXT DEFAULT 'TRIAL',
        "status" TEXT DEFAULT 'ACTIVE',
        "isTrial" BOOLEAN DEFAULT false,
        "trialEndsAt" TIMESTAMP,
        "maxTradesPerDay" INTEGER DEFAULT 5,
        "maxActiveTrades" INTEGER DEFAULT 2,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Subscription table created');
    
    // Create BotSettings table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BotSettings" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT UNIQUE,
        "isRunning" BOOLEAN DEFAULT false,
        "accountType" TEXT DEFAULT 'PAPER',
        "ibHost" TEXT DEFAULT '127.0.0.1',
        "ibPort" INTEGER DEFAULT 7497,
        "ibClientId" INTEGER DEFAULT 1,
        "ibConnected" BOOLEAN DEFAULT false,
        "defaultQuantity" INTEGER DEFAULT 1,
        "maxRiskPerTrade" FLOAT DEFAULT 100,
        "telegramBotToken" TEXT,
        "telegramChatId" TEXT,
        "telegramEnabled" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('BotSettings table created');
    
    // Create NotificationSettings table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationSettings" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT UNIQUE,
        "telegramEnabled" BOOLEAN DEFAULT false,
        "telegramBotToken" TEXT,
        "telegramChatId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('NotificationSettings table created');
    
    // Create Trade table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Trade" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT,
        "symbol" TEXT,
        "instrumentType" TEXT,
        "direction" TEXT,
        "quantity" INTEGER,
        "entryPrice" FLOAT,
        "exitPrice" FLOAT,
        "status" TEXT DEFAULT 'PENDING',
        "pnl" FLOAT,
        "stopLoss" FLOAT,
        "takeProfit" FLOAT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Trade table created');
    
    // Create TradingViewSignal table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TradingViewSignal" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT,
        "symbol" TEXT,
        "action" TEXT,
        "strategy" TEXT,
        "price" FLOAT,
        "quantity" INTEGER,
        "processed" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('TradingViewSignal table created');
    
    // Create SignalLog table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SignalLog" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "source" TEXT DEFAULT 'TRADINGVIEW',
        "symbol" TEXT,
        "action" TEXT,
        "status" TEXT DEFAULT 'RECEIVED',
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('SignalLog table created');
    
    // Create WebhookSecret table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WebhookSecret" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "secret" TEXT UNIQUE,
        "active" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('WebhookSecret table created');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All database tables created successfully!',
      tables: ['User', 'Plan', 'Subscription', 'BotSettings', 'NotificationSettings', 'Trade', 'TradingViewSignal', 'SignalLog', 'WebhookSecret']
    });
    
  } catch (error) {
    console.error('Create tables error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if tables exist
    const result = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    return NextResponse.json({ 
      success: true,
      tables: result,
      message: 'Send POST request to create tables'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
