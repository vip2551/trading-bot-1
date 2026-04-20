/**
 * Platforms API - Unified endpoint for all trading platforms
 * Supports: Binance, Coinbase, Exness (Real & Demo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { binanceService, BinanceConfig } from '@/lib/binance-service';
import { coinbaseService, CoinbaseConfig } from '@/lib/coinbase-service';
import { exnessService, ExnessConfig } from '@/lib/exness-service';

// Platform configuration storage (in production, use database)
const platformConfigs = new Map<string, any>();

// GET - Get platform status and info
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  const action = searchParams.get('action');

  try {
    // Get all platforms status
    if (!platform || platform === 'all') {
      return NextResponse.json({
        success: true,
        platforms: {
          binance: {
            configured: binanceService.isConfigured(),
            type: 'crypto',
            features: ['spot', 'futures', 'margin'],
            testnet: true,
          },
          coinbase: {
            configured: coinbaseService.isConfigured(),
            type: 'crypto',
            features: ['spot', 'pro'],
            sandbox: true,
          },
          exness: {
            configured: exnessService.isConfigured(),
            type: 'forex',
            features: ['forex', 'metals', 'crypto', 'indices'],
            demo: true,
          },
          interactiveBrokers: {
            configured: true,
            type: 'stocks',
            features: ['stocks', 'options', 'futures', 'forex'],
          },
        },
      });
    }

    // Get specific platform info
    switch (platform) {
      case 'binance':
        if (!binanceService.isConfigured()) {
          return NextResponse.json({
            success: false,
            message: 'Binance not configured',
          });
        }

        if (action === 'account') {
          const account = await binanceService.getAccountInfo();
          return NextResponse.json({ success: true, account });
        }

        if (action === 'balances') {
          const balances = await binanceService.getBalances();
          return NextResponse.json({ success: true, balances });
        }

        if (action === 'prices') {
          const symbol = searchParams.get('symbol');
          if (symbol) {
            const price = await binanceService.getPrice(symbol);
            return NextResponse.json({ success: true, symbol, price });
          }
          return NextResponse.json({
            success: false,
            message: 'Symbol required',
          });
        }

        if (action === 'symbols') {
          const symbols = await binanceService.getSupportedSymbols();
          return NextResponse.json({ success: true, symbols: symbols.slice(0, 100) });
        }

        if (action === 'orders') {
          const symbol = searchParams.get('symbol') || undefined;
          const orders = await binanceService.getOpenOrders(symbol);
          return NextResponse.json({ success: true, orders });
        }

        break;

      case 'coinbase':
        if (!coinbaseService.isConfigured()) {
          return NextResponse.json({
            success: false,
            message: 'Coinbase not configured',
          });
        }

        if (action === 'accounts') {
          const accounts = await coinbaseService.getAccounts();
          return NextResponse.json({ success: true, accounts });
        }

        if (action === 'products') {
          const products = await coinbaseService.getProducts();
          return NextResponse.json({ success: true, products: products.slice(0, 50) });
        }

        if (action === 'price') {
          const productId = searchParams.get('productId');
          if (!productId) {
            return NextResponse.json({
              success: false,
              message: 'productId required',
            });
          }
          const price = await coinbaseService.getPrice(productId);
          return NextResponse.json({ success: true, productId, price });
        }

        if (action === 'orders') {
          const orders = await coinbaseService.getOrders();
          return NextResponse.json({ success: true, orders });
        }

        break;

      case 'exness':
        if (!exnessService.isConfigured()) {
          return NextResponse.json({
            success: false,
            message: 'Exness not configured',
          });
        }

        if (action === 'account') {
          const account = await exnessService.getAccountInfo();
          return NextResponse.json({ success: true, account });
        }

        if (action === 'balance') {
          const balance = await exnessService.getBalance();
          return NextResponse.json({ success: true, balance });
        }

        if (action === 'symbols') {
          const symbols = await exnessService.getSymbols();
          return NextResponse.json({ success: true, symbols: symbols.slice(0, 100) });
        }

        if (action === 'price') {
          const symbol = searchParams.get('symbol');
          if (!symbol) {
            return NextResponse.json({
              success: false,
              message: 'Symbol required',
            });
          }
          const price = await exnessService.getPrice(symbol);
          return NextResponse.json({ success: true, symbol, price });
        }

        if (action === 'positions') {
          const positions = await exnessService.getPositions();
          return NextResponse.json({ success: true, positions });
        }

        if (action === 'orders') {
          const orders = await exnessService.getPendingOrders();
          return NextResponse.json({ success: true, orders });
        }

        break;

      default:
        return NextResponse.json({
          success: false,
          message: 'Unknown platform',
        });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action',
    });
  } catch (error: any) {
    console.error('[Platforms API] Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

// POST - Configure platform and execute actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, action, config, order, ...params } = body;

    // Configure platform
    if (action === 'configure') {
      if (platform === 'binance') {
        const binanceConfig: BinanceConfig = {
          apiKey: config.apiKey,
          apiSecret: config.apiSecret,
          testnet: config.testnet || false,
        };
        binanceService.configure(binanceConfig);

        // Test connection
        const testResult = await binanceService.testConnection();
        
        if (testResult.success) {
          platformConfigs.set('binance', binanceConfig);
        }

        return NextResponse.json({
          success: testResult.success,
          message: testResult.message,
          testnet: binanceConfig.testnet,
        });
      }

      if (platform === 'coinbase') {
        const coinbaseConfig: CoinbaseConfig = {
          apiKey: config.apiKey,
          apiSecret: config.apiSecret,
          passphrase: config.passphrase,
          sandbox: config.sandbox || false,
        };
        coinbaseService.configure(coinbaseConfig);

        const testResult = await coinbaseService.testConnection();
        
        if (testResult.success) {
          platformConfigs.set('coinbase', coinbaseConfig);
        }

        return NextResponse.json({
          success: testResult.success,
          message: testResult.message,
          sandbox: coinbaseConfig.sandbox,
        });
      }

      if (platform === 'exness') {
        const exnessConfig: ExnessConfig = {
          apiKey: config.apiKey,
          apiSecret: config.apiSecret,
          accountId: config.accountId,
          demo: config.demo || false,
        };
        exnessService.configure(exnessConfig);

        const testResult = await exnessService.testConnection();
        
        if (testResult.success) {
          platformConfigs.set('exness', exnessConfig);
        }

        return NextResponse.json({
          success: testResult.success,
          message: testResult.message,
          demo: exnessConfig.demo,
        });
      }
    }

    // Test connection
    if (action === 'test') {
      if (platform === 'binance') {
        const result = await binanceService.testConnection();
        return NextResponse.json(result);
      }
      if (platform === 'coinbase') {
        const result = await coinbaseService.testConnection();
        return NextResponse.json(result);
      }
      if (platform === 'exness') {
        const result = await exnessService.testConnection();
        return NextResponse.json(result);
      }
    }

    // Disconnect
    if (action === 'disconnect') {
      if (platform === 'binance') {
        binanceService.disconnect();
        platformConfigs.delete('binance');
        return NextResponse.json({ success: true, message: 'Binance disconnected' });
      }
      if (platform === 'coinbase') {
        coinbaseService.disconnect();
        platformConfigs.delete('coinbase');
        return NextResponse.json({ success: true, message: 'Coinbase disconnected' });
      }
      if (platform === 'exness') {
        exnessService.disconnect();
        platformConfigs.delete('exness');
        return NextResponse.json({ success: true, message: 'Exness disconnected' });
      }
    }

    // ========== TRADING ACTIONS ==========

    // Place order
    if (action === 'place_order') {
      if (platform === 'binance') {
        const result = await binanceService.placeOrder(order);
        return NextResponse.json({
          success: true,
          order: result,
          message: `Order placed: ${result.orderId}`,
        });
      }

      if (platform === 'coinbase') {
        const result = await coinbaseService.placeOrder(order);
        return NextResponse.json({
          success: true,
          order: result,
          message: `Order placed: ${result.id}`,
        });
      }

      if (platform === 'exness') {
        const result = await exnessService.placeOrder(order);
        return NextResponse.json({
          success: true,
          order: result,
          message: `Order placed: ${result.orderId}`,
        });
      }
    }

    // Market order
    if (action === 'market_order') {
      const { symbol, side, quantity, volume } = params;

      if (platform === 'binance') {
        const result = await binanceService.placeMarketOrder(symbol, side, quantity);
        return NextResponse.json({
          success: true,
          order: result,
        });
      }

      if (platform === 'coinbase') {
        const result = await coinbaseService.placeMarketOrder(symbol, side, undefined, quantity);
        return NextResponse.json({
          success: true,
          order: result,
        });
      }

      if (platform === 'exness') {
        const { stopLoss, takeProfit } = params;
        const result = await exnessService.placeMarketOrder(symbol, side, volume, stopLoss, takeProfit);
        return NextResponse.json({
          success: true,
          order: result,
        });
      }
    }

    // Limit order
    if (action === 'limit_order') {
      const { symbol, side, quantity, volume, price } = params;

      if (platform === 'binance') {
        const result = await binanceService.placeLimitOrder(symbol, side, quantity, price);
        return NextResponse.json({
          success: true,
          order: result,
        });
      }

      if (platform === 'coinbase') {
        const result = await coinbaseService.placeLimitOrder(symbol, side, quantity, price);
        return NextResponse.json({
          success: true,
          order: result,
        });
      }

      if (platform === 'exness') {
        const { stopLoss, takeProfit } = params;
        const result = await exnessService.placeLimitOrder(symbol, side, volume, price, stopLoss, takeProfit);
        return NextResponse.json({
          success: true,
          order: result,
        });
      }
    }

    // Cancel order
    if (action === 'cancel_order') {
      const { orderId, symbol } = params;

      if (platform === 'binance') {
        const result = await binanceService.cancelOrder(symbol, orderId);
        return NextResponse.json({ success: true, result });
      }

      if (platform === 'coinbase') {
        const result = await coinbaseService.cancelOrder(orderId);
        return NextResponse.json({ success: true, result });
      }

      if (platform === 'exness') {
        const result = await exnessService.cancelOrder(orderId);
        return NextResponse.json({ success: true, result });
      }
    }

    // Close position (for Exness)
    if (action === 'close_position') {
      const { ticket, volume } = params;

      if (platform === 'exness') {
        const result = await exnessService.closePosition(ticket, volume);
        return NextResponse.json({ success: true, result });
      }
    }

    // Set leverage (for Binance futures and Exness)
    if (action === 'set_leverage') {
      const { symbol, leverage } = params;

      if (platform === 'binance') {
        const result = await binanceService.setLeverage(symbol, leverage);
        return NextResponse.json({ success: true, result });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action or platform',
    });
  } catch (error: any) {
    console.error('[Platforms API] Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

// DELETE - Remove platform configuration
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');

  if (!platform) {
    return NextResponse.json({
      success: false,
      message: 'Platform required',
    });
  }

  try {
    switch (platform) {
      case 'binance':
        binanceService.disconnect();
        platformConfigs.delete('binance');
        break;
      case 'coinbase':
        coinbaseService.disconnect();
        platformConfigs.delete('coinbase');
        break;
      case 'exness':
        exnessService.disconnect();
        platformConfigs.delete('exness');
        break;
      default:
        return NextResponse.json({
          success: false,
          message: 'Unknown platform',
        });
    }

    return NextResponse.json({
      success: true,
      message: `${platform} configuration removed`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 500 });
  }
}
