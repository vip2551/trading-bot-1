import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';

const app = express();
const PORT = 3002;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// ==================== IB KR CONFIG ====================

interface IBConfig {
  host: string;
  port: number;
  clientId: number;
}

const IB_CONFIG: IBConfig = {
  host: process.env.IB_HOST || '127.0.0.1',
  port: parseInt(process.env.IB_PORT || '7497'),
  clientId: parseInt(process.env.IB_CLIENT_ID || '1')
};

// ==================== ORDER TRACKING ====================

interface Order {
  orderId: number;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: string;
  status: string;
  limitPrice?: number;
  stopPrice?: number;
  parentId?: number;
  bracketId?: string;
  createdAt: Date;
}

interface BracketOrder {
  bracketId: string;
  parentOrderId: number;
  stopLossOrderId: number;
  takeProfitOrderId: number;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  status: 'pending' | 'submitted' | 'filled' | 'cancelled';
  createdAt: Date;
}

const orders: Map<number, Order> = new Map();
const bracketOrders: Map<string, BracketOrder> = new Map();
let nextOrderId = 1;

// ==================== IB CONNECTION ====================

let ibSocket: WebSocket | null = null;
let isConnected = false;

function connectToIB(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      ibSocket = new WebSocket(`ws://${IB_CONFIG.host}:${IB_CONFIG.port}`);
      
      ibSocket.on('open', () => {
        console.log('[IB] Connected to TWS/Gateway');
        isConnected = true;
        
        // إرسال طلب الاتصال
        sendMessage({
          type: 'connect',
          clientId: IB_CONFIG.clientId
        });
        
        resolve(true);
      });
      
      ibSocket.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          handleIBMessage(message);
        } catch (e) {
          console.error('[IB] Parse error:', e);
        }
      });
      
      ibSocket.on('error', (error) => {
        console.error('[IB] Connection error:', error);
        isConnected = false;
        resolve(false);
      });
      
      ibSocket.on('close', () => {
        console.log('[IB] Disconnected');
        isConnected = false;
        // إعادة الاتصال بعد 5 ثواني
        setTimeout(connectToIB, 5000);
      });
      
    } catch (error) {
      console.error('[IB] Connection failed:', error);
      resolve(false);
    }
  });
}

function sendMessage(message: any) {
  if (ibSocket && isConnected) {
    ibSocket.send(JSON.stringify(message));
  }
}

function handleIBMessage(message: any) {
  switch (message.type) {
    case 'nextOrderId':
      nextOrderId = message.orderId;
      break;
      
    case 'orderStatus':
      if (orders.has(message.orderId)) {
        const order = orders.get(message.orderId)!;
        order.status = message.status;
        orders.set(message.orderId, order);
        
        // تحديث Bracket Order
        if (order.bracketId && bracketOrders.has(order.bracketId)) {
          const bracket = bracketOrders.get(order.bracketId)!;
          if (message.status === 'Filled') {
            bracket.status = 'filled';
          } else if (message.status === 'Cancelled') {
            bracket.status = 'cancelled';
          }
          bracketOrders.set(order.bracketId, bracket);
        }
      }
      break;
      
    case 'error':
      console.error('[IB] Error:', message);
      break;
  }
}

// ==================== ORDER FUNCTIONS ====================

function getNextOrderId(): number {
  return nextOrderId++;
}

async function placeSingleOrder(params: {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MKT' | 'LMT' | 'STP' | 'STP_LMT';
  limitPrice?: number;
  stopPrice?: number;
  parentId?: number;
  transmit?: boolean;
}): Promise<number> {
  const orderId = getNextOrderId();
  
  const order: Order = {
    orderId,
    symbol: params.symbol,
    action: params.action,
    quantity: params.quantity,
    orderType: params.orderType,
    status: 'pending',
    limitPrice: params.limitPrice,
    stopPrice: params.stopPrice,
    parentId: params.parentId,
    createdAt: new Date()
  };
  
  orders.set(orderId, order);
  
  sendMessage({
    type: 'placeOrder',
    orderId,
    contract: {
      symbol: params.symbol,
      secType: 'STK',
      exchange: 'SMART',
      currency: 'USD'
    },
    order: {
      action: params.action,
      orderType: params.orderType,
      totalQuantity: params.quantity,
      lmtPrice: params.limitPrice,
      auxPrice: params.stopPrice,
      parentId: params.parentId || 0,
      transmit: params.transmit !== false
    }
  });
  
  return orderId;
}

// ==================== BRACKET ORDER ====================

