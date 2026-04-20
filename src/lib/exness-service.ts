/**
 * Exness API Service - Real & Demo Trading
 * Supports both Real and Demo accounts
 * REST API for trading operations
 * 
 * Note: Exness uses MetaTrader 4/5 and also provides a Partner API
 * This service implements both REST API and MT4/5 bridge functionality
 */

import crypto from 'crypto';

// Exness API Configuration
export interface ExnessConfig {
  apiKey: string;
  apiSecret: string;
  accountId?: string;
  demo: boolean; // true = demo account, false = real account
}

// Order types
export interface ExnessOrder {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  volume: number; // in lots
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
  magic?: number;
  expiration?: Date;
}

// Order response
export interface ExnessOrderResponse {
  orderId: string;
  symbol: string;
  side: string;
  type: string;
  volume: number;
  price: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  message?: string;
  openPrice?: number;
  openTime?: string;
}

// Account info
export interface ExnessAccountInfo {
  accountId: string;
  accountName: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  accountType: 'REAL' | 'DEMO';
}

// Position
export interface ExnessPosition {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  comment: string;
  magic: number;
}

// Symbol info
export interface ExnessSymbol {
  symbol: string;
  description: string;
  bid: number;
  ask: number;
  spread: number;
  digits: number;
  point: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  marginRequired: number;
  contractSize: number;
}

// Trade history
export interface ExnessTrade {
  ticket: number;
  order: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  price: number;
  profit: number;
  swap: number;
  commission: number;
  time: string;
  comment: string;
}

// Candle/OHLCV
export interface ExnessCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class ExnessService {
  private config: ExnessConfig | null = null;
  private baseUrl: string = '';
  private partnerUrl: string = '';
  private wsUrl: string = '';
  private wsConnections: Map<string, WebSocket> = new Map();
  private connected: boolean = false;
  private accessToken: string | null = null;

  constructor() {
    console.log('[Exness] Service initialized');
  }

  // Configure the service
  configure(config: ExnessConfig): void {
    this.config = config;
    
    if (config.demo) {
      // Demo account URLs
      this.baseUrl = 'https://demo-api.exness.com';
      this.partnerUrl = 'https://partner-api-demo.exness.com';
      this.wsUrl = 'wss://demo-ws.exness.com';
      console.log('[Exness] Configured for DEMO account');
    } else {
      // Real account URLs
      this.baseUrl = 'https://api.exness.com';
      this.partnerUrl = 'https://partner-api.exness.com';
      this.wsUrl = 'wss://ws.exness.com';
      console.log('[Exness] Configured for REAL account');
    }
  }

  // Check if configured
  isConfigured(): boolean {
    return this.config !== null;
  }

  // Generate signature for authenticated requests
  private generateSignature(timestamp: string, method: string, path: string, body: string = ''): string {
    if (!this.config) throw new Error('Exness not configured');
    
    const message = timestamp + method + path + body;
    const signature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(message)
      .digest('hex');
    
    return signature;
  }

  // Make authenticated request
  private async request(
    method: 'GET' | 'POST' | 'DELETE' | 'PUT',
    path: string,
    body?: any
  ): Promise<any> {
    if (!this.config) throw new Error('Exness not configured');

    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(timestamp, method, path, bodyStr);

    const url = this.baseUrl + path;

    try {
      const headers: Record<string, string> = {
        'X-API-Key': this.config.apiKey,
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'Content-Type': 'application/json',
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Exness API error: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('[Exness] API error:', error);
      throw error;
    }
  }

  // Public request
  private async publicRequest(path: string): Promise<any> {
    const url = this.baseUrl + path;
    const response = await fetch(url);
    return response.json();
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config) {
        return { success: false, message: 'Exness not configured' };
      }

      // Try to get account info
      const account = await this.getAccountInfo();
      
      this.connected = true;
      return { 
        success: true, 
        message: `Connected to Exness ${this.config.demo ? 'Demo' : 'Real'} account. Balance: ${account.balance} ${account.currency}` 
      };
    } catch (error: any) {
      this.connected = false;
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
  }

  // Authenticate and get access token
  async authenticate(): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      const response = await this.request('POST', '/auth/token', {
        api_key: this.config?.apiKey,
        api_secret: this.config?.apiSecret,
      });

      if (response.token) {
        this.accessToken = response.token;
        return { success: true, token: response.token };
      }

