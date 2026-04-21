"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wifi,
  WifiOff,
  Shield,
  AlertTriangle,
  Clock,
  BarChart3,
  Bell,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react";

interface MonitoringData {
  timestamp: string;
  system: {
    mode: string;
    modeDescription: string;
    allowRealTrades: boolean;
    ibConnected: boolean;
    newsBlocked: boolean;
    newsWindow: any;
  };
  account: {
    balance: number;
    dailyPnL: number;
    dailyPnLPercent: number;
    availableFunds?: number;
    buyingPower?: number;
  };
  performance: {
    totalTrades: number;
    openTrades: number;
    winRate: number;
    totalPnL: number;
    avgWin: number;
    avgLoss: number;
    currentStreak: number;
    today?: {
      openCount: number;
      todayTrades: number;
      todayPnL: number;
      todayWins: number;
      todayLosses: number;
    };
  };
  risk: {
    withinLimits: boolean;
    warnings: string[];
    dailyLossPercent: number;
    maxDailyLossPercent: number;
    currentPositions: number;
    maxOpenPositions: number;
    riskPerTrade: number;
    minRiskReward: number;
  };
  openTrades: Array<{
    id: string;
    symbol: string;
    direction: string;
    quantity: number;
    entryPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    pnl?: number;
    trailingStopEnabled?: boolean;
    trailingActive?: boolean;
    createdAt: string;
    ibOrderId?: number;
  }>;
  recentSignals: Array<{
    id: string;
    symbol: string;
    action: string;
    direction?: string;
    price?: number;
    status: string;
    strategy?: string;
    createdAt: string;
    errorMessage?: string;
  }>;
  protection: {
    rateLimit: { totalIPs: number; blockedIPs: number; activeIPs: number };
    signalCache: string;
    newsFilter: string;
    trendFilter: string;
  };
  settings: {
    telegramEnabled: boolean;
    autoTradingEnabled: boolean;
    tradingMode: string;
    primarySymbol: string;
  };
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const res = await fetch('/api/monitoring');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // كل 10 ثواني
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="h-5 w-5" />
            <span>خطأ: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const modeColor = data.system.mode === 'LIVE' ? 'text-red-500' : 
                    data.system.mode === 'PAPER' ? 'text-yellow-500' : 'text-gray-500';
  const modeBg = data.system.mode === 'LIVE' ? 'bg-red-500/10' : 
                 data.system.mode === 'PAPER' ? 'bg-yellow-500/10' : 'bg-gray-500/10';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">لوحة المراقبة</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={data.system.ibConnected ? "default" : "destructive"} className="gap-1">
            {data.system.ibConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {data.system.ibConnected ? 'IB متصل' : 'IB غير متصل'}
          </Badge>
          <Badge className={`${modeBg} ${modeColor}`}>
            {data.system.mode}
          </Badge>
          <span className="text-xs text-muted-foreground">
            آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
          </span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Account Balance */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-green-500" />
              <Badge variant="outline">{data.system.mode}</Badge>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">${data.account.balance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">رصيد الحساب</p>
            </div>
          </CardContent>
        </Card>

        {/* Daily P&L */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {data.account.dailyPnL >= 0 ? 
                <TrendingUp className="h-8 w-8 text-green-500" /> : 
                <TrendingDown className="h-8 w-8 text-red-500" />
              }
              <Badge variant={data.account.dailyPnL >= 0 ? "default" : "destructive"}>
                {data.account.dailyPnLPercent.toFixed(2)}%
              </Badge>
            </div>
            <div className="mt-2">
              <p className={`text-2xl font-bold ${data.account.dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.account.dailyPnL >= 0 ? '+' : ''}${data.account.dailyPnL.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">P&L اليومي</p>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <span className="text-xs text-muted-foreground">{data.performance.totalTrades} صفقة</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{data.performance.winRate.toFixed(1)}%</p>
              <Progress value={data.performance.winRate} className="h-2 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">نسبة الفوز</p>
            </div>
          </CardContent>
        </Card>

        {/* Open Positions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-purple-500" />
              <Badge variant={data.risk.currentPositions >= data.risk.maxOpenPositions ? "destructive" : "secondary"}>
                {data.risk.currentPositions}/{data.risk.maxOpenPositions}
              </Badge>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{data.performance.openTrades}</p>
              <p className="text-xs text-muted-foreground">صفقات مفتوحة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk & Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              حالة المخاطر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">الحد اليومي</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={data.risk.dailyLossPercent} 
                    max={data.risk.maxDailyLossPercent}
                    className="w-24 h-2"
                  />
                  <span className="text-xs">{data.risk.dailyLossPercent.toFixed(1)}%/{data.risk.maxDailyLossPercent}%</span>
                </div>
              </div>
              
              {data.risk.warnings.length > 0 ? (
                <div className="space-y-1">
                  {data.risk.warnings.map((warning, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-yellow-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>ضمن الحدود الآمنة</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Protection Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              أنظمة الحماية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Rate Limit</Badge>
                <span>{data.protection.rateLimit.blockedIPs} محظور</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">News</Badge>
                <span>{data.protection.newsFilter}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Trend</Badge>
                <span>{data.protection.trendFilter}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={data.settings.telegramEnabled ? "default" : "secondary"} className="text-xs">
                  <Bell className="h-3 w-3 mr-1" />
                  Telegram
                </Badge>
                <span>{data.settings.telegramEnabled ? 'مفعّل' : 'معطّل'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Trades */}
      {data.openTrades.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              الصفقات المفتوحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {data.openTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.direction === 'LONG' || trade.direction === 'CALL' ? "default" : "destructive"}>
                        {trade.direction}
                      </Badge>
                      <span className="font-medium">{trade.symbol}</span>
                      <span className="text-xs text-muted-foreground">x{trade.quantity}</span>
                      {trade.trailingStopEnabled && (
                        <Badge variant="outline" className="text-xs">TS</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">${trade.entryPrice.toFixed(2)}</p>
                      {trade.pnl !== undefined && (
                        <p className={`text-xs ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recent Signals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            آخر الإشارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {data.recentSignals.map((signal) => (
                <div key={signal.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      signal.status === 'EXECUTED' ? "default" :
                      signal.status === 'FAILED' ? "destructive" :
                      signal.status === 'IGNORED' ? "secondary" : "outline"
                    }>
                      {signal.status}
                    </Badge>
                    <span className="font-medium">{signal.symbol}</span>
                    <span className="text-xs">{signal.action}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(signal.createdAt).toLocaleTimeString('ar-SA')}
                    </p>
                    {signal.errorMessage && (
                      <p className="text-xs text-red-500 truncate max-w-[150px]">{signal.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