async function placeBracketOrder(params: {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}): Promise<BracketOrder> {
  
  const bracketId = `BRACKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[IB] Placing bracket order: ${bracketId}`);
  console.log(`[IB] Symbol: ${params.symbol}, Action: ${params.action}`);
  console.log(`[IB] Entry: ${params.entryPrice}, SL: ${params.stopLoss}, TP: ${params.takeProfit}`);
  
  // 1. الأمر الرئيسي (Parent Order) - transmit: false
  const parentOrderId = await placeSingleOrder({
    symbol: params.symbol,
    action: params.action,
    quantity: params.quantity,
    orderType: 'LMT',
    limitPrice: params.entryPrice,
    transmit: false  // ⚠️ لا ترسل حتى تُضاف الأوامر الفرعية
  });
  
  // تحديث الأمر الرئيسي مع bracketId
  const parentOrder = orders.get(parentOrderId)!;
  parentOrder.bracketId = bracketId;
  orders.set(parentOrderId, parentOrder);
  
  // 2. Stop Loss Order (Child Order 1) - parentId + transmit: false
  const stopLossOrderId = await placeSingleOrder({
    symbol: params.symbol,
    action: params.action === 'BUY' ? 'SELL' : 'BUY',
    quantity: params.quantity,
    orderType: 'STP',
    stopPrice: params.stopLoss,
    parentId: parentOrderId,  // ⚠️ مربوط بالأمر الرئيسي
    transmit: false           // ⚠️ لا ترسل بعد
  });
  
  const stopLossOrder = orders.get(stopLossOrderId)!;
  stopLossOrder.bracketId = bracketId;
  orders.set(stopLossOrderId, stopLossOrder);
  
  // 3. Take Profit Order (Child Order 2) - parentId + transmit: true
  const takeProfitOrderId = await placeSingleOrder({
    symbol: params.symbol,
    action: params.action === 'BUY' ? 'SELL' : 'BUY',
    quantity: params.quantity,
    orderType: 'LMT',
    limitPrice: params.takeProfit,
    parentId: parentOrderId,  // ⚠️ مربوط بالأمر الرئيسي
    transmit: true            // ⚠️ يرسل الأوامر الثلاثة معاً
  });
  
  const takeProfitOrder = orders.get(takeProfitOrderId)!;
  takeProfitOrder.bracketId = bracketId;
  orders.set(takeProfitOrderId, takeProfitOrder);
  
  // حفظ Bracket Order
  const bracketOrder: BracketOrder = {
    bracketId,
    parentOrderId,
    stopLossOrderId,
    takeProfitOrderId,
    symbol: params.symbol,
    action: params.action,
    quantity: params.quantity,
    entryPrice: params.entryPrice,
    stopLoss: params.stopLoss,
    takeProfit: params.takeProfit,
    status: 'submitted',
    createdAt: new Date()
  };
  
  bracketOrders.set(bracketId, bracketOrder);
  
  console.log(`[IB] Bracket order submitted: ${bracketId}`);
  console.log(`[IB] Parent: ${parentOrderId}, SL: ${stopLossOrderId}, TP: ${takeProfitOrderId}`);
  
  return bracketOrder;
}

// ==================== TRAILING STOP ====================

async function placeTrailingStop(params: {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  trailingPercent: number;
  trailingAmount?: number;
}): Promise<number> {
  
  const orderId = getNextOrderId();
  
  sendMessage({
    type: 'placeOrder',
    orderId,
    contract: {
      symbol: params.symbol,
      secType: 'STK',
      exchange: 'SMART',
      currency: 'USD'
    },
    order: {
      action: params.action,
      orderType: 'TRAIL',
      totalQuantity: params.quantity,
      trailingPercent: params.trailingPercent,
      trailingAmount: params.trailingAmount,
      transmit: true
    }
  });
  
  orders.set(orderId, {
    orderId,
    symbol: params.symbol,
    action: params.action,
    quantity: params.quantity,
    orderType: 'TRAIL',
    status: 'pending',
    createdAt: new Date()
  });
  
  return orderId;
}

// ==================== API ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connected: isConnected,
    nextOrderId,
    ordersCount: orders.size,
    bracketOrdersCount: bracketOrders.size
  });
});

// Get connection status
app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    config: {
      host: IB_CONFIG.host,
      port: IB_CONFIG.port,
      clientId: IB_CONFIG.clientId
    }
  });
});

