/**
 * Coinbase/Pro API Service - Real & Sandbox Trading
 * Supports both Production (real) and Sandbox (demo) trading
 * REST API + WebSocket for real-time data
 */

import crypto from 'crypto';

// Coinbase API Configuration
export interface CoinbaseConfig {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  sandbox: boolean; // true = demo, false = real
}

// Order types
export interface CoinbaseOrder {
  product_id: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop';
  size?: number;
  funds?: number; // for market orders in quote currency
  price?: number;
  stop_price?: number;
  stop?: 'loss' | 'entry';
  time_in_force?: 'GTC' | 'GTT' | 'IOC' | 'FOK';
  cancel_after?: 'min' | 'hour' | 'day';
  post_only?: boolean;
}

// Order response
export interface CoinbaseOrderResponse {
  id: string;
  product_id: string;
  side: string;
  type: string;
  status: 'pending' | 'open' | 'active' | 'done' | 'settled' | 'cancelled' | 'all';
  size: string;
  funds?: string;
  specified_funds?: string;
  executed_value: string;
  fill_fees: string;
  filled_size: string;
  price: string;
  created_at: string;
  done_at?: string;
  done_reason?: string;
}

// Account info
export interface CoinbaseAccount {
  id: string;
  currency: string;
  balance: string;
  available: string;
  hold: string;
  profile_id: string;
  trading_enabled: boolean;
}

// Product info
export interface CoinbaseProduct {
  id: string;
  base_currency: string;
  quote_currency: string;
  base_min_size: string;
  base_max_size: string;
  quote_increment: string;
  base_increment: string;
  display_name: string;
  min_market_funds: string;
  max_market_funds: string;
  margin_enabled: boolean;
  status: string;
  status_message: string;
}

// Ticker
export interface CoinbaseTicker {
  trade_id: number;
  price: string;
  size: string;
  bid: string;
  ask: string;
  volume: string;
  time: string;
}

// Candle
export interface CoinbaseCandle {
  time: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

// Position (for margin/futures)
export interface CoinbasePosition {
  id: string;
  product_id: string;
  status: string;
  side: string;
  size: string;
  entry_price: string;
  current_price: string;
  unrealized_pnl: string;
  realized_pnl: string;
  margin_type: string;
  leverage: number;
}

// Trade
export interface CoinbaseTrade {
  trade_id: number;
  product_id: string;
  price: string;
  size: string;
  time: string;
  side: string;
  order_id: string;
  fee: string;
  settled: boolean;
  liquidity: string;
}

export class CoinbaseService {
  private config: CoinbaseConfig | null = null;
  private baseUrl: string = '';
  private wsUrl: string = '';
  private wsConnections: Map<string, WebSocket> = new Map();
  private connected: boolean = false;

  constructor() {
    console.log('[Coinbase] Service initialized');
  }

  // Configure the service
  configure(config: CoinbaseConfig): void {
    this.config = config;
    
    if (config.sandbox) {
      // Sandbox URLs (Demo)
      this.baseUrl = 'https://api-public.sandbox.pro.coinbase.com';
      this.wsUrl = 'wss://ws-feed-public.sandbox.pro.coinbase.com';
      console.log('[Coinbase] Configured for SANDBOX (Demo)');
    } else {
      // Production URLs (Real)
      this.baseUrl = 'https://api.exchange.coinbase.com';
      this.wsUrl = 'wss://ws-feed.exchange.coinbase.com';
      console.log('[Coinbase] Configured for PRODUCTION (Real)');
    }
  }

  // Check if configured
  isConfigured(): boolean {
    return this.config !== null;
  }

  // Generate signature for authenticated requests
  private generateSignature(timestamp: string, method: string, path: string, body: string = ''): string {
    if (!this.config) throw new Error('Coinbase not configured');
    
    const message = timestamp + method + path + body;
    const signature = crypto
      .createHmac('sha256', Buffer.from(this.config.apiSecret, 'base64'))
      .update(message)
      .digest('base64');
    
    return signature;
  }

  // Make authenticated request
  private async request(
    method: 'GET' | 'POST' | 'DELETE' | 'PUT',
    path: string,
    body?: any
  ): Promise<any> {
    if (!this.config) throw new Error('Coinbase not configured');

    const timestamp = Date.now() / 1000;
    const bodyStr = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(timestamp.toString(), method, path, bodyStr);

    const url = this.baseUrl + path;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'CB-ACCESS-KEY': this.config.apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp.toString(),
          'CB-ACCESS-PASSPHRASE': this.config.passphrase,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Coinbase API error: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('[Coinbase] API error:', error);
      throw error;
    }
  }

