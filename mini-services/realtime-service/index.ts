import { createServer } from 'http';
import { Server } from 'socket.io';
import { setInterval } from 'timers';

// ═══════════════════════════════════════════════════════════════════════════════
// 📡 REAL-TIME SERVICE - Safe Market Data Broadcasting
// ═══════════════════════════════════════════════════════════════════════════════

const PORT = 3006; // Changed from 3004 to avoid conflict with trade-monitor

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRADING MODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

type TradingMode = 'SIMULATION' | 'PAPER' | 'LIVE';

const MODE: TradingMode = (process.env.TRADING_MODE as TradingMode) || 'PAPER';

const MODE_CONFIG = {
  SIMULATION: {
    name: 'Simulation',
    emoji: '🧪',
    allowFakeData: true,
  },
  PAPER: {
    name: 'Paper Trading',
    emoji: '📝',
    allowFakeData: false,
  },
  LIVE: {
    name: 'Live Trading',
    emoji: '🔴',
    allowFakeData: false,
  },
} as const;

const getCurrentModeConfig = () => MODE_CONFIG[MODE];

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store connected clients and their subscriptions
const clients = new Map<string, {
  userId?: string;
  subscriptions: Set<string>;
  lastPing: number;
}>();

// Market data state
let marketData = {
  spx: { price: 0, bid: 0, ask: 0, volume: 0, lastUpdate: new Date(), isReal: false },
  vix: { price: 0, bid: 0, ask: 0, volume: 0, lastUpdate: new Date(), isReal: false },
};

// Active alerts
const priceAlerts = new Map<string, {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  triggered: boolean;
  createdAt: Date;
}>();

