/**
 * Interactive Brokers API Service - REAL CONNECTION
 * Handles connection and trading with IB TWS/Gateway
 * Using @stoqey/ib library for real IB API connection
 */

import { db } from './db';

// Dynamic import for IB library (ESM compatibility)
let IB: any = null;
let ibInstance: any = null;

// IB API Types
export interface IBConfig {
  host: string;
  port: number;
  clientId: number;
  accountType: 'paper' | 'live';
}

export interface IBOrder {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MKT' | 'LMT' | 'STP';
  limitPrice?: number;
  stopPrice?: number;
  tif?: 'DAY' | 'GTC' | 'IOC';
}

export interface IBPosition {
  symbol: string;
  position: number;
  avgCost: number;
  marketPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface IBAccountSummary {
  account: string;
  totalCashValue: number;
  availableFunds: number;
  buyingPower: number;
  grossPositionValue: number;
  netLiquidation: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface IBContract {
  symbol: string;
  secType: 'STK' | 'OPT' | 'FUT' | 'CASH' | 'IND';
  exchange: string;
  currency: string;
  expiry?: string;
  strike?: number;
  right?: 'C' | 'P';
  multiplier?: string;
}

// IB Connection Manager - REAL IMPLEMENTATION
export class IBService {
  private config: IBConfig | null = null;
  private connected: boolean = false;
  private ib: any = null;
  private requestId: number = 1;
  private orderId: number = 0;
  private nextOrderId: number = 0;
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();
  private accountSummary: IBAccountSummary | null = null;
  private positions: IBPosition[] = [];
  private connectionPromise: { resolve: (value: { success: boolean; message: string }) => void; reject: (reason?: any) => void } | null = null;
  // Auto-reconnect settings
  private autoReconnect: boolean = true;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private reconnectDelay: number = 5000; // 5 seconds
  private isReconnecting: boolean = false;

  constructor() {
    this.initEventListeners();
  }

  private initEventListeners() {
    const events = [
      'connected', 'disconnected', 'error', 'orderStatus',
      'position', 'accountSummary', 'marketData', 'tickPrice',
      'nextValidId', 'openOrder', 'execDetails'
    ];
    events.forEach(event => this.eventListeners.set(event, []));
  }

  // Configure IB connection
  configure(config: IBConfig): void {
    this.config = config;
    console.log(`[IB] Configured: ${config.host}:${config.port} (${config.accountType})`);
  }

  // Connect to IB TWS/Gateway - REAL CONNECTION
  async connect(): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: 'IB not configured' };
    }

    if (this.connected) {
      return { success: true, message: 'Already connected' };
    }