  // Public request (no auth needed)
  private async publicRequest(path: string): Promise<any> {
    const url = this.baseUrl + path;
    const response = await fetch(url);
    return response.json();
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config) {
        return { success: false, message: 'Coinbase not configured' };
      }

      // Try to get accounts (tests API keys)
      const accounts = await this.getAccounts();
      
      this.connected = true;
      return { 
        success: true, 
        message: `Connected to Coinbase ${this.config.sandbox ? 'Sandbox' : 'Production'}. Found ${accounts.length} accounts` 
      };
    } catch (error: any) {
      this.connected = false;
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
  }

  // Get accounts
  async getAccounts(): Promise<CoinbaseAccount[]> {
    return this.request('GET', '/accounts');
  }

  // Get account by currency
  async getAccount(currency: string): Promise<CoinbaseAccount> {
    return this.request('GET', `/accounts/${currency}`);
  }

  // Get product info
  async getProducts(): Promise<CoinbaseProduct[]> {
    return this.publicRequest('/products');
  }

  // Get single product
  async getProduct(productId: string): Promise<CoinbaseProduct> {
    return this.publicRequest(`/products/${productId}`);
  }

  // Get ticker
  async getTicker(productId: string): Promise<CoinbaseTicker> {
    return this.publicRequest(`/products/${productId}/ticker`);
  }

  // Get current price
  async getPrice(productId: string): Promise<number> {
    const ticker = await this.getTicker(productId);
    return parseFloat(ticker.price);
  }

  // Get order book
  async getOrderBook(productId: string, level: 1 | 2 | 3 = 1): Promise<any> {
    return this.publicRequest(`/products/${productId}/book?level=${level}`);
  }

  // Get trades
  async getTrades(productId: string, limit: number = 100): Promise<any[]> {
    return this.publicRequest(`/products/${productId}/trades?limit=${limit}`);
  }

  // Get candles
  async getCandles(
    productId: string, 
    granularity: 60 | 300 | 900 | 3600 | 21600 | 86400,
    start?: string,
    end?: string
  ): Promise<CoinbaseCandle[]> {
    let path = `/products/${productId}/candles?granularity=${granularity}`;
    if (start) path += `&start=${start}`;
    if (end) path += `&end=${end}`;
    
    const data = await this.publicRequest(path);
    return data.map((c: any[]) => ({
      time: c[0],
      low: c[1],
      high: c[2],
      open: c[3],
      close: c[4],
      volume: c[5],
    }));
  }

  // Place order
  async placeOrder(order: CoinbaseOrder): Promise<CoinbaseOrderResponse> {
    const body: Record<string, any> = {
      product_id: order.product_id,
      side: order.side,
      type: order.type,
    };

    if (order.size) body.size = order.size.toString();
    if (order.funds) body.funds = order.funds.toString();
    if (order.price) body.price = order.price.toString();
    if (order.stop_price) body.stop_price = order.stop_price.toString();
    if (order.stop) body.stop = order.stop;
    if (order.time_in_force) body.time_in_force = order.time_in_force;
    if (order.cancel_after) body.cancel_after = order.cancel_after;
    if (order.post_only !== undefined) body.post_only = order.post_only;

    return this.request('POST', '/orders', body);
  }

  // Place market order
  async placeMarketOrder(
    productId: string, 
    side: 'buy' | 'sell', 
    size?: number,
    funds?: number
  ): Promise<CoinbaseOrderResponse> {
    return this.placeOrder({
      product_id: productId,
      side,
      type: 'market',
      size,
      funds,
    });
  }

  // Place limit order
  async placeLimitOrder(
    productId: string, 
    side: 'buy' | 'sell', 
    size: number, 
    price: number,
    timeInForce: 'GTC' | 'GTT' | 'IOC' | 'FOK' = 'GTC'
  ): Promise<CoinbaseOrderResponse> {
    return this.placeOrder({
      product_id: productId,
      side,
      type: 'limit',
      size,
      price,
      time_in_force: timeInForce,
    });
  }

  // Place stop order
  async placeStopOrder(
    productId: string,
    side: 'buy' | 'sell',
    size: number,
    stopPrice: number,
    stop: 'loss' | 'entry'
  ): Promise<CoinbaseOrderResponse> {
    return this.placeOrder({
      product_id: productId,
      side,
      type: 'stop',
      size,
      stop_price: stopPrice,
      stop,
    });
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<string[]> {
    return this.request('DELETE', `/orders/${orderId}`);
  }

  // Cancel all orders
  async cancelAllOrders(productId?: string): Promise<string[]> {
    const path = productId ? `/orders?product_id=${productId}` : '/orders';
    return this.request('DELETE', path);
  }

  // Get order
  async getOrder(orderId: string): Promise<CoinbaseOrderResponse> {
    return this.request('GET', `/orders/${orderId}`);
  }

  // Get orders
  async getOrders(
    productId?: string,
    status?: string[],
    limit: number = 100
  ): Promise<CoinbaseOrderResponse[]> {
    let path = `/orders?limit=${limit}`;
    if (productId) path += `&product_id=${productId}`;
    if (status) path += `&status=${status.join(',')}`;
    return this.request('GET', path);
  }

  // Get fills (trade history)
  async getFills(
    orderId?: string,
    productId?: string,
    limit: number = 100
  ): Promise<any[]> {
    let path = `/fills?limit=${limit}`;
    if (orderId) path += `&order_id=${orderId}`;
    if (productId) path += `&product_id=${productId}`;
    return this.request('GET', path);
  }

  // Get deposits
  async getDeposits(): Promise<any[]> {
    return this.request('GET', '/deposits');
  }

  // Get withdrawals
  async getWithdrawals(): Promise<any[]> {
    return this.request('GET', '/withdrawals');
  }

  // Get payment methods
  async getPaymentMethods(): Promise<any[]> {
    return this.request('GET', '/payment-methods');
  }

  // Deposit from payment method
  async deposit(amount: number, currency: string, paymentMethodId: string): Promise<any> {
    return this.request('POST', '/deposits/payment-method', {
      amount: amount.toString(),
      currency,
      payment_method_id: paymentMethodId,
    });
  }

  // Withdraw to payment method
  async withdraw(amount: number, currency: string, paymentMethodId: string): Promise<any> {
    return this.request('POST', '/withdrawals/payment-method', {
      amount: amount.toString(),
      currency,
      payment_method_id: paymentMethodId,
    });
  }

  // ========== WEBSOCKET ==========

  // Subscribe to ticker
  subscribeToTicker(productId: string, callback: (data: any) => void): void {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['ticker'],
        product_ids: [productId],
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ticker') {
        callback(data);
      }
    };

    ws.onerror = (error) => {
      console.error('[Coinbase] WebSocket error:', error);
    };

    this.wsConnections.set(`ticker_${productId}`, ws);
  }

  // Subscribe to order book
  subscribeToOrderBook(productId: string, callback: (data: any) => void): void {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['level2_batch'],
        product_ids: [productId],
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'l2update' || data.type === 'snapshot') {
        callback(data);
      }
    };

    this.wsConnections.set(`orderbook_${productId}`, ws);
  }

  // Subscribe to trades
  subscribeToTrades(productId: string, callback: (data: any) => void): void {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['matches'],
        product_ids: [productId],
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'match' || data.type === 'last_match') {
        callback(data);
      }
    };

    this.wsConnections.set(`trades_${productId}`, ws);
  }

  // Subscribe to candles
  subscribeToCandles(productId: string, callback: (data: any) => void): void {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['ticker_1000ms'],
        product_ids: [productId],
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    this.wsConnections.set(`candles_${productId}`, ws);
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

  // ========== CONVERT (Coinbase App) ==========

  // Get convert quote
  async getConvertQuote(from: string, to: string, amount: number): Promise<any> {
    return this.request('POST', '/convert/quote', {
      from,
      to,
      amount: amount.toString(),
    });
  }

  // Execute convert
  async executeConvert(quoteId: string): Promise<any> {
    return this.request('POST', `/convert/trade/${quoteId}`);
  }

  // ========== HELPER METHODS ==========

  // Calculate size from quote currency amount
  async calculateSize(productId: string, quoteAmount: number): Promise<number> {
    const product = await this.getProduct(productId);
    const price = await this.getPrice(productId);
    
    const size = quoteAmount / price;
    const baseIncrement = parseFloat(product.base_increment);
    const precision = Math.round(-Math.log10(baseIncrement));
    
    return Math.floor(size * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  // Format price according to product rules
  async formatPrice(productId: string, price: number): Promise<string> {
    const product = await this.getProduct(productId);
    const quoteIncrement = parseFloat(product.quote_increment);
    const precision = Math.round(-Math.log10(quoteIncrement));
    return price.toFixed(precision);
  }

  // Disconnect
  disconnect(): void {
    this.closeAllConnections();
    this.config = null;
    this.connected = false;
    console.log('[Coinbase] Disconnected');
  }
}

// Singleton instance
export const coinbaseService = new CoinbaseService();
