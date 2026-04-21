// ═══════════════════════════════════════════════════════════════════════════════
// 📊 REAL MARKET DATA SERVICE - Multiple Data Sources
// ═══════════════════════════════════════════════════════════════════════════════

import { Candle } from './indicators';

export interface MarketDataProvider {
  name: string;
  priority: number;
  enabled: boolean;
}

export interface PriceData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
  source: string;
  isReal: boolean;
}

export interface HistoricalData {
  symbol: string;
  candles: Candle[];
  source: string;
}

// Data providers configuration
const DATA_PROVIDERS: MarketDataProvider[] = [
  { name: 'IB', priority: 1, enabled: true },
  { name: 'TRADINGVIEW', priority: 2, enabled: true },
  { name: 'YAHOO', priority: 3, enabled: true },
  { name: 'BINANCE', priority: 4, enabled: false }, // For crypto
];

// Cache for market data
const priceCache = new Map<string, { data: PriceData; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

// ═══════════════════════════════════════════════════════════════════════════════
// 📡 DATA SOURCE: Interactive Brokers
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchFromIB(symbol: string): Promise<PriceData | null> {
  try {
    const res = await fetch(`http://localhost:3003/market/${symbol}`, {
      signal: AbortSignal.timeout(3000)
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.price && !data.simulated) {
      return {
        symbol,
        price: data.price,
        bid: data.bid || data.price - 0.5,
        ask: data.ask || data.price + 0.5,
        volume: data.volume || 0,
        change: 0,
        changePercent: 0,
        high: data.price,
        low: data.price,
        open: data.price,
        previousClose: data.price,
        timestamp: new Date(),
        source: 'IB',
        isReal: true
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📡 DATA SOURCE: Yahoo Finance (Free)
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchFromYahoo(symbol: string): Promise<PriceData | null> {
  try {
    // Yahoo Finance API (free, no key required)
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (result?.meta) {
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      const lastIndex = quote?.close?.length - 1 || 0;
      
      const price = meta.regularMarketPrice || quote?.close?.[lastIndex] || 0;
      const previousClose = meta.chartPreviousClose || meta.previousClose || price;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
      
      return {
        symbol,
        price,
        bid: meta.bid || price - 0.01,
        ask: meta.ask || price + 0.01,
        volume: quote?.volume?.[lastIndex] || meta.regularMarketVolume || 0,
        change,
        changePercent,
        high: quote?.high?.[lastIndex] || meta.regularMarketDayHigh || price,
        low: quote?.low?.[lastIndex] || meta.regularMarketDayLow || price,
        open: quote?.open?.[lastIndex] || meta.regularMarketOpen || price,
        previousClose,
        timestamp: new Date(),
        source: 'YAHOO',
        isReal: true
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📡 DATA SOURCE: Twelve Data (Free Tier)
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchFromTwelveData(symbol: string): Promise<PriceData | null> {
  try {
    // Twelve Data has a free tier
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) return null;
    
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.close) {
      return {
        symbol,
        price: parseFloat(data.close),
        bid: parseFloat(data.bid || data.close),
        ask: parseFloat(data.ask || data.close),
        volume: parseInt(data.volume) || 0,
        change: parseFloat(data.change) || 0,
        changePercent: parseFloat(data.percent_change) || 0,
        high: parseFloat(data.high) || parseFloat(data.close),
        low: parseFloat(data.low) || parseFloat(data.close),
        open: parseFloat(data.open) || parseFloat(data.close),
        previousClose: parseFloat(data.previous_close) || parseFloat(data.close),
        timestamp: new Date(),
        source: 'TWELVE_DATA',
        isReal: true
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get real-time price from best available source
 */
export async function getRealTimePrice(symbol: string): Promise<PriceData | null> {
  // Check cache first
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Try data sources in priority order
  const sources = [
    () => fetchFromIB(symbol),
    () => fetchFromYahoo(symbol),
    () => fetchFromTwelveData(symbol),
  ];
  
  for (const fetchFn of sources) {
    try {
      const data = await fetchFn();
      if (data && data.isReal) {
        // Update cache
        priceCache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }
    } catch {
      continue;
    }
  }
  
  // No real data available
  return null;
}

/**
 * Get historical data for technical analysis
 */
export async function getHistoricalData(
  symbol: string,
  interval: string = '1h',
  range: string = '1mo'
): Promise<HistoricalData | null> {
  try {
    // Use Yahoo Finance for historical data (free)
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;
    
    const quote = result.indicators?.quote?.[0];
    const timestamps = result.timestamp || [];
    
    if (!quote || !timestamps.length) return null;
    
    const candles: Candle[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open?.[i] && quote.high?.[i] && quote.low?.[i] && quote.close?.[i]) {
        candles.push({
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0,
          timestamp: timestamps[i] * 1000
        });
      }
    }
    
    return {
      symbol,
      candles,
      source: 'YAHOO'
    };
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
}

/**
 * Get multiple symbols prices
 */
export async function getMultiplePrices(symbols: string[]): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>();
  
  await Promise.all(
    symbols.map(async (symbol) => {
      const data = await getRealTimePrice(symbol);
      if (data) {
        results.set(symbol, data);
      }
    })
  );
  
  return results;
}

/**
 * Validate that price data is real
 */
export function validateRealData(data: PriceData | null): boolean {
  if (!data) return false;
  if (!data.isReal) return false;
  if (data.price <= 0) return false;
  if (isNaN(data.price)) return false;
  return true;
}

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of priceCache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      priceCache.delete(key);
    }
  }
}, 60000);

export default {
  getRealTimePrice,
  getHistoricalData,
  getMultiplePrices,
  validateRealData,
};