      return { success: false, message: 'Authentication failed' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Get account info
  async getAccountInfo(): Promise<ExnessAccountInfo> {
    const response = await this.request('GET', '/api/v1/account');
    return response;
  }

  // Get account balance
  async getBalance(): Promise<{ balance: number; equity: number; freeMargin: number }> {
    const account = await this.getAccountInfo();
    return {
      balance: account.balance,
      equity: account.equity,
      freeMargin: account.freeMargin,
    };
  }

  // Get symbols
  async getSymbols(): Promise<ExnessSymbol[]> {
    const response = await this.request('GET', '/api/v1/symbols');
    return response.symbols || response;
  }

  // Get symbol info
  async getSymbolInfo(symbol: string): Promise<ExnessSymbol> {
    const response = await this.request('GET', `/api/v1/symbols/${symbol}`);
    return response;
  }

  // Get current price
  async getPrice(symbol: string): Promise<{ bid: number; ask: number; spread: number }> {
    const response = await this.request('GET', `/api/v1/quotes/${symbol}`);
    return {
      bid: response.bid,
      ask: response.ask,
      spread: response.spread,
    };
  }

  // Get multiple prices
  async getPrices(symbols: string[]): Promise<Map<string, { bid: number; ask: number }>> {
    const response = await this.request('POST', '/api/v1/quotes', { symbols });
    const prices = new Map<string, { bid: number; ask: number }>();
    
    response.forEach((quote: any) => {
      prices.set(quote.symbol, { bid: quote.bid, ask: quote.ask });
    });
    
    return prices;
  }

  // Place order
  async placeOrder(order: ExnessOrder): Promise<ExnessOrderResponse> {
    const body: Record<string, any> = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      volume: order.volume,
    };

    if (order.price) body.price = order.price;
    if (order.stopLoss) body.stop_loss = order.stopLoss;
    if (order.takeProfit) body.take_profit = order.takeProfit;
    if (order.comment) body.comment = order.comment;
    if (order.magic) body.magic = order.magic;
    if (order.expiration) body.expiration = order.expiration.toISOString();

    return this.request('POST', '/api/v1/orders', body);
  }

  // Place market order
  async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    volume: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<ExnessOrderResponse> {
    return this.placeOrder({
      symbol,
      side,
      type: 'MARKET',
      volume,
      stopLoss,
      takeProfit,
    });
  }

  // Place limit order
  async placeLimitOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    volume: number,
    price: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<ExnessOrderResponse> {
    return this.placeOrder({
      symbol,
      side,
      type: 'LIMIT',
      volume,
      price,
      stopLoss,
      takeProfit,
    });
  }

  // Place stop order
  async placeStopOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    volume: number,
    stopPrice: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<ExnessOrderResponse> {
    return this.placeOrder({
      symbol,
      side,
      type: 'STOP',
      volume,
      price: stopPrice,
      stopLoss,
      takeProfit,
    });
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    return this.request('DELETE', `/api/v1/orders/${orderId}`);
  }

  // Modify order
  async modifyOrder(
    orderId: string,
    modifications: {
      stopLoss?: number;
      takeProfit?: number;
      price?: number;
    }
  ): Promise<ExnessOrderResponse> {
    return this.request('PUT', `/api/v1/orders/${orderId}`, modifications);
  }

  // Get open positions
  async getPositions(): Promise<ExnessPosition[]> {
    const response = await this.request('GET', '/api/v1/positions');
    return response.positions || response;
  }

  // Get position by ticket
  async getPosition(ticket: number): Promise<ExnessPosition> {
    return this.request('GET', `/api/v1/positions/${ticket}`);
  }

  // Close position
  async closePosition(ticket: number, volume?: number): Promise<ExnessOrderResponse> {
    const body: Record<string, any> = {};
    if (volume) body.volume = volume;
    
    return this.request('POST', `/api/v1/positions/${ticket}/close`, body);
  }

  // Close all positions
  async closeAllPositions(symbol?: string): Promise<{ success: boolean; closed: number }> {
    const body: Record<string, any> = {};
    if (symbol) body.symbol = symbol;
    
    const response = await this.request('POST', '/api/v1/positions/close-all', body);
    return response;
  }

  // Get pending orders
  async getPendingOrders(): Promise<ExnessOrderResponse[]> {
    const response = await this.request('GET', '/api/v1/orders/pending');
    return response.orders || response;
  }

  // Get trade history
  async getTradeHistory(
    from?: Date,
    to?: Date,
    symbol?: string,
    limit: number = 100
  ): Promise<ExnessTrade[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (from) params.append('from', from.toISOString());
    if (to) params.append('to', to.toISOString());
    if (symbol) params.append('symbol', symbol);
    
    const response = await this.request('GET', `/api/v1/history?${params.toString()}`);
    return response.trades || response;
  }

  // Get order history
  async getOrderHistory(limit: number = 100): Promise<ExnessOrderResponse[]> {
    const response = await this.request('GET', `/api/v1/orders/history?limit=${limit}`);
    return response.orders || response;
  }

