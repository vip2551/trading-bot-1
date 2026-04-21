import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب الإعدادات الحالية
export async function GET() {
  try {
    // جلب الإعدادات (نستخدم السجل الأول أو ننشئ واحد جديد)
    let settings = await db.botSettings.findFirst();

    if (!settings) {
      // إنشاء إعدادات افتراضية
      settings = await db.botSettings.create({
        data: {
          accountType: 'SIMULATION',
          tradingMode: 'BALANCED',
          defaultQuantity: 1,
          maxRiskPerTrade: 100,
          maxOpenPositions: 1,
          allowMultipleTrades: false,
          telegramEnabled: false,
          autoTradingEnabled: false,
          maxDailyLoss: 500,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        // Trading Mode
        accountType: settings.accountType,
        tradingMode: settings.tradingMode,
        
        // Position Sizing
        defaultQuantity: settings.defaultQuantity,
        maxRiskPerTrade: settings.maxRiskPerTrade,
        positionSizeMode: settings.positionSizeMode,
        positionSizePercent: settings.positionSizePercent,
        positionSizeAmount: settings.positionSizeAmount,
        
        // Risk Management
        maxOpenPositions: settings.maxOpenPositions,
        maxDailyLoss: settings.maxDailyLoss,
        allowMultipleTrades: settings.allowMultipleTrades,
        defaultStopLoss: settings.defaultStopLoss,
        defaultTakeProfit: settings.defaultTakeProfit,
        trailingStopDefault: settings.trailingStopDefault,
        
        // Telegram
        telegramEnabled: settings.telegramEnabled,
        telegramBotToken: settings.telegramBotToken,
        telegramChatId: settings.telegramChatId,
        
        // Auto Trading
        autoTradingEnabled: settings.autoTradingEnabled,
        autoTradingStartTime: settings.autoTradingStartTime,
        autoTradingEndTime: settings.autoTradingEndTime,
        
        // IB Connection
        ibHost: settings.ibHost,
        ibPort: settings.ibPort,
        ibClientId: settings.ibClientId,
        ibConnected: settings.ibConnected,
        
        // Advanced
        contractSizeMode: settings.contractSizeMode,
        fixedContracts: settings.fixedContracts,
        minContracts: settings.minContracts,
        maxContracts: settings.maxContracts,
        activeSymbols: settings.activeSymbols,
        
        // Timestamps
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - تحديث الإعدادات
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // جلب الإعدادات الحالية
    let settings = await db.botSettings.findFirst();

    if (!settings) {
      // إنشاء إعدادات جديدة
      settings = await db.botSettings.create({
        data: {
          accountType: body.accountType || 'SIMULATION',
          tradingMode: body.tradingMode || 'BALANCED',
          defaultQuantity: body.defaultQuantity || 1,
          maxRiskPerTrade: body.maxRiskPerTrade || 100,
          maxOpenPositions: body.maxOpenPositions || 1,
          maxDailyLoss: body.maxDailyLoss || 500,
          telegramEnabled: body.telegramEnabled || false,
          autoTradingEnabled: body.autoTradingEnabled || false,
        },
      });
    } else {
      // تحديث الإعدادات
      settings = await db.botSettings.update({
        where: { id: settings.id },
        data: {
          // Trading Mode
          accountType: body.accountType,
          tradingMode: body.tradingMode,
          
          // Position Sizing
          defaultQuantity: body.defaultQuantity,
          maxRiskPerTrade: body.maxRiskPerTrade,
          positionSizeMode: body.positionSizeMode,
          positionSizePercent: body.positionSizePercent,
          positionSizeAmount: body.positionSizeAmount,
          
          // Risk Management
          maxOpenPositions: body.maxOpenPositions,
          maxDailyLoss: body.maxDailyLoss,
          allowMultipleTrades: body.allowMultipleTrades,
          defaultStopLoss: body.defaultStopLoss,
          defaultTakeProfit: body.defaultTakeProfit,
          trailingStopDefault: body.trailingStopDefault,
          
          // Telegram
          telegramEnabled: body.telegramEnabled,
          telegramBotToken: body.telegramBotToken,
          telegramChatId: body.telegramChatId,
          
          // Auto Trading
          autoTradingEnabled: body.autoTradingEnabled,
          autoTradingStartTime: body.autoTradingStartTime,
          autoTradingEndTime: body.autoTradingEndTime,
          
          // IB Connection
          ibHost: body.ibHost,
          ibPort: body.ibPort,
          ibClientId: body.ibClientId,
          
          // Advanced
          contractSizeMode: body.contractSizeMode,
          fixedContracts: body.fixedContracts,
          minContracts: body.minContracts,
          maxContracts: body.maxContracts,
          activeSymbols: body.activeSymbols,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
