import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

// Simple password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

// POST - Initialize admin account (run once)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, setupKey } = body;

    // Security: require a setup key
    const validSetupKey = process.env.ADMIN_SETUP_KEY || 'trading-bot-admin-2024';
    
    if (setupKey !== validSetupKey) {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 });
    }

    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { isAdmin: true }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        error: 'Admin already exists',
        adminEmail: existingAdmin.email,
        message: 'Please use the existing admin account or delete it first.'
      }, { status: 400 });
    }

    // Create admin user
    const adminEmail = email || 'admin@tradingbot.com';
    const adminPassword = password || 'Admin@123456';

    const admin = await db.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        password: hashPassword(adminPassword),
        isAdmin: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        subscription: {
          create: {
            planName: 'ENTERPRISE',
            status: 'ACTIVE',
            isTrial: false,
            maxTradesPerDay: -1, // Unlimited
            maxActiveTrades: -1, // Unlimited
          }
        },
        botSettings: {
          create: {
            isRunning: false,
            accountType: 'PAPER',
          }
        },
        notificationSettings: {
          create: {}
        }
      },
      include: {
        subscription: true
      }
    });

    // Also seed default plans if they don't exist
    const existingPlans = await db.plan.count();
    
    if (existingPlans === 0) {
      await db.plan.createMany({
        data: [
          {
            name: 'TRIAL',
            displayName: 'Free Trial',
            displayNameEn: 'Free Trial',
            description: 'Try all features free for 7 days',
            priceMonthly: 0,
            priceYearly: 0,
            maxTradesPerDay: 5,
            maxActiveTrades: 2,
            trialDays: 7,
            features: JSON.stringify(['basic_signals', 'telegram_notifications', 'simulation_mode']),
            featuresAr: JSON.stringify(['إشارات أساسية', 'إشعارات تيليجرام', 'وضع المحاكاة']),
            isPopular: false,
            sortOrder: 0,
          },
          {
            name: 'BASIC',
            displayName: 'Basic',
            displayNameEn: 'Basic',
            description: 'Perfect for getting started',
            priceMonthly: 29,
            priceYearly: 278,
            originalPriceMonthly: 29,
            originalPriceYearly: 348,
            maxTradesPerDay: 20,
            maxActiveTrades: 5,
            trialDays: 0,
            features: JSON.stringify(['trailing_stop', 'bracket_orders', 'telegram_notifications', 'paper_trading']),
            featuresAr: JSON.stringify(['وقف متحرك', 'أوامر محيطية', 'إشعارات تيليجرام', 'تداول تجريبي']),
            hasTelegramNotif: true,
            hasPaperTrading: true,
            isPopular: false,
            sortOrder: 1,
          },
          {
            name: 'PRO',
            displayName: 'Pro',
            displayNameEn: 'Pro',
            description: 'For serious traders',
            priceMonthly: 79,
            priceYearly: 758,
            originalPriceMonthly: 79,
            originalPriceYearly: 948,
            maxTradesPerDay: -1,
            maxActiveTrades: 10,
            trialDays: 0,
            features: JSON.stringify(['unlimited_trades', 'advanced_analytics', 'priority_support', 'live_trading', 'all_basic_features']),
            featuresAr: JSON.stringify(['صفقات غير محدودة', 'تحليلات متقدمة', 'دعم ذو أولوية', 'تداول مباشر', 'جميع ميزات Basic']),
            hasAIAnalysis: true,
            hasWhaleTracker: true,
            hasAdvancedCharts: true,
            hasPaperTrading: true,
            hasTelegramNotif: true,
            hasPrioritySupport: true,
            isPopular: true,
            badgeText: 'الأكثر شعبية',
            badgeColor: 'green',
            sortOrder: 2,
          },
          {
            name: 'ENTERPRISE',
            displayName: 'Enterprise',
            displayNameEn: 'Enterprise',
            description: 'For professional teams',
            priceMonthly: 199,
            priceYearly: 1910,
            originalPriceMonthly: 199,
            originalPriceYearly: 2388,
            maxTradesPerDay: -1,
            maxActiveTrades: -1,
            trialDays: 0,
            features: JSON.stringify(['unlimited_everything', 'dedicated_support', 'custom_integrations', 'api_access', 'white_label']),
            featuresAr: JSON.stringify(['كل شيء غير محدود', 'دعم مخصص', 'تكاملات مخصصة', 'وصول API', 'علامة تجارية خاصة']),
            hasAIAnalysis: true,
            hasWhaleTracker: true,
            hasAdvancedCharts: true,
            hasPaperTrading: true,
            hasBacktesting: true,
            hasTelegramNotif: true,
            hasPrioritySupport: true,
            hasAPIAccess: true,
            isPopular: false,
            badgeText: 'الأفضل للفرق',
            badgeColor: 'purple',
            sortOrder: 3,
          },
        ],
      });
    }

    const { password: _, ...adminSafe } = admin;

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully!',
      admin: {
        email: adminEmail,
        password: adminPassword,
        note: '⚠️ IMPORTANT: Save these credentials securely. The password cannot be retrieved again.'
      },
      adminData: adminSafe,
      loginUrl: '/api/auth/login',
    });

  } catch (error) {
    console.error('Error initializing admin:', error);
    return NextResponse.json({ error: 'Failed to initialize admin' }, { status: 500 });
  }
}

// GET - Check if admin exists
export async function GET() {
  try {
    const adminExists = await db.user.findFirst({
      where: { isAdmin: true },
      select: { email: true, createdAt: true }
    });

    const plansCount = await db.plan.count();

    return NextResponse.json({
      adminExists: !!adminExists,
      adminEmail: adminExists?.email || null,
      plansSeeded: plansCount > 0,
      plansCount,
      setupRequired: !adminExists,
    });
  } catch (error) {
    console.error('Error checking admin:', error);
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 });
  }
}
