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
          positionSizeMode: 'FIXED',
          positionSizePercent: 5,
          positionSizeAmount: 500,
          spxStrikeOffset: 5,
          spxDeltaTarget: 0.3,
          strikeSelectionMode: 'CONTRACT_PRICE',
          contractPriceMin: 300,
          contractPriceMax: 400,
          // New advanced settings
          tradingMode: 'BALANCED',
          activeSymbols: 'SPX',
          primarySymbol: 'SPX',
          contractSizeMode: 'FIXED',
          fixedContracts: 1,
          contractsPercentage: 2.0,
          contractsRiskAmount: 100.0,
          minContracts: 1,
          maxContracts: 10,
          minConfidenceConservative: 80.0,
          minConfidenceBalanced: 70.0,
          minConfidenceAggressive: 60.0,
          useRSI: true,
          useMACD: true,
          useBollinger: true,
          useEMA: true,
          useADX: true,
          detectExplosions: true,
          detectReversals: true,
          detectInstitutional: true,
          detectSupplyDemand: true,
          explosionVolumeThreshold: 2.0,
          explosionVolatilityThreshold: 1.5,
          autoTradingEnabled: false,
          autoTradingStartTime: '09:30',
          autoTradingEndTime: '16:00',
          processTradingViewSignals: true,
          autoSelectStrike: true,
          autoDetermineDirection: true,
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
        strikeSelectionMode: settings.strikeSelectionMode || 'CONTRACT_PRICE',
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
        // New advanced settings
        tradingMode: settings.tradingMode || 'BALANCED',
        activeSymbols: settings.activeSymbols || 'SPX',
        primarySymbol: settings.primarySymbol || 'SPX',
        contractSizeMode: settings.contractSizeMode || 'FIXED',
        fixedContracts: settings.fixedContracts || 1,
        contractsPercentage: settings.contractsPercentage || 2.0,
        contractsRiskAmount: settings.contractsRiskAmount || 100.0,
        minContracts: settings.minContracts || 1,
        maxContracts: settings.maxContracts || 10,
        minConfidenceConservative: settings.minConfidenceConservative || 80.0,
        minConfidenceBalanced: settings.minConfidenceBalanced || 70.0,
        minConfidenceAggressive: settings.minConfidenceAggressive || 60.0,
        useRSI: settings.useRSI ?? true,
        useMACD: settings.useMACD ?? true,
        useBollinger: settings.useBollinger ?? true,
        useEMA: settings.useEMA ?? true,
        useADX: settings.useADX ?? true,
        detectExplosions: settings.detectExplosions ?? true,
        detectReversals: settings.detectReversals ?? true,
        detectInstitutional: settings.detectInstitutional ?? true,
        detectSupplyDemand: settings.detectSupplyDemand ?? true,
        explosionVolumeThreshold: settings.explosionVolumeThreshold || 2.0,
        explosionVolatilityThreshold: settings.explosionVolatilityThreshold || 1.5,
        autoTradingEnabled: settings.autoTradingEnabled ?? false,
        autoTradingStartTime: settings.autoTradingStartTime || '09:30',
        autoTradingEndTime: settings.autoTradingEndTime || '16:00',
        processTradingViewSignals: settings.processTradingViewSignals ?? true,
        autoSelectStrike: settings.autoSelectStrike ?? true,
        autoDetermineDirection: settings.autoDetermineDirection ?? true,
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

    console.log('Saving settings:', Object.keys(settingsData));

    // Get any existing settings
    let settings = await db.botSettings.findFirst();

    const dataToUpdate: Record<string, unknown> = { ...settingsData };
    
    // Convert numeric fields
    if (settingsData.ibPort) dataToUpdate.ibPort = parseInt(settingsData.ibPort);
    if (settingsData.ibClientId) dataToUpdate.ibClientId = parseInt(settingsData.ibClientId);
    if (settingsData.fixedContracts) dataToUpdate.fixedContracts = parseInt(settingsData.fixedContracts);
    if (settingsData.minContracts) dataToUpdate.minContracts = parseInt(settingsData.minContracts);
    if (settingsData.maxContracts) dataToUpdate.maxContracts = parseInt(settingsData.maxContracts);
    if (settingsData.contractsPercentage) dataToUpdate.contractsPercentage = parseFloat(settingsData.contractsPercentage);
    if (settingsData.contractsRiskAmount) dataToUpdate.contractsRiskAmount = parseFloat(settingsData.contractsRiskAmount);
    if (settingsData.minConfidenceConservative) dataToUpdate.minConfidenceConservative = parseFloat(settingsData.minConfidenceConservative);
    if (settingsData.minConfidenceBalanced) dataToUpdate.minConfidenceBalanced = parseFloat(settingsData.minConfidenceBalanced);
    if (settingsData.minConfidenceAggressive) dataToUpdate.minConfidenceAggressive = parseFloat(settingsData.minConfidenceAggressive);

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
        tradingMode: settings.tradingMode,
        activeSymbols: settings.activeSymbols,
        primarySymbol: settings.primarySymbol,
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
    strikeSelectionMode: 'CONTRACT_PRICE',
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
    // New advanced settings
    tradingMode: 'BALANCED',
    activeSymbols: 'SPX',
    primarySymbol: 'SPX',
    contractSizeMode: 'FIXED',
    fixedContracts: 1,
    contractsPercentage: 2.0,
    contractsRiskAmount: 100.0,
    minContracts: 1,
    maxContracts: 10,
    minConfidenceConservative: 80.0,
    minConfidenceBalanced: 70.0,
    minConfidenceAggressive: 60.0,
    useRSI: true,
    useMACD: true,
    useBollinger: true,
    useEMA: true,
    useADX: true,
    detectExplosions: true,
    detectReversals: true,
    detectInstitutional: true,
    detectSupplyDemand: true,
    explosionVolumeThreshold: 2.0,
    explosionVolatilityThreshold: 1.5,
    autoTradingEnabled: false,
    autoTradingStartTime: '09:30',
    autoTradingEndTime: '16:00',
    processTradingViewSignals: true,
    autoSelectStrike: true,
    autoDetermineDirection: true,
  };
}