// Place simple order
app.post('/order', async (req, res) => {
  try {
    const { symbol, action, quantity, orderType, limitPrice, stopPrice } = req.body;
    
    if (!symbol || !action || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, action, quantity'
      });
    }
    
    const orderId = await placeSingleOrder({
      symbol,
      action: action.toUpperCase() as 'BUY' | 'SELL',
      quantity,
      orderType: orderType || 'MKT',
      limitPrice,
      stopPrice
    });
    
    res.json({
      success: true,
      orderId,
      message: 'Order placed successfully'
    });
    
  } catch (error) {
    console.error('[IB] Order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place order'
    });
  }
});

// Place bracket order
app.post('/order/bracket', async (req, res) => {
  try {
    const { symbol, action, quantity, entryPrice, stopLoss, takeProfit } = req.body;
    
    if (!symbol || !action || !quantity || !entryPrice || !stopLoss || !takeProfit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, action, quantity, entryPrice, stopLoss, takeProfit'
      });
    }
    
    // التحقق من صحة الأسعار
    if (action.toUpperCase() === 'BUY') {
      if (stopLoss >= entryPrice) {
        return res.status(400).json({
          success: false,
          error: 'Stop loss must be below entry price for BUY orders'
        });
      }
      if (takeProfit <= entryPrice) {
        return res.status(400).json({
          success: false,
          error: 'Take profit must be above entry price for BUY orders'
        });
      }
    } else {
      if (stopLoss <= entryPrice) {
        return res.status(400).json({
          success: false,
          error: 'Stop loss must be above entry price for SELL orders'
        });
      }
      if (takeProfit >= entryPrice) {
        return res.status(400).json({
          success: false,
          error: 'Take profit must be below entry price for SELL orders'
        });
      }
    }
    
    const bracketOrder = await placeBracketOrder({
      symbol,
      action: action.toUpperCase() as 'BUY' | 'SELL',
      quantity,
      entryPrice,
      stopLoss,
      takeProfit
    });
    
    res.json({
      success: true,
      bracketOrder,
      message: 'Bracket order placed successfully'
    });
    
  } catch (error) {
    console.error('[IB] Bracket order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place bracket order'
    });
  }
});

// Place trailing stop
app.post('/order/trailing-stop', async (req, res) => {
  try {
    const { symbol, action, quantity, trailingPercent, trailingAmount } = req.body;
    
    if (!symbol || !action || !quantity || (!trailingPercent && !trailingAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, action, quantity, trailingPercent or trailingAmount'
      });
    }
    
    const orderId = await placeTrailingStop({
      symbol,
      action: action.toUpperCase() as 'BUY' | 'SELL',
      quantity,
      trailingPercent,
      trailingAmount
    });
    
    res.json({
      success: true,
      orderId,
      message: 'Trailing stop placed successfully'
    });
    
  } catch (error) {
    console.error('[IB] Trailing stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place trailing stop'
    });
  }
});

// Cancel order
app.delete('/order/:orderId', (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (!orders.has(orderId)) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    sendMessage({
      type: 'cancelOrder',
      orderId
    });
    
    const order = orders.get(orderId)!;
    order.status = 'cancelled';
    orders.set(orderId, order);
    
    res.json({
      success: true,
      message: 'Order cancelled'
    });
    
  } catch (error) {
    console.error('[IB] Cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

// Get order status
app.get('/order/:orderId', (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const order = orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }
  
  res.json({
    success: true,
    order
  });
});

// Get bracket order status
app.get('/order/bracket/:bracketId', (req, res) => {
  const bracketId = req.params.bracketId;
  const bracket = bracketOrders.get(bracketId);
  
  if (!bracket) {
    return res.status(404).json({
      success: false,
      error: 'Bracket order not found'
    });
  }
  
  res.json({
    success: true,
    bracketOrder: bracket,
    parentOrder: orders.get(bracket.parentOrderId),
    stopLossOrder: orders.get(bracket.stopLossOrderId),
    takeProfitOrder: orders.get(bracket.takeProfitOrderId)
  });
});

// Get all orders
app.get('/orders', (req, res) => {
  res.json({
    success: true,
    orders: Array.from(orders.values()),
    bracketOrders: Array.from(bracketOrders.values())
  });
});

// Connect to IB
app.post('/connect', async (req, res) => {
  const connected = await connectToIB();
  res.json({
    success: connected,
    message: connected ? 'Connected to IB' : 'Failed to connect to IB'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`[IB Service] Running on port ${PORT}`);
  console.log(`[IB Service] Connecting to TWS/Gateway at ${IB_CONFIG.host}:${IB_CONFIG.port}`);
  
  // محاولة الاتصال عند البدء
  connectToIB();
});

export { placeBracketOrder, placeSingleOrder, placeTrailingStop };