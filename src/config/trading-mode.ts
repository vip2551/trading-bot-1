// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TRADING MODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export type TradingMode = 'SIMULATION' | 'PAPER' | 'LIVE';

// Get trading mode from environment variable
export const MODE: TradingMode = (process.env.TRADING_MODE as TradingMode) || 'PAPER';

// Mode configuration
export const MODE_CONFIG = {
  SIMULATION: {
    name: 'Simulation',
    emoji: '🧪',
    description: 'اختبار فقط - لا تداول حقيقي',
    allowRealTrades: false,
    requireIBConnection: false,
    allowFakeData: true,
    logPrefix: '[SIM]',
  },
  PAPER: {
    name: 'Paper Trading',
    emoji: '📝',
    description: 'تداول ورقي - أموال وهمية على منصة حقيقية',
    allowRealTrades: true,
    requireIBConnection: true,
    allowFakeData: false,
    logPrefix: '[PAPER]',
  },
  LIVE: {
    name: 'Live Trading',
    emoji: '🔴',
    description: 'تداول حقيقي - أموال حقيقية',
    allowRealTrades: true,
    requireIBConnection: true,
    allowFakeData: false,
    logPrefix: '[LIVE]',
  },
} as const;

// Get current mode config
export const getCurrentModeConfig = () => MODE_CONFIG[MODE];

// Check if mode allows real trades
export const canExecuteRealTrades = (): boolean => {
  const config = getCurrentModeConfig();
  return config.allowRealTrades;
};

// Check if IB connection is required
export const requiresIBConnection = (): boolean => {
  const config = getCurrentModeConfig();
  return config.requireIBConnection;
};

// Check if fake data is allowed
export const allowsFakeData = (): boolean => {
  const config = getCurrentModeConfig();
  return config.allowFakeData;
};

// Log mode status
export const logModeStatus = (): void => {
  const config = getCurrentModeConfig();
  console.log(`${config.emoji} Trading Mode: ${config.name}`);
  console.log(`📋 ${config.description}`);
  console.log(`🔗 IB Required: ${config.requireIBConnection ? 'Yes' : 'No'}`);
  console.log(`📊 Fake Data: ${config.allowFakeData ? 'Allowed' : 'Not Allowed'}`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 SAFETY VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate market data before using it for trading decisions
 * Returns true ONLY if data is valid and real
 */
export function validateMarketData(data: unknown): data is { price: number; [key: string]: unknown } {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as Record<string, unknown>;

  // Check price is valid
  if (typeof d.price !== 'number' || isNaN(d.price) || d.price <= 0) {
    return false;
  }

  // In non-simulation modes, verify data is real (not simulated)
  if (!allowsFakeData()) {
    // Check if data has isReal flag
    if ('isReal' in d && d.isReal === false) {
      return false;
    }
    // Check if data has simulated flag
    if ('simulated' in d && d.simulated === true) {
      return false;
    }
  }

  return true;
}

/**
 * Validate trade parameters before execution
 */
export function validateTradeParams(params: {
  symbol?: string;
  quantity?: number;
  direction?: string;
}): { valid: boolean; error?: string } {
  if (!params.symbol || typeof params.symbol !== 'string') {
    return { valid: false, error: '❌ Invalid or missing symbol' };
  }

  if (!params.quantity || params.quantity <= 0) {
    return { valid: false, error: '❌ Invalid quantity' };
  }

  if (!params.direction || !['CALL', 'PUT', 'BUY', 'SELL'].includes(params.direction)) {
    return { valid: false, error: '❌ Invalid direction' };
  }

  return { valid: true };
}

/**
 * Check if trading is allowed in current mode
 */
export function canTrade(params: {
  ibConnected?: boolean;
  hasMarketData?: boolean;
}): { allowed: boolean; reason?: string } {
  const config = getCurrentModeConfig();

  // Simulation mode - always allow
  if (MODE === 'SIMULATION') {
    return { allowed: true };
  }

  // Check IB connection for PAPER/LIVE modes
  if (config.requireIBConnection && !params.ibConnected) {
    return { allowed: false, reason: '❌ IB not connected - cannot trade' };
  }

  // Check market data
  if (!config.allowFakeData && !params.hasMarketData) {
    return { allowed: false, reason: '❌ No real market data - trading stopped' };
  }

  return { allowed: true };
}

// Export default
export default {
  MODE,
  MODE_CONFIG,
  getCurrentModeConfig,
  canExecuteRealTrades,
  requiresIBConnection,
  allowsFakeData,
  logModeStatus,
  validateMarketData,
  validateTradeParams,
  canTrade,
};
