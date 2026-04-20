import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ibService, IBConfig, validateIBConfig } from '@/lib/ib-service';

// GET - Get IB connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo';

    // Get settings (any user or create default)
    let settings = await db.botSettings.findFirst();

    // Check if we're in simulation mode
    const accountType = settings?.accountType || 'simulation';
    const isSimulation = accountType === 'simulation' || accountType === 'SIMULATION';
    
    // Check actual IB connection status (for real IB connections)
    const isActuallyConnected = ibService.isConnected();
    
    // Check database connection flag
    const dbConnected = settings?.ibConnected || false;
    
    // IMPORTANT: For real IB accounts, rely ONLY on actual connection
    // For simulation mode, use database flag
    const effectiveConnected = isSimulation 
      ? dbConnected  // Simulation: use database flag only
      : isActuallyConnected;  // Real IB: check actual connection only (not database)

    const status = {
      configured: !!(settings?.ibHost && settings?.ibPort),
      connected: effectiveConnected,
      isSimulation: isSimulation,
      host: settings?.ibHost || '127.0.0.1',
      port: settings?.ibPort || 7497,
      accountType: accountType,
      clientId: settings?.ibClientId || 1,
      message: isSimulation 
        ? (dbConnected ? 'وضع تجريبي - متصل' : 'وضع تجريبي - غير متصل')
        : isActuallyConnected 
          ? '✅ متصل بـ IB TWS/Gateway'
          : dbConnected 
            ? '✅ جاهز للاتصال'
            : '❌ غير متصل - اضغط زر الاتصال'
    };

    return NextResponse.json({
      connected: effectiveConnected,
      accountType: accountType,
      message: status.message,
      status
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Connect/Disconnect from IB - REAL CONNECTION
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, host, port, clientId, accountType } = body;

    console.log('[IB API] Action:', action, { host, port, clientId, accountType });

    if (action === 'connect') {
      const ibHost = host || '127.0.0.1';
      const ibPort = parseInt(port) || 7497;
      const ibClientId = parseInt(clientId) || 1;
      const ibAccountType = accountType || (ibPort === 7497 ? 'paper' : 'live');

      // Check if simulation mode - no real IB connection needed
      if (ibAccountType === 'simulation') {
        console.log('[IB API] Simulation mode - marking as connected');
        
        // Update database
        let settings = await db.botSettings.findFirst();
        
        if (!settings) {
          settings = await db.botSettings.create({
            data: {
              userId: 'demo',
              accountType: 'simulation',
              ibConnected: true,
              isRunning: true,
              ibHost: '127.0.0.1',
              ibPort: 7497,
              ibClientId: 1,
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
              accountType: 'simulation',
              ibConnected: true,
              isRunning: true
            }
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'تم الاتصال في الوضع التجريبي',
          settings: {
            accountType: 'simulation',
            connected: true
          }
        });
      }

      // For real IB connection (paper or live)
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
      console.log('[IB API] Attempting real connection to:', ibHost, ':', ibPort);
      const result = await ibService.connect();

      if (result.success) {
        // Update settings in database
        let settings = await db.botSettings.findFirst();
        
        if (!settings) {
          settings = await db.botSettings.create({
            data: {
              userId: 'demo',
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

        console.log('✅ IB REAL Connection successful:', { host: ibHost, port: ibPort, accountType: ibAccountType });

        return NextResponse.json({ 
          success: true, 
          message: result.message,
          settings: {
            host: ibHost,
            port: ibPort,
            clientId: ibClientId,
            accountType: ibAccountType
          }
        });
      } else {
        // Connection failed - return proper error status
        return NextResponse.json({ 
          success: false, 
          error: result.message 
        }, { status: 400 });
      }
    }

    if (action === 'disconnect') {
      // Disconnect from IB
      await ibService.disconnect();
      
      const settings = await db.botSettings.findFirst();
      if (settings) {
        await db.botSettings.update({
          where: { id: settings.id },
          data: { ibConnected: false }
        });
      }

      return NextResponse.json({ success: true, message: 'Disconnected from IB' });
    }

    if (action === 'status') {
      const isConnected = ibService.isConnected();
      return NextResponse.json({ 
        success: true, 
        connected: isConnected,
        message: isConnected ? 'Connected' : 'Not connected'
      });
    }

    if (action === 'test') {
      // Test connection without saving
      const testConfig: IBConfig = {
        host: host || '127.0.0.1',
        port: parseInt(port) || 7497,
        clientId: 999,
        accountType: accountType || 'paper'
      };

      ibService.configure(testConfig);
      const result = await ibService.connect();
      
      if (result.success) {
        await ibService.disconnect();
      }

      return NextResponse.json({ 
        success: result.success,
        message: result.message
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use: connect, disconnect, status, or test' }, { status: 400 });
  } catch (error: any) {
    console.error('IB API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
