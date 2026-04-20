import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ibService, IBConfig, validateIBConfig } from '@/lib/ib-service';

// POST - Connect to IB - REAL CONNECTION
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, host, port, clientId, accountType } = body;

    const ibHost = host || '127.0.0.1';
    const ibPort = parseInt(port) || 7497;
    const ibClientId = parseInt(clientId) || 1;
    const ibAccountType = accountType || (ibPort === 7497 ? 'paper' : 'live');

    console.log('[IB Connect] Connecting to:', ibHost, ':', ibPort);

    // Validate configuration
    const config: IBConfig = {
      host: ibHost,
      port: ibPort,
      clientId: ibClientId,
      accountType: ibAccountType
    };

    const validation = validateIBConfig(config);
    if (!validation.valid) {
      return NextResponse.json({ 
        success: false, 
        error: validation.errors.join(', ') 
      }, { status: 400 });
    }

    // Configure IB service
    ibService.configure(config);

    // Attempt REAL connection
    const result = await ibService.connect();

    if (result.success) {
      // Update settings in database
      let settings = await db.botSettings.findFirst();
      
      if (!settings) {
        settings = await db.botSettings.create({
          data: {
            userId: userId || 'demo',
            ibHost,
            ibPort,
            ibClientId: ibClientId,
            accountType: ibAccountType,
            ibConnected: true,
            isRunning: false,
            telegramEnabled: false,
            telegramBotToken: null,
            telegramChatId: null,
            defaultQuantity: 1,
            maxRiskPerTrade: 100,
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
      } else {
        settings = await db.botSettings.update({
          where: { id: settings.id },
          data: {
            ibHost,
            ibPort,
            ibClientId: ibClientId,
            accountType: ibAccountType,
            ibConnected: true
          }
        });
      }

      console.log('✅ IB REAL Connection successful:', { host: ibHost, port: ibPort });

      return NextResponse.json({ 
        success: true, 
        message: result.message,
        ibStatus: {
          connected: true,
          accountType: ibAccountType
        },
        settings
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('IB Connect Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Connection failed' 
    }, { status: 500 });
  }
}
