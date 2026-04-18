import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch bot settings
export async function GET(request: NextRequest) {
  try {
    // Get any settings
    let settings = await db.botSettings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await db.botSettings.create({
        data: {
          accountType: 'PAPER',
          ibHost: '127.0.0.1',
          ibPort: 7497,
          ibClientId: 1,
          ibConnected: false,
          isRunning: false,
          telegramEnabled: false,
          telegramBotToken: null,
          telegramChatId: null,
          defaultQuantity: 1,
          maxRiskPerTrade: 500,
          defaultExpiry: '0DTE',
          positionSizeMode: 'AMOUNT',
          positionSizePercent: 5,
          positionSizeAmount: 500,
          spxStrikeOffset: 5,
          spxDeltaTarget: 0.3,
          strikeSelectionMode: 'MANUAL',
          contractPriceMin: 300,
          contractPriceMax: 400,
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        isRunning: settings.isRunning || false,
        accountType: settings.accountType || 'PAPER',
        ibHost: settings.ibHost || '127.0.0.1',
        ibPort: settings.ibPort || 7497,
        ibClientId: settings.ibClientId || 1,
        ibConnected: settings.ibConnected || false,
        strikeSelectionMode: settings.strikeSelectionMode || 'OFFSET',
        contractPriceMin: settings.contractPriceMin || 300,
        contractPriceMax: settings.contractPriceMax || 400,
        spxStrikeOffset: settings.spxStrikeOffset || 5,
        spxDeltaTarget: settings.spxDeltaTarget || 0.3,
        telegramEnabled: settings.telegramEnabled || false,
        telegramBotToken: settings.telegramBotToken || '',
        telegramChatId: settings.telegramChatId || '',
        maxRiskPerTrade: settings.maxRiskPerTrade || 500,
        maxOpenPositions: settings.maxOpenPositions || 3,
        maxDailyLoss: settings.maxDailyLoss || 1000,
        defaultQuantity: settings.defaultQuantity || 1,
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      success: true,
      settings: getDefaultSettings(),
    });
  }
}

// POST - Update bot settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...settingsData } = body;

    console.log('Saving settings:', settingsData);

    // Get any existing settings
    let settings = await db.botSettings.findFirst();

    const dataToUpdate = {
      ...settingsData,
      ibPort: settingsData.ibPort ? parseInt(settingsData.ibPort) : undefined,
      ibClientId: settingsData.ibClientId ? parseInt(settingsData.ibClientId) : undefined,
    };

    if (!settings) {
      // Create new settings
      settings = await db.botSettings.create({
        data: dataToUpdate
      });
    } else {
      // Update existing settings
      settings = await db.botSettings.update({
        where: { id: settings.id },
        data: dataToUpdate
      });
    }

    console.log('Settings saved successfully:', settings.id);

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح',
      settings: {
        isRunning: settings.isRunning,
        accountType: settings.accountType,
        ibHost: settings.ibHost,
        ibPort: settings.ibPort,
        ibClientId: settings.ibClientId,
        telegramEnabled: settings.telegramEnabled,
        telegramBotToken: settings.telegramBotToken || '',
        telegramChatId: settings.telegramChatId || '',
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getDefaultSettings() {
  return {
    isRunning: false,
    accountType: 'PAPER',
    ibHost: '127.0.0.1',
    ibPort: 7497,
    ibClientId: 1,
    ibConnected: false,
    strikeSelectionMode: 'OFFSET',
    contractPriceMin: 300,
    contractPriceMax: 400,
    spxStrikeOffset: 5,
    spxDeltaTarget: 0.3,
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    maxRiskPerTrade: 500,
    maxOpenPositions: 3,
    maxDailyLoss: 1000,
    defaultQuantity: 1,
  };
}