// Health status
let healthStatus = {
  ib: { connected: false, lastUpdate: new Date(), latency: 0 },
  database: { connected: true, lastUpdate: new Date() },
  server: { uptime: Date.now(), memory: process.memoryUsage().heapUsed },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 REAL MARKET DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchRealMarketData(): Promise<void> {
  const modeConfig = getCurrentModeConfig();
  
  try {
    // Try to fetch from price API
    const res = await fetch('http://localhost:3000/api/price?symbol=SPX', {
      signal: AbortSignal.timeout(3000)
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.price && data.simulated !== true) {
        marketData.spx = {
          price: data.price,
          bid: data.price - 0.5,
          ask: data.price + 0.5,
          volume: data.volume || 0,
          lastUpdate: new Date(),
          isReal: true,
        };
        return;
      }
    }
  } catch {
    // Price API not available
  }
  
  // In non-simulation mode, mark data as not real
  if (!modeConfig.allowFakeData) {
    console.warn('⚠️ لا توجد بيانات حقيقية - لن يتم تحديث الأسعار');
    return;
  }
  
  // Only in SIMULATION mode, simulate data
  console.log('🧪 [SIMULATION] محاكاة بيانات السوق');
  marketData.spx = {
    price: 5800 + (Math.random() - 0.5) * 20,
    bid: 5799.5,
    ask: 5800.5,
    volume: 1000000,
    lastUpdate: new Date(),
    isReal: false,
  };
  
  marketData.vix = {
    price: 15 + (Math.random() - 0.5) * 2,
    bid: 15.4,
    ask: 15.6,
    volume: 500000,
    lastUpdate: new Date(),
    isReal: false,
  };
}

// Connection handler
io.on('connection', (socket) => {
  const modeConfig = getCurrentModeConfig();
  console.log(`[WS] Client connected: ${socket.id}`);
  
  clients.set(socket.id, {
    subscriptions: new Set(),
    lastPing: Date.now(),
  });

  // Send initial data
  socket.emit('connected', { 
    id: socket.id, 
    timestamp: new Date(),
    mode: MODE,
    marketData,
    health: healthStatus,
  });

  // Handle user authentication
  socket.on('auth', (data: { userId: string }) => {
    const client = clients.get(socket.id);
    if (client) {
      client.userId = data.userId;
      console.log(`[WS] Client ${socket.id} authenticated as ${data.userId}`);
    }
  });

  // Handle subscriptions
  socket.on('subscribe', (channels: string[]) => {
    const client = clients.get(socket.id);
    if (client) {
      channels.forEach(ch => client.subscriptions.add(ch));
      console.log(`[WS] Client ${socket.id} subscribed to: ${channels.join(', ')}`);
    }
  });

  socket.on('unsubscribe', (channels: string[]) => {
    const client = clients.get(socket.id);
    if (client) {
      channels.forEach(ch => client.subscriptions.delete(ch));
    }
  });

  // Handle ping for latency measurement
  socket.on('ping', (timestamp: number) => {
    const client = clients.get(socket.id);
    if (client) {
      client.lastPing = Date.now();
      socket.emit('pong', { clientTime: timestamp, serverTime: Date.now() });
    }
  });

  // Handle price alert creation
  socket.on('create-alert', (data: {
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
  }) => {
    const client = clients.get(socket.id);
    if (client?.userId) {
      const alertId = `${client.userId}-${data.symbol}-${Date.now()}`;
      priceAlerts.set(alertId, {
        id: alertId,
        userId: client.userId,
        symbol: data.symbol,
        targetPrice: data.targetPrice,
        condition: data.condition,
        triggered: false,
        createdAt: new Date(),
      });
      socket.emit('alert-created', { id: alertId, ...data });
      console.log(`[WS] Alert created: ${alertId}`);
    }
  });

  // Handle price alert deletion
  socket.on('delete-alert', (alertId: string) => {
    priceAlerts.delete(alertId);
    socket.emit('alert-deleted', alertId);
  });

  // Handle trade updates from main app
  socket.on('trade-update', (data: any) => {
    // Broadcast to all subscribers of trade channel
    io.emit('trade-update', data);
  });

  // Handle position updates
  socket.on('position-update', (data: any) => {
    io.emit('position-update', data);
  });

  // Handle health status update
  socket.on('health-update', (data: any) => {
    healthStatus = { ...healthStatus, ...data };
    io.emit('health-status', healthStatus);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    clients.delete(socket.id);
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Market data update loop
setInterval(async () => {
  await fetchRealMarketData();
  
  // Broadcast to all clients subscribed to market data
  clients.forEach((client, socketId) => {
    if (client.subscriptions.has('market') || client.subscriptions.has('all')) {
      io.to(socketId).emit('market-data', {
        ...marketData,
        mode: MODE,
      });
    }
  });

  // Check price alerts
  priceAlerts.forEach((alert, alertId) => {
    if (alert.triggered) return;

    const currentPrice = alert.symbol === 'SPX' ? marketData.spx.price : marketData.vix.price;
    
    // Only check alerts if we have real data
    if (currentPrice <= 0) return;
    
    let triggered = false;

    if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
      triggered = true;
    } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
      triggered = true;
    }

    if (triggered) {
      alert.triggered = true;
      
      // Find client and send alert
      clients.forEach((client, socketId) => {
        if (client.userId === alert.userId) {
          io.to(socketId).emit('price-alert', {
            ...alert,
            currentPrice,
            triggeredAt: new Date(),
          });
        }
      });

      console.log(`[WS] Alert triggered: ${alertId} at ${currentPrice}`);
    }
  });

}, 1000); // Every second

// Health check broadcast every 5 seconds
setInterval(() => {
  healthStatus.server.memory = process.memoryUsage().heapUsed;
  healthStatus.database.lastUpdate = new Date();

  io.emit('health-status', healthStatus);
}, 5000);

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 START SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

const modeConfig = getCurrentModeConfig();

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       📡 REAL-TIME SERVICE - SAFE MODE                    ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║ ${modeConfig.emoji} Mode: ${modeConfig.name.padEnd(48)}║`);
console.log(`║ 📡 Port: ${PORT}                                               ║`);
console.log(`║ 🔒 Allow Fake Data: ${String(modeConfig.allowFakeData).padEnd(32)}║`);
console.log('╚════════════════════════════════════════════════════════════╝');

// Start server
httpServer.listen(PORT, () => {
  console.log(`✅ Real-time service running safely on port ${PORT}`);
});