    try {
      // Dynamic import of IB library
      if (!IB) {
        const ibModule = await import('@stoqey/ib');
        IB = ibModule.default || ibModule.IB || ibModule;
      }

      console.log(`[IB] Connecting to ${this.config.host}:${this.config.port}...`);

      // Create IB instance
      this.ib = new IB({
        host: this.config.host,
        port: this.config.port,
        clientId: this.config.clientId,
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Start connection
      this.ib.connect();

      // Wait for connection (with timeout)
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ 
            success: false, 
            message: 'Connection timeout - IB Gateway not responding. Make sure IB Gateway is running on ' + this.config!.host + ':' + this.config!.port 
          });
        }, 15000);

        this.connectionPromise = {
          resolve: (result: { success: boolean; message: string }) => {
            clearTimeout(timeout);
            resolve(result);
          },
          reject: () => {
            clearTimeout(timeout);
            resolve({ success: false, message: 'Connection failed' });
          }
        };
      });
    } catch (error: any) {
      console.error('[IB] Connection error:', error);
      return { 
        success: false, 
        message: `Connection error: ${error.message || 'Unknown error'}` 
      };
    }
  }

  private setupEventHandlers() {
    if (!this.ib) return;

    // Connection established
    this.ib.on('connected', () => {
      console.log('[IB] Connected successfully');
      this.connected = true;
      this.emit('connected', { 
        host: this.config?.host, 
        port: this.config?.port,
        clientId: this.config?.clientId 
      });
      
      // Request next valid order ID
      this.ib.reqIds(-1);
    });

    // Next valid order ID received (confirms ready state)
    this.ib.on('nextValidId', (orderId: number) => {
      console.log('[IB] Next valid order ID:', orderId);
      this.nextOrderId = orderId;
      this.orderId = orderId;
      
      if (this.connectionPromise) {
        this.connectionPromise.resolve({ 
          success: true, 
          message: `Connected to IB ${this.config?.accountType} account` 
        });
        this.connectionPromise = null;
      }

      this.emit('nextValidId', orderId);
    });

    // Disconnected
    this.ib.on('disconnected', () => {
      console.log('[IB] Disconnected');
      this.connected = false;
      this.emit('disconnected', {});
    });

    // Error handling
    this.ib.on('error', (err: any) => {
      console.error('[IB] Error:', err);
      
      // Check if it's a connection refused error
      if (err.message && err.message.includes('ECONNREFUSED')) {
        if (this.connectionPromise) {
          this.connectionPromise.resolve({ 
            success: false, 
            message: `Cannot connect to IB Gateway at ${this.config?.host}:${this.config?.port}. Make sure IB Gateway is running!` 
          });
          this.connectionPromise = null;
        }
      }
      
      this.emit('error', err);
    });

    // Account summary
    this.ib.on('accountSummary', (reqId: number, account: string, tag: string, value: string, currency: string) => {
      console.log(`[IB] Account summary: ${tag} = ${value}`);
      
      if (!this.accountSummary) {
        this.accountSummary = {
          account: account,
          totalCashValue: 0,
          availableFunds: 0,
          buyingPower: 0,
          grossPositionValue: 0,
          netLiquidation: 0,
          unrealizedPnL: 0,
          realizedPnL: 0
        };
      }

      // Map IB tags to our structure
      switch (tag) {
        case 'TotalCashValue':
          this.accountSummary.totalCashValue = parseFloat(value) || 0;
          break;
        case 'AvailableFunds':
          this.accountSummary.availableFunds = parseFloat(value) || 0;
          break;
        case 'BuyingPower':
          this.accountSummary.buyingPower = parseFloat(value) || 0;
          break;
        case 'GrossPositionValue':
          this.accountSummary.grossPositionValue = parseFloat(value) || 0;
          break;
        case 'NetLiquidation':
          this.accountSummary.netLiquidation = parseFloat(value) || 0;
          break;
        case 'UnrealizedPnL':
          this.accountSummary.unrealizedPnL = parseFloat(value) || 0;
          break;
        case 'RealizedPnL':
          this.accountSummary.realizedPnL = parseFloat(value) || 0;
          break;
      }

      this.emit('accountSummary', this.accountSummary);
    });

    // Position updates
    this.ib.on('position', (account: string, contract: any, pos: number, avgCost: number) => {
      console.log(`[IB] Position: ${contract.symbol} = ${pos}`);
      
      const existingIndex = this.positions.findIndex(p => p.symbol === contract.symbol);
      const position: IBPosition = {
        symbol: contract.symbol,
        position: pos,
        avgCost: avgCost,
        marketPrice: 0,
        marketValue: 0,
        unrealizedPnL: 0,
        realizedPnL: 0
      };

      if (existingIndex >= 0) {
        this.positions[existingIndex] = position;
      } else {
        this.positions.push(position);
      }

      this.emit('position', position);
    });

    // Order status updates
    this.ib.on('orderStatus', (orderId: number, status: string, filled: number, remaining: number, avgFillPrice: number) => {
      console.log(`[IB] Order ${orderId} status: ${status}, filled: ${filled}`);
      
      this.emit('orderStatus', {
        orderId,
        status,
        filled,
        remaining,
        avgFillPrice
      });
    });

    // Open order
    this.ib.on('openOrder', (orderId: number, contract: any, order: any, orderState: any) => {
      console.log(`[IB] Open order: ${orderId} ${contract.symbol}`);
      this.emit('openOrder', { orderId, contract, order, orderState });
    });

    // Execution details
    this.ib.on('execDetails', (reqId: number, contract: any, execution: any) => {
      console.log(`[IB] Execution: ${execution.orderId} ${contract.symbol}`);
      this.emit('execDetails', { reqId, contract, execution });
    });

    // Market data
    this.ib.on('tickPrice', (tickerId: number, field: number, price: number) => {
      // field: 1=bid, 2=ask, 4=last
      this.emit('tickPrice', { tickerId, field, price });
    });

    this.ib.on('tickSize', (tickerId: number, field: number, size: number) => {
      this.emit('marketData', { tickerId, field, size });
    });
  }

  // Auto-reconnect handler
  private async handleReconnect(): Promise<void> {
    if (this.isReconnecting || !this.config) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`[IB] Auto-reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
    
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
    
    try {
      const result = await this.connect();
      if (result.success) {
        console.log('[IB] Auto-reconnect successful');
        this.reconnectAttempts = 0;
      } else {
        console.log('[IB] Auto-reconnect failed:', result.message);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        }
      }
    } catch (error) {
      console.error('[IB] Auto-reconnect error:', error);
    }
    
    this.isReconnecting = false;
  }

  // Disconnect from IB
  async disconnect(): Promise<void> {
    if (this.ib && this.connected) {
      try {
        this.ib.disconnect();
        console.log('[IB] Disconnected');
      } catch (err) {
        console.error('[IB] Disconnect error:', err);
      }
    }
    this.connected = false;
    this.emit('disconnected', {});
  }

  // Check connection status
  isConnected(): boolean {
    return this.connected;
  }

  // Get account summary
  async getAccountSummary(): Promise<IBAccountSummary | null> {
    if (!this.connected || !this.ib) return null;

    // Request account summary
    this.ib.reqAccountSummary(9001, 'All', [
      'TotalCashValue', 'AvailableFunds', 'BuyingPower', 
      'GrossPositionValue', 'NetLiquidation', 'UnrealizedPnL', 'RealizedPnL'
    ]);

    // Wait a bit for data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return this.accountSummary;
  }

  // Get positions
  async getPositions(): Promise<IBPosition[]> {
    if (!this.connected || !this.ib) return [];

    // Request positions
    this.ib.reqPositions();

    // Wait a bit for data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return this.positions;
  }

  // Place order - REAL IMPLEMENTATION
  async placeOrder(order: IBOrder, contract: IBContract): Promise<{ 
    success: boolean; 
    orderId?: number; 
    message?: string 
  }> {
    if (!this.connected || !this.ib) {
      return { success: false, message: 'Not connected to IB' };
    }

    try {
      const orderId = this.nextOrderId++;
      
      console.log('[IB] Placing order:', { orderId, order, contract });

      // Create IB contract object
      const ibContract = this.createIBContract(contract);
      
      // Create IB order object
      const ibOrder: any = {
        action: order.action,
        totalQuantity: order.quantity,
        orderType: order.orderType,
        tif: order.tif || 'DAY'
      };

      if (order.orderType === 'LMT' && order.limitPrice) {
        ibOrder.lmtPrice = order.limitPrice;
      }
      if (order.orderType === 'STP' && order.stopPrice) {
        ibOrder.auxPrice = order.stopPrice;
      }

      // Place the order
      this.ib.placeOrder(orderId, ibContract, ibOrder);

      return { success: true, orderId };
    } catch (error: any) {
      console.error('[IB] Order error:', error);
      return { success: false, message: error.message || 'Order failed' };
    }
  }

  // Create IB contract from our contract type
  private createIBContract(contract: IBContract): any {
    const ibContract: any = {
      symbol: contract.symbol,
      secType: contract.secType,
      exchange: contract.exchange,
      currency: contract.currency
    };

    if (contract.secType === 'OPT') {
      ibContract.lastTradeDateOrContractMonth = contract.expiry;
      ibContract.strike = contract.strike;
      ibContract.right = contract.right;
      ibContract.multiplier = contract.multiplier || '100';
    }

    return ibContract;
  }

  // Cancel order
  async cancelOrder(orderId: number): Promise<boolean> {
    if (!this.connected || !this.ib) return false;
    
    console.log('[IB] Cancelling order:', orderId);
    this.ib.cancelOrder(orderId);
    return true;
  }

  // Request market data
  async requestMarketData(contract: IBContract): Promise<number> {
    if (!this.connected || !this.ib) return -1;

    const reqId = this.requestId++;
    const ibContract = this.createIBContract(contract);

    console.log('[IB] Requesting market data for:', contract.symbol);
    this.ib.reqMktData(reqId, ibContract, '', false, false);

    return reqId;
  }

  // Cancel market data
  cancelMarketData(reqId: number): void {
    if (this.ib) {
      this.ib.cancelMktData(reqId);
    }
  }

  // Event handling
  on(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.push(callback);
    }
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Create SPX option contract
  static createSPXOptionContract(
    strike: number, 
    right: 'C' | 'P', 
    expiry: string
  ): IBContract {
    return {
      symbol: 'SPX',
      secType: 'OPT',
      exchange: 'CBOE',
      currency: 'USD',
      strike,
      right,
      expiry,
      multiplier: '100'
    };
  }

  // Create stock contract
  static createStockContract(symbol: string, exchange: string = 'SMART'): IBContract {
    return {
      symbol,
      secType: 'STK',
      exchange,
      currency: 'USD'
    };
  }

  // Create index contract
  static createIndexContract(symbol: string): IBContract {
    return {
      symbol,
      secType: 'IND',
      exchange: 'CBOE',
      currency: 'USD'
    };
  }
}

// Singleton instance
export const ibService = new IBService();

// IB Configuration helper
export function getIBConfig(accountType: 'paper' | 'live', host: string = '127.0.0.1'): IBConfig {
  return {
    host: host,
    port: accountType === 'paper' ? 7497 : 7496,
    clientId: Math.floor(Math.random() * 10000) + 1,
    accountType
  };
}

// Validate IB connection settings
export function validateIBConfig(config: IBConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.host || config.host.trim() === '') {
    errors.push('Host is required');
  }

  if (![7496, 7497, 4001, 4002].includes(config.port)) {
    errors.push('Port must be 7496 (Live TWS), 7497 (Paper TWS), 4001 (Gateway Paper), or 4002 (Gateway Live)');
  }

  if (!config.clientId || config.clientId < 0) {
    errors.push('Client ID must be a positive number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
