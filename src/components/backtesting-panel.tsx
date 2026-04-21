"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Shield,
  Clock,
  BarChart3,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface Strategy {
  name: string;
  description: string;
}

interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  maxDrawdown: number;
}

interface BacktestResult {
  config: BacktestConfig;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  avgWin: number;
  avgLoss: number;
  avgWinPercent: number;
  avgLossPercent: number;
  profitFactor: number | string;
  sharpeRatio: string;
  sortinoRatio: string;
  calmarRatio: string;
  maxWinStreak: number;
  maxLossStreak: number;
  tradingDays: number;
  avgTradeDuration: string;
  equityCurve: Array<{ timestamp: number; equity: number }>;
  monthlyReturns: Array<{ month: string; return: number }>;
  recentTrades: Array<{
    symbol: string;
    direction: string;
    entryTime: string;
    entryPrice: string;
    exitTime: string;
    exitPrice: string;
    pnl: string;
    pnlPercent: string;
    exitReason: string;
  }>;
}

export function BacktestingPanel() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [config, setConfig] = useState<BacktestConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedStrategy, setSelectedStrategy] = useState('RSI Reversal');
  const [symbol, setSymbol] = useState('SPX');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialCapital, setInitialCapital] = useState('100000');
  const [riskPerTrade, setRiskPerTrade] = useState('1');
  const [maxDrawdown, setMaxDrawdown] = useState('20');

  // Fetch strategies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/backtesting');
        const data = await res.json();
        if (data.success) {
          setStrategies(data.strategies);
          setConfig(data.defaultConfig);
          setStartDate(new Date(data.defaultConfig.startDate).toISOString().split('T')[0]);
          setEndDate(new Date(data.defaultConfig.endDate).toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error('Error fetching strategies:', err);
      }
    };
    fetchData();
  }, []);

  const runBacktest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/backtesting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: selectedStrategy,
          symbol,
          startDate,
          endDate,
          initialCapital: parseFloat(initialCapital),
          riskPerTrade: parseFloat(riskPerTrade),
          maxDrawdown: parseFloat(maxDrawdown)
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'حدث خطأ في الاختبار');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedStrategy, symbol, startDate, endDate, initialCapital, riskPerTrade, maxDrawdown]);

  // Render equity curve
  const renderEquityCurve = () => {
    if (!result?.equityCurve?.length) return null;
    
    const minEquity = Math.min(...result.equityCurve.map(p => p.equity));
    const maxEquity = Math.max(...result.equityCurve.map(p => p.equity));
    const range = maxEquity - minEquity || 1;
    
    const width = 400;
    const height = 120;
    const points = result.equityCurve.map((p, i) => {
      const x = (i / (result.equityCurve.length - 1)) * width;
      const y = height - ((p.equity - minEquity) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
        <polyline
          fill="none"
          stroke={result.totalReturn >= 0 ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  // Render monthly returns
  const renderMonthlyReturns = () => {
    if (!result?.monthlyReturns?.length) return null;
    
    const maxAbs = Math.max(...result.monthlyReturns.map(m => Math.abs(m.return))) || 1;
    
    return (
      <div className="flex items-end gap-1 h-20">
        {result.monthlyReturns.slice(-12).map((m, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className={`w-full rounded-t ${
                m.return >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                height: `${Math.abs(m.return) / maxAbs * 100}%`,
                minHeight: '2px'
              }}
            />
            <span className="text-[8px] text-muted-foreground">
              {m.month.split('-')[1]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">الاختبار الرجعي</h2>
        </div>
        <Badge variant="outline" className="gap-1">
          <Target className="h-3 w-3" />
          Backtesting Engine
        </Badge>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">إعدادات الاختبار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Strategy */}
            <div className="space-y-2">
              <Label className="text-xs">الاستراتيجية</Label>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(s => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Symbol */}
            <div className="space-y-2">
              <Label className="text-xs">الرمز</Label>
              <Input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-xs">من تاريخ</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-xs">إلى تاريخ</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            {/* Initial Capital */}
            <div className="space-y-2">
              <Label className="text-xs">رأس المال</Label>
              <Input type="number" value={initialCapital} onChange={e => setInitialCapital(e.target.value)} />
            </div>

            {/* Risk Per Trade */}
            <div className="space-y-2">
              <Label className="text-xs">المخاطرة/صفقة %</Label>
              <Input type="number" value={riskPerTrade} onChange={e => setRiskPerTrade(e.target.value)} />
            </div>

            {/* Max Drawdown */}
            <div className="space-y-2">
              <Label className="text-xs">أقصى Drawdown %</Label>
              <Input type="number" value={maxDrawdown} onChange={e => setMaxDrawdown(e.target.value)} />
            </div>

            {/* Run Button */}
            <div className="flex items-end">
              <Button 
                onClick={runBacktest} 
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    جاري الاختبار...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    تشغيل الاختبار
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Strategy Description */}
          {selectedStrategy && strategies.find(s => s.name === selectedStrategy)?.description && (
            <p className="text-xs text-muted-foreground mt-3">
              📋 {strategies.find(s => s.name === selectedStrategy)?.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">إجمالي العائد</p>
                <p className={`text-xl font-bold ${result.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(0)}
                </p>
                <p className={`text-xs ${result.totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {result.totalReturnPercent >= 0 ? '+' : ''}{result.totalReturnPercent.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">نسبة الفوز</p>
                <p className="text-xl font-bold">{result.winRate.toFixed(1)}%</p>
                <Progress value={result.winRate} className="h-1 mt-1" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">عدد الصفقات</p>
                <p className="text-xl font-bold">{result.totalTrades}</p>
                <p className="text-xs text-muted-foreground">
                  🟢 {result.winningTrades} / 🔴 {result.losingTrades}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Max Drawdown</p>
                <p className="text-xl font-bold text-red-500">
                  -{result.maxDrawdownPercent.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  ${result.maxDrawdown.toFixed(0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Profit Factor</p>
                <p className="text-xl font-bold">{result.profitFactor}</p>
                <p className="text-xs text-muted-foreground">
                  Sharpe: {result.sharpeRatio}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Equity Curve */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  منحنى رأس المال
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderEquityCurve()}
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{new Date(result.equityCurve[0]?.timestamp).toLocaleDateString()}</span>
                  <span>{new Date(result.equityCurve[result.equityCurve.length - 1]?.timestamp).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Returns */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  العوائد الشهرية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderMonthlyReturns()}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">إحصائيات مفصلة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">متوسط الربح</p>
                  <p className="font-medium text-green-500">+${result.avgWin.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">({result.avgWinPercent.toFixed(2)}%)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">متوسط الخسارة</p>
                  <p className="font-medium text-red-500">-${result.avgLoss.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">({result.avgLossPercent.toFixed(2)}%)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">أطول سلسلة رابحة</p>
                  <p className="font-medium text-green-500">{result.maxWinStreak} صفقات</p>
                </div>
                <div>
                  <p className="text-muted-foreground">أطول سلسلة خاسرة</p>
                  <p className="font-medium text-red-500">{result.maxLossStreak} صفقات</p>
                </div>
                <div>
                  <p className="text-muted-foreground">العائد السنوي</p>
                  <p className={`font-medium ${result.annualizedReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {result.annualizedReturn >= 0 ? '+' : ''}{result.annualizedReturn.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sortino Ratio</p>
                  <p className="font-medium">{result.sortinoRatio}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Calmar Ratio</p>
                  <p className="font-medium">{result.calmarRatio}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">متوسط مدة الصفقة</p>
                  <p className="font-medium">{result.avgTradeDuration} دقيقة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">آخر الصفقات</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {result.recentTrades.map((trade, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={trade.direction === 'LONG' ? 'default' : 'destructive'}
                          className="text-[10px]"
                        >
                          {trade.direction}
                        </Badge>
                        <span>{trade.symbol}</span>
                        <span className="text-muted-foreground">
                          @ ${trade.entryPrice}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{trade.exitReason}</span>
                        <span className={parseFloat(trade.pnl) >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {parseFloat(trade.pnl) >= 0 ? '+' : ''}${trade.pnl}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BacktestingPanel;