  // Calculate margin required
  async calculateMargin(
    symbol: string,
    volume: number,
    side: 'BUY' | 'SELL'
  ): Promise<{ margin: number; profit: number }> {
    const response = await this.request('POST', '/api/v1/calculate/margin', {
      symbol,
      volume,
      side,
    });
    return response;
  }

  // Get candlestick data
  async getCandles(
    symbol: string,
    timeframe: 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1',
    from?: Date,
    to?: Date,
    limit: number = 100
  ): Promise<ExnessCandle[]> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    params.append('limit', limit.toString());
    if (from) params.append('from', from.toISOString());
    if (to) params.append('to', to.toISOString());
    
    const response = await this.request('GET', `/api/v1/candles/${symbol}?${params.toString()}`);
    return response.candles || response;
  }

  // ========== WEBSOCKET ==========

  // Subscribe to quotes
  subscribeToQuotes(symbols: string[], callback: (data: any) => void): void {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'quotes',
        symbols,
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.channel === 'quotes') {
        callback(data);
      }
    };

    ws.onerror = (error) => {
      console.error('[Exness] WebSocket error:', error);
    };

    this.wsConnections.set('quotes', ws);
  }

  // Subscribe to account updates
  subscribeToAccount(callback: (data: any) => void): void {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'account',
        api_key: this.config?.apiKey,
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.channel === 'account') {
        callback(data);
      }
    };

    this.wsConnections.set('account', ws);
  }

  // Subscribe to position updates
  subscribeToPositions(callback: (data: any) => void): void {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'positions',
        api_key: this.config?.apiKey,
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.channel === 'positions') {
        callback(data);
      }
    };

    this.wsConnections.set('positions', ws);
  }

  // Unsubscribe
  unsubscribe(key: string): void {
    const ws = this.wsConnections.get(key);
    if (ws) {
      ws.close();
      this.wsConnections.delete(key);
    }
  }

  // Close all WebSocket connections
  closeAllConnections(): void {
    this.wsConnections.forEach((ws) => ws.close());
    this.wsConnections.clear();
  }

  // ========== HELPER METHODS ==========

  // Calculate lot size from risk percentage
  calculateLotSize(
    accountBalance: number,
    riskPercent: number,
    stopLossPips: number,
    pipValue: number = 10
  ): number {
    const riskAmount = accountBalance * (riskPercent / 100);
    const lotSize = riskAmount / (stopLossPips * pipValue);
    return Math.floor(lotSize * 100) / 100; // Round to 2 decimal places
  }

  // Calculate pip value
  calculatePipValue(symbol: string, lotSize: number): number {
    // Standard pip values (simplified)
    const pipValues: Record<string, number> = {
      'EURUSD': 10,
      'GBPUSD': 10,
      'USDJPY': 9.09,
      'XAUUSD': 10,
      'XAGUSD': 50,
    };
    
    return (pipValues[symbol] || 10) * lotSize;
  }

  // Format price according to symbol
  formatPrice(symbol: string, price: number): string {
    // JPY pairs have 3 decimal places
    if (symbol.includes('JPY')) {
      return price.toFixed(3);
    }
    // Gold/Silver
    if (symbol.includes('XAU') || symbol.includes('XAG')) {
      return price.toFixed(2);
    }
    // Most forex pairs
    return price.toFixed(5);
  }

  // Disconnect
  disconnect(): void {
    this.closeAllConnections();
    this.config = null;
    this.connected = false;
    this.accessToken = null;
    console.log('[Exness] Disconnected');
  }
}

// Singleton instance
export const exnessService = new ExnessService();

// ========== POPULAR FOREX PAIRS ==========

export const FOREX_PAIRS = [
  // Major pairs
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'major' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'major' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'major' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'major' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'major' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'major' },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', category: 'major' },
  
  // Minor pairs
  { symbol: 'EURGBP', name: 'Euro / British Pound', category: 'minor' },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', category: 'minor' },
  { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', category: 'minor' },
  { symbol: 'AUDJPY', name: 'Australian Dollar / Japanese Yen', category: 'minor' },
  { symbol: 'EURAUD', name: 'Euro / Australian Dollar', category: 'minor' },
  
  // Metals
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'metals' },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'metals' },
  
  // Crypto (if available)
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'crypto' },
  
  // Indices (if available)
  { symbol: 'US30', name: 'Dow Jones 30', category: 'indices' },
  { symbol: 'US500', name: 'S&P 500', category: 'indices' },
  { symbol: 'NAS100', name: 'Nasdaq 100', category: 'indices' },
];

// Get popular pairs
export function getPopularPairs(category?: string): typeof FOREX_PAIRS {
  if (category) {
    return FOREX_PAIRS.filter(p => p.category === category);
  }
  return FOREX_PAIRS;
}
