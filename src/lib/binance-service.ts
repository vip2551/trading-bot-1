/**
 * Binance API Service - Real & Testnet Trading
 * Supports both Mainnet (real) and Testnet (demo) trading
 * REST API + WebSocket for real-time data
 */

import crypto from 'crypto';

// Binance API Configuration
export interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  testnet: boolean; // true = demo, false = real
}

// Order types
export interface BinanceOrder {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  newClientOrderId?: string;
}

// Order response
export interface BinanceOrderResponse {
  orderId: number;
  symbol: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  clientOrderId: string;
  price: string;
  avgPrice: string;
  origQty: string;
  executedQty: string;
  type: string;
  side: string;
  transactTime: number;
}

// Account info
export interface BinanceAccountInfo {
  makerCommission: number;
  takerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  balances: BinanceBalance[];
}

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

// Market data
export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

// Position (for futures)
export interface BinancePosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  positionSide: 'BOTH' | 'LONG' | 'SHORT';
}

// Trade history
export interface BinanceTrade {
  id: number;
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
}

export class BinanceService {
  private config: BinanceConfig | null = null;
  private baseUrl: string = '';
  private futuresUrl: string = '';
  private wsUrl: string = '';
  private wsConnections: Map<string, WebSocket> = new Map();
  private connected: boolean = false;

  constructor() {
    console.log('[Binance] Service initialized');
  }

  // Configure the service
  configure(config: BinanceConfig): void {
    this.config = config;
    
    if (config.testnet) {
      // Testnet URLs (Demo)
      this.baseUrl = 'https://testnet.binance.vision/api';
      this.futuresUrl = 'https://testnet.binancefuture.com/fapi';
      this.wsUrl = 'wss://stream.testnet.binance.vision/ws';
      console.log('[Binance] Configured for TESTNET (Demo)');
    } else {
      // Mainnet URLs (Real)
      this.baseUrl = 'https://api.binance.com/api';
      this.futuresUrl = 'https://fapi.binance.com/fapi';
      this.wsUrl = 'wss://stream.binance.com:9443/ws';
      console.log('[Binance] Configured for MAINNET (Real)');
    }
  }

  // Check if configured
  isConfigured(): boolean {
    return this.config !== null;
  }

