import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { 
  MODE, 
  canTrade, 
  getCurrentModeConfig,
  validateTradeParams 
} from '@/config/trading-mode';
import { ibService, IBContract, IBOrder } from '@/lib/ib-service';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔐 التحقق من صحة الإشارة - SIGNAL VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

function validateSignal(data: any): { valid: boolean; error?: string } {
  // التحقق من الحقول المطلوبة
  if (!data.symbol) {
    return { valid: false, error: '❌ الرمز (symbol) مطلوب' };
  }

  if (!data.action) {
    return { valid: false, error: '❌ الإجراء (action) مطلوب' };
  }

  // التحقق من صحة الإجراء
  const validActions = ['BUY', 'SELL', 'CLOSE', 'EXIT', 'LONG', 'SHORT', 'CALL', 'PUT'];
  const action = data.action.toUpperCase();
  if (!validActions.includes(action)) {
    return { valid: false, error: `❌ إجراء غير صالح: ${action}. الإجراءات المسموحة: ${validActions.join(', ')}` };
  }

  // التحقق من السعر (مهم جداً للتداول الحقيقي)
  if (data.price !== undefined) {
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
      return { valid: false, error: '❌ السعر يجب أن يكون رقماً موجباً' };
    }
  }

  // التحقق من الكمية
  if (data.quantity !== undefined) {
    const quantity = parseInt(data.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return { valid: false, error: '❌ الكمية يجب أن تكون رقماً موجباً' };
    }
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 إنشاء عقد IB - CONTRACT CREATION
// ═══════════════════════════════════════════════════════════════════════════════

function createIBContract(signal: any): IBContract {
  const symbol = signal.symbol.toUpperCase();
  
  // تحديد نوع الأداة
  const secType = signal.secType || signal.instrument_type || 'STK';
  
  // العقد الأساسي
  const contract: IBContract = {
    symbol: symbol,
    secType: secType as any,
    exchange: signal.exchange || 'SMART',
    currency: signal.currency || 'USD'
  };
  
  // إضافة تفاصيل الخيارات
  if (secType === 'OPT' || signal.option_type) {
    contract.secType = 'OPT';
    contract.exchange = signal.exchange || 'CBOE';
    contract.strike = parseFloat(signal.strike) || 0;
    contract.right = signal.option_type?.toUpperCase() === 'PUT' ? 'P' : 'C';
    contract.expiry = signal.expiry || signal.expiration || '';
    contract.multiplier = signal.multiplier || '100';
  }
  
  return contract;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 تنفيذ الأمر عبر IB - ORDER EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function executeIBOrder(
  signal: any, 
  quantity: number,
  signalLogId: string
): Promise<{ success: boolean; orderId?: number; error?: string }> {
  const modeConfig = getCurrentModeConfig();
  
  console.log(`${modeConfig.emoji} [WEBHOOK] Attempting to execute order...`);
  console.log(`📋 Mode: ${MODE}`);
  console.log(`📊 Signal: ${signal.action} ${signal.symbol} x${quantity}`);
  
  // التحقق من وضع التداول
  const tradeCheck = canTrade({
    ibConnected: ibService.isConnected(),
    hasMarketData: true
  });
  
  if (!tradeCheck.allowed) {
    console.error(`❌ [WEBHOOK] Trade not allowed: ${tradeCheck.reason}`);
    return { success: false, error: tradeCheck.reason };
  }
  
  // التحقق من اتصال IB
  if (!ibService.isConnected()) {
    console.error('❌ [WEBHOOK] IB not connected');
    return { success: false, error: '❌ IB not connected - cannot execute order' };
  }
  
  // إنشاء العقد
  const contract = createIBContract(signal);
  
  // تحديد الاتجاه
  const action = signal.action.toUpperCase();
  const ibAction: 'BUY' | 'SELL' = ['BUY', 'LONG', 'CALL'].includes(action) ? 'BUY' : 'SELL';
  
  // إنشاء الأمر
  const order: IBOrder = {
    symbol: signal.symbol.toUpperCase(),
    action: ibAction,
    quantity: quantity,
    orderType: signal.order_type || 'MKT',
    tif: signal.tif || 'DAY'
  };
  
  // إضافة سعر الحد إذا كان أمر محدد
  if (order.orderType === 'LMT' && signal.limit_price) {
    order.limitPrice = parseFloat(signal.limit_price);
  }
  
  // إضافة سعر الوقف إذا كان أمر وقف
  if (order.orderType === 'STP' && signal.stop_price) {
    order.stopPrice = parseFloat(signal.stop_price);
  }
  
  try {
    console.log(`📤 [WEBHOOK] Placing IB order:`, { order, contract });
    
    const result = await ibService.placeOrder(order, contract);
    
    if (result.success) {
      console.log(`✅ [WEBHOOK] Order placed successfully! Order ID: ${result.orderId}`);
      
      // تحديث سجل الإشارة
      await db.signalLog.update({
        where: { id: signalLogId },
        data: {
          status: 'EXECUTED',
          executed: true,
          executedAt: new Date()
        }
      });
      
      return { success: true, orderId: result.orderId };
    } else {
      console.error(`❌ [WEBHOOK] Order failed:`, result.message);
      
      await db.signalLog.update({
        where: { id: signalLogId },
        data: {
          status: 'FAILED',
          errorMessage: result.message
        }
      });
      
      return { success: false, error: result.message };
    }
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Order execution error:', error);
    return { success: false, error: error.message };
  }
}

// تحديد اتجاه الصفقة
function getDirection(action: string): string {
  const actionUpper = action.toUpperCase();
  if (['BUY', 'LONG', 'CALL'].includes(actionUpper)) {
    return 'LONG';
  }
  if (['SELL', 'SHORT', 'PUT'].includes(actionUpper)) {
    return 'SHORT';
  }
  return 'CLOSE';
}

// التحقق من المفتاح السري
async function validateSecret(secret: string, ip: string): Promise<{ valid: boolean; error?: string }> {
  if (!secret) {
    return { valid: false, error: 'المفتاح السري مطلوب' };
  }

  const webhookSecret = await db.webhookSecret.findUnique({
    where: { secret }
  });

  if (!webhookSecret) {
    return { valid: false, error: 'مفتاح سري غير صالح' };
  }

  if (!webhookSecret.active) {
    return { valid: false, error: 'هذا المفتاح السري غير مفعل' };
  }

  // التحقق من قائمة IPs المسموحة
  if (webhookSecret.ipWhitelist) {
    const allowedIps = JSON.parse(webhookSecret.ipWhitelist);
    if (allowedIps.length > 0 && !allowedIps.includes(ip)) {
      return { valid: false, error: 'عنوان IP غير مسموح' };
    }
  }

  // تحديث آخر استخدام
  await db.webhookSecret.update({
    where: { secret },
    data: {
      lastUsedAt: new Date(),
      useCount: { increment: 1 }
    }
  });

  return { valid: true };
}

// POST - استقبال إشارة من TradingView
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let signalData: any = {};
  let rawPayload = '';
  let headersData: any = {};

  try {
    // الحصول على IP المصدر
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // حفظ الـ headers
    request.headers.forEach((value, key) => {
      headersData[key] = value;
    });

    // قراءة البيانات
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      signalData = await request.json();
      rawPayload = JSON.stringify(signalData);
    } else {
      rawPayload = await request.text();
      try {
        signalData = JSON.parse(rawPayload);
      } catch {
        // محاولة قراءة كـ form data
        const params = new URLSearchParams(rawPayload);
        signalData = Object.fromEntries(params);
      }
    }

    // توليد معرف فريد للإشارة
    const webhookId = crypto.randomBytes(16).toString('hex');

    // التحقق من المفتاح السري
    const secret = signalData.secret || signalData.api_key || signalData.webhook_secret;
    const secretValidation = await validateSecret(secret, ip);

    if (!secretValidation.valid) {
      // تسجيل الإشارة الفاشلة
      await db.signalLog.create({
        data: {
          source: 'TRADINGVIEW',
          webhookId,
          symbol: signalData.symbol || 'UNKNOWN',
          action: signalData.action || 'UNKNOWN',
          status: 'FAILED',
          errorMessage: secretValidation.error,
          rawPayload,
          headers: JSON.stringify(headersData),
          sourceIp: ip,
          userAgent: request.headers.get('user-agent')
        }
      });

      return NextResponse.json(
        { success: false, error: secretValidation.error },
        { status: 401 }
      );
    }

    // التحقق من صحة الإشارة
    const validation = validateSignal(signalData);
    if (!validation.valid) {
      await db.signalLog.create({
        data: {
          source: 'TRADINGVIEW',
          webhookId,
          symbol: signalData.symbol || 'UNKNOWN',
          action: signalData.action || 'UNKNOWN',
          status: 'FAILED',
          errorMessage: validation.error,
          rawPayload,
          headers: JSON.stringify(headersData),
          sourceIp: ip,
          userAgent: request.headers.get('user-agent')
        }
      });

      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // تحضير بيانات الإشارة
    const symbol = signalData.symbol.toUpperCase();
    const action = signalData.action.toUpperCase();
    const direction = getDirection(action);

    // تسجيل الإشارة
    const signalLog = await db.signalLog.create({
      data: {
        source: 'TRADINGVIEW',
        webhookId,
        symbol,
        action,
        direction,
        price: parseFloat(signalData.price) || null,
        entryPrice: parseFloat(signalData.entry_price || signalData.price) || null,
        strike: parseFloat(signalData.strike) || null,
        expiry: signalData.expiry || signalData.expiration || null,
        optionType: signalData.option_type || signalData.optionType || null,
        quantity: parseInt(signalData.quantity) || signalData.contracts || null,
        positionSize: parseFloat(signalData.position_size || signalData.size) || null,
        stopLoss: parseFloat(signalData.stop_loss || signalData.stopLoss) || null,
        takeProfit: parseFloat(signalData.take_profit || signalData.takeProfit) || null,
        trailingStop: parseFloat(signalData.trailing_stop || signalData.trailingStop) || null,
        strategy: signalData.strategy || null,
        strategyName: signalData.strategy_name || signalData.strategyName || null,
        timeframe: signalData.timeframe || signalData.interval || null,
        confidence: parseFloat(signalData.confidence) || null,
        status: 'RECEIVED',
        rawPayload,
        headers: JSON.stringify(headersData),
        sourceIp: ip,
        userAgent: request.headers.get('user-agent')
      }
    });

    // التحقق من وجود الرمز في قائمة المراقبة مع التداول التلقائي
    const watchlistItem = await db.watchlistItem.findFirst({
      where: {
        symbol,
        autoTrade: true,
        enabled: true
      }
    });

    let executed = false;
    let tradeId = null;
    let ibOrderId = null;
    const modeConfig = getCurrentModeConfig();

    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 LOGGING - تسجيل مفصل
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`${modeConfig.emoji} 📩 TRADINGVIEW SIGNAL RECEIVED`);
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`📍 Symbol: ${symbol}`);
    console.log(`📍 Action: ${action}`);
    console.log(`📍 Direction: ${direction}`);
    console.log(`📍 Price: ${signalData.price || 'N/A'}`);
    console.log(`📍 Strategy: ${signalData.strategy || 'N/A'}`);
    console.log(`📍 Timeframe: ${signalData.timeframe || 'N/A'}`);
    console.log(`📍 Mode: ${MODE}`);
    console.log(`📍 IB Connected: ${ibService.isConnected()}`);
    console.log('═══════════════════════════════════════════════════════════════════');

    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔒 MODE CHECK - التحقق من وضع التداول
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (MODE === 'SIMULATION') {
      console.log('⚠️ [SIMULATION] Order would be executed (simulation only)');
      
      await db.signalLog.update({
        where: { id: signalLog.id },
        data: {
          status: 'VALIDATED',
          responseMessage: 'Simulation mode - order not sent to IB'
        }
      });
      
      return NextResponse.json({
        success: true,
        simulation: true,
        data: {
          webhookId,
          signalId: signalLog.id,
          symbol,
          action,
          direction,
          mode: MODE,
          message: '✅ Signal validated (SIMULATION mode - no real execution)'
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 📈 IB EXECUTION - تنفيذ عبر Interactive Brokers
    // ═══════════════════════════════════════════════════════════════════════════════

    // إذا كان التداول التلقائي مفعل لهذا الرمز
    if (watchlistItem) {
      const quantity = watchlistItem.quantity || parseInt(signalData.quantity) || 1;
      
      // محاولة التنفيذ عبر IB
      const execResult = await executeIBOrder(signalData, quantity, signalLog.id);
      
      if (execResult.success) {
        ibOrderId = execResult.orderId;
        
        // إنشاء سجل الصفقة في قاعدة البيانات
        try {
          const trade = await db.trade.create({
            data: {
              symbol,
              instrumentType: watchlistItem.type,
              direction,
              quantity: quantity,
              entryPrice: parseFloat(signalData.price) || 0,
              strike: watchlistItem.strike,
              expiry: watchlistItem.expiry,
              optionType: watchlistItem.optionType,
              stopLoss: watchlistItem.stopLossPercent ?
                (parseFloat(signalData.price) * (1 - watchlistItem.stopLossPercent / 100)) : null,
              takeProfit: watchlistItem.takeProfitPercent ?
                (parseFloat(signalData.price) * (1 + watchlistItem.takeProfitPercent / 100)) : null,
              status: 'PENDING',
              ibOrderId: ibOrderId,
              signalSource: 'TRADINGVIEW',
              signalStrategy: signalData.strategy,
              signalTime: new Date()
            }
          });

          tradeId = trade.id;
          executed = true;
          
          console.log(`✅ [WEBHOOK] Trade created in DB: ${tradeId}`);
        } catch (dbError) {
          console.error('❌ [WEBHOOK] Failed to create trade record:', dbError);
        }
      }
    } else {
      // تحديث حالة الإشارة إلى تم التحقق
      await db.signalLog.update({
        where: { id: signalLog.id },
        data: {
          status: 'VALIDATED'
        }
      });
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        webhookId,
        signalId: signalLog.id,
        symbol,
        action,
        direction,
        executed,
        tradeId,
        ibOrderId,
        mode: MODE,
        ibConnected: ibService.isConnected(),
        processingTime: `${processingTime}ms`
      },
      message: executed ?
        `✅ تم تنفيذ الإشارة تلقائياً: ${action} ${symbol} (IB Order: ${ibOrderId})` :
        watchlistItem ? 
          `❌ فشل تنفيذ الإشارة - تحقق من اتصال IB` :
          `📩 تم استلام الإشارة: ${action} ${symbol} (التداول التلقائي غير مفعل لهذا الرمز)`
    });

  } catch (error) {
    console.error('Webhook error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ في معالجة الإشارة',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// GET - معلومات الـ Webhook
export async function GET(request: NextRequest) {
  const modeConfig = getCurrentModeConfig();
  
  return NextResponse.json({
    success: true,
    info: {
      name: 'Trading Bot Webhook',
      version: '3.0',
      description: 'TradingView Webhook → IB Order Execution',
      
      // Mode Info
      mode: MODE,
      modeDescription: modeConfig.description,
      allowRealTrades: modeConfig.allowRealTrades,
      
      // IB Status
      ibConnected: ibService.isConnected(),
      
      endpoints: {
        webhook: '/api/tradingview/webhook',
        signals: '/api/signals',
        watchlist: '/api/watchlist'
      },
      
      supportedActions: ['BUY', 'SELL', 'CLOSE', 'EXIT', 'LONG', 'SHORT', 'CALL', 'PUT'],
      
      // Example payload for TradingView
      payloadExample: {
        secret: 'YOUR_WEBHOOK_SECRET',
        symbol: 'SPX',
        action: 'BUY',
        price: '{{close}}',
        quantity: 1,
        timeframe: '1m',
        strategy: 'whale_radar',
        stop_loss: 0,
        take_profit: 0
      },
      
      // Security
      security: {
        secretRequired: true,
        ipWhitelist: true,
        autoTradeRequired: true
      }
    }
  });
}