  // Generate signature for authenticated requests
  private generateSignature(queryString: string): string {
    if (!this.config) throw new Error('Binance not configured');
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  // Make authenticated request
  private async request(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: Record<string, any> = {},
    isFutures: boolean = false
  ): Promise<any> {
    if (!this.config) throw new Error('Binance not configured');

    const baseUrl = isFutures ? this.futuresUrl : this.baseUrl;
    const timestamp = Date.now();
    params.timestamp = timestamp;
    params.recvWindow = 60000;

    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Generate signature
    const signature = this.generateSignature(queryString);

    // Build URL
    const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-MBX-APIKEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || `Binance API error: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('[Binance] API error:', error);
      throw error;
    }
  }

  // Public request (no auth needed)
  private async publicRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const url = queryString 
      ? `${this.baseUrl}${endpoint}?${queryString}`
      : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url);
    return response.json();
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config) {
        return { success: false, message: 'Binance not configured' };
      }

      // Try to get server time
      const time = await this.publicRequest('/v3/time');
      
      // Try to get account info (tests API keys)
      const account = await this.request('GET', '/v3/account');
      
      this.connected = true;
      return { 
        success: true, 
        message: `Connected to Binance ${this.config.testnet ? 'Testnet' : 'Mainnet'}. Can trade: ${account.canTrade}` 
      };
    } catch (error: any) {
      this.connected = false;
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
  }

  // Get account info
  async getAccountInfo(): Promise<BinanceAccountInfo> {
    return this.request('GET', '/v3/account');
  }

  // Get balances (non-zero only)
  async getBalances(): Promise<BinanceBalance[]> {
    const account = await this.getAccountInfo();
    return account.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
  }

  // Get ticker price
  async getPrice(symbol: string): Promise<number> {
    const ticker = await this.publicRequest('/v3/ticker/price', { symbol });
    return parseFloat(ticker.price);
  }

  // Get 24h ticker
  async get24hTicker(symbol: string): Promise<BinanceTicker> {
    return this.publicRequest('/v3/ticker/24hr', { symbol });
  }

  // Get order book
  async getOrderBook(symbol: string, limit: number = 10): Promise<any> {
    return this.publicRequest('/v3/depth', { symbol, limit });
  }

  // Place order - Spot
  async placeOrder(order: BinanceOrder): Promise<BinanceOrderResponse> {
    const params: Record<string, any> = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
    };

    if (order.price && (order.type === 'LIMIT' || order.type === 'STOP_LOSS_LIMIT' || order.type === 'TAKE_PROFIT_LIMIT')) {
      params.price = order.price;
      params.timeInForce = order.timeInForce || 'GTC';
    }

    if (order.stopPrice) {
      params.stopPrice = order.stopPrice;
    }

    if (order.newClientOrderId) {
      params.newClientOrderId = order.newClientOrderId;
    }

    return this.request('POST', '/v3/order', params);
  }

  // Place market order
  async placeMarketOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number): Promise<BinanceOrderResponse> {
    return this.placeOrder({
      symbol,
      side,
      type: 'MARKET',
      quantity,
    });
  }

  // Place limit order
  async placeLimitOrder(
    symbol: string, 
    side: 'BUY' | 'SELL', 
    quantity: number, 
    price: number
  ): Promise<BinanceOrderResponse> {
    return this.placeOrder({
      symbol,
      side,
      type: 'LIMIT',
      quantity,
      price,
      timeInForce: 'GTC',
    });
  }

  // Cancel order
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    return this.request('DELETE', '/v3/order', { symbol, orderId });
  }

  // Get open orders
  async getOpenOrders(symbol?: string): Promise<any[]> {
    const params: Record<string, any> = {};
    if (symbol) params.symbol = symbol;
    return this.request('GET', '/v3/openOrders', params);
  }

  // Get order status
  async getOrder(symbol: string, orderId: number): Promise<any> {
    return this.request('GET', '/v3/order', { symbol, orderId });
  }

  // Get trade history
  async getMyTrades(symbol: string, limit: number = 100): Promise<BinanceTrade[]> {
    return this.request('GET', '/v3/myTrades', { symbol, limit });
  }

  // ========== FUTURES METHODS ==========

  // Get futures account balance
  async getFuturesBalance(): Promise<any[]> {
    return this.request('GET', '/v2/balance', {}, true);
  }

  // Get futures positions
  async getFuturesPositions(): Promise<BinancePosition[]> {
    return this.request('GET', '/v2/positionRisk', {}, true);
  }

  // Place futures order
  async placeFuturesOrder(order: BinanceOrder, positionSide?: 'LONG' | 'SHORT'): Promise<any> {
    const params: Record<string, any> = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
    };

    if (positionSide) {
      params.positionSide = positionSide;
    }

    if (order.price && (order.type === 'LIMIT' || order.type === 'STOP_LOSS_LIMIT' || order.type === 'TAKE_PROFIT_LIMIT')) {
      params.price = order.price;
      params.timeInForce = order.timeInForce || 'GTC';
    }

    if (order.stopPrice) {
      params.stopPrice = order.stopPrice;
    }

    return this.request('POST', '/v1/order', params, true);
  }

  // Set leverage
  async setLeverage(symbol: string, leverage: number): Promise<any> {
    return this.request('POST', '/v1/leverage', { symbol, leverage }, true);
  }

  // Close futures position
  async closeFuturesPosition(symbol: string, side: 'BUY' | 'SELL', quantity: number): Promise<any> {
    return this.placeFuturesOrder({
      symbol,
      side: side === 'BUY' ? 'SELL' : 'BUY',
      type: 'MARKET',
      quantity,
    });
  }

  // ========== WEBSOCKET ==========

  // Subscribe to ticker updates
  subscribeToTicker(symbol: string, callback: (data: any) => void): void {
    const wsSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`${this.wsUrl}/${wsSymbol}@ticker`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    ws.onerror = (error) => {
      console.error('[Binance] WebSocket error:', error);
    };

    this.wsConnections.set(`ticker_${symbol}`, ws);
  }

  // Subscribe to kline/candlestick
  subscribeToKlines(symbol: string, interval: string, callback: (data: any) => void): void {
    const wsSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`${this.wsUrl}/${wsSymbol}@kline_${interval}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    this.wsConnections.set(`kline_${symbol}_${interval}`, ws);
  }

  // Unsubscribe from WebSocket
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

  // Get exchange info
  async getExchangeInfo(): Promise<any> {
    return this.publicRequest('/v3/exchangeInfo');
  }

  // Get supported symbols
  async getSupportedSymbols(): Promise<string[]> {
    const info = await this.getExchangeInfo();
    return info.symbols.map((s: any) => s.symbol);
  }

  // Convert asset (for simple trades)
  async convertAsset(fromAsset: string, toAsset: string, amount: number): Promise<any> {
    // This uses Binance Convert API
    const params = {
      fromAsset,
      toAsset,
      fromAmount: amount,
    };
    return this.request('POST', '/v1/convert/quote', params);
  }

  // ========== HELPER METHODS ==========

  // Calculate quantity from USDT amount
  async calculateQuantity(symbol: string, usdtAmount: number): Promise<number> {
    const price = await this.getPrice(symbol);
    const info = await this.getExchangeInfo();
    const symbolInfo = info.symbols.find((s: any) => s.symbol === symbol);
    
    if (!symbolInfo) throw new Error(`Symbol ${symbol} not found`);
    
    const lotSize = symbolInfo.filters.find((f: any) => f.filterType === 'LOT_SIZE');
    const stepSize = parseFloat(lotSize?.stepSize || '0.00000001');
    
    const rawQty = usdtAmount / price;
    const precision = Math.round(-Math.log10(stepSize));
    const quantity = Math.floor(rawQty * Math.pow(10, precision)) / Math.pow(10, precision);
    
    return quantity;
  }

  // Format price according to symbol rules
  async formatPrice(symbol: string, price: number): Promise<string> {
    const info = await this.getExchangeInfo();
    const symbolInfo = info.symbols.find((s: any) => s.symbol === symbol);
    
    if (!symbolInfo) return price.toString();
    
    const priceFilter = symbolInfo.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
    const tickSize = parseFloat(priceFilter?.tickSize || '0.00000001');
    const precision = Math.round(-Math.log10(tickSize));
    
    return price.toFixed(precision);
  }

  // Disconnect
  disconnect(): void {
    this.closeAllConnections();
    this.config = null;
    this.connected = false;
    console.log('[Binance] Disconnected');
  }
}

// Singleton instance
export const binanceService = new BinanceService();
