"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  Activity,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Target,
  Shield,
  Volume2,
  ChevronUp,
  ChevronDown,
  Settings,
  Info,
  DollarSign,
  StopCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Types for new API response
interface SignalConfirmation {
  indicator: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  strength: number;
  reason: string;
  weight: number;
}

interface TradingSignal {
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  direction: 'CALL' | 'PUT' | 'NEUTRAL';
  confidence: number;
  price: number;
  confirmations: SignalConfirmation[];
  confirmationCount: number;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  ema: { short: number; medium: number; long: number };
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  trendStrength: number;
  adx: number;
  suggestedEntry: number;
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
  riskRewardRatio: number;
  timestamp: string;
  source: string;
  isReal: boolean;
  warnings: string[];
}

interface SmartAnalysisData {
  success: boolean;
  data: TradingSignal;
  summary: {
    signal: string;
    direction: string;
    confidence: number;
    confirmations: number;
    riskReward: string;
    isReal: boolean;
  };
}

interface TradingSettings {
  mode: 'conservative' | 'balanced' | 'aggressive';
  symbols: string[];
  contracts: number;
  confidenceThreshold: number;
  autoTrade: boolean;
  autoStrike: boolean;
}

// Default settings
const defaultSettings: TradingSettings = {
  mode: 'balanced',
  symbols: ['SPX', 'SPY'],
  contracts: 2,
  confidenceThreshold: 70,
  autoTrade: false,
  autoStrike: true,
};

interface SmartAnalysisPanelProps {
  lang?: 'en' | 'ar';
}

export function SmartAnalysisPanel({ lang = 'ar' }: SmartAnalysisPanelProps) {
  const isRTL = lang === 'ar';
  
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [analysis, setAnalysis] = useState<SmartAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<TradingSettings>(defaultSettings);
  const [selectedSymbol, setSelectedSymbol] = useState('SPX');
  const [error, setError] = useState<string | null>(null);
  
  // Translations
  const t = {
    title: isRTL ? 'التحليل الذكي المتقدم' : 'Advanced Smart Analysis',
    subtitle: isRTL ? '6 مؤشرات فنية مع تأكيد متعدد' : '6 technical indicators with multi-confirmation',
    start: isRTL ? 'تشغيل' : 'Start',
    stop: isRTL ? 'إيقاف' : 'Stop',
    running: isRTL ? 'يعمل' : 'Running',
    stopped: isRTL ? 'متوقف' : 'Stopped',
    refresh: isRTL ? 'تحديث' : 'Refresh',
    mode: isRTL ? 'الوضع' : 'Mode',
    conservative: isRTL ? 'محافظ' : 'Conservative',
    balanced: isRTL ? 'متوازن' : 'Balanced',
    aggressive: isRTL ? 'عدواني' : 'Aggressive',
    contracts: isRTL ? 'عدد العقود' : 'Contracts',
    confidence: isRTL ? 'الحد الأدنى للثقة' : 'Min Confidence',
    autoTrade: isRTL ? 'تداول تلقائي' : 'Auto Trade',
    autoStrike: isRTL ? 'استرايك تلقائي' : 'Auto Strike',
    indicators: isRTL ? 'المؤشرات الفنية' : 'Technical Indicators',
    explosion: isRTL ? 'كاشف الانفجارات' : 'Explosion Detector',
    trend: isRTL ? 'قوة الاتجاه' : 'Trend Strength',
    volume: isRTL ? 'تحليل الحجم' : 'Volume Analysis',
    supplyDemand: isRTL ? 'العرض والطلب' : 'Supply & Demand',
    signals: isRTL ? 'الإشارات' : 'Signals',
    warnings: isRTL ? 'تحذيرات' : 'Warnings',
    call: isRTL ? 'شراء CALL' : 'CALL',
    put: isRTL ? 'بيع PUT' : 'PUT',
    neutral: isRTL ? 'محايد' : 'Neutral',
    bullish: isRTL ? 'صعودي' : 'Bullish',
    bearish: isRTL ? 'هبوطي' : 'Bearish',
    detected: isRTL ? 'تم الكشف!' : 'Detected!',
    notDetected: isRTL ? 'لا يوجد' : 'Not Detected',
    strong: isRTL ? 'قوي' : 'Strong',
    weak: isRTL ? 'ضعيف' : 'Weak',
    unusual: isRTL ? 'غير عادي' : 'Unusual',
    normal: isRTL ? 'عادي' : 'Normal',
    price: isRTL ? 'السعر' : 'Price',
    symbol: isRTL ? 'الرمز' : 'Symbol',
    analyze: isRTL ? 'تحليل' : 'Analyze',
    analyzing: isRTL ? 'جاري التحليل...' : 'Analyzing...',
    noData: isRTL ? 'لا توجد بيانات' : 'No data',
    error: isRTL ? 'حدث خطأ' : 'Error',
    realData: isRTL ? 'بيانات حقيقية' : 'Real Data',
    simulatedData: isRTL ? 'بيانات محاكاة' : 'Simulated Data',
    riskManagement: isRTL ? 'إدارة المخاطر' : 'Risk Management',
    entry: isRTL ? 'الدخول' : 'Entry',
    stopLoss: isRTL ? 'وقف الخسارة' : 'Stop Loss',
    takeProfit: isRTL ? 'جني الأرباح' : 'Take Profit',
    riskReward: isRTL ? 'المخاطرة/العائد' : 'Risk/Reward',
    confirmations: isRTL ? 'التأكيدات' : 'Confirmations',
    strategy: isRTL ? 'الاستراتيجية' : 'Strategy',
  };

  // Fetch analysis
  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/smart-analysis?symbol=${selectedSymbol}&mode=full`);
      const data = await res.json();
      
      if (data.success) {
        setAnalysis(data);
        if (!data.summary.isReal) {
          toast.warning(isRTL ? 'تحذير: البيانات غير حقيقية' : 'Warning: Data is not real');
        }
      } else {
        setError(data.error || t.error);
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      fetchAnalysis();
      interval = setInterval(fetchAnalysis, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, selectedSymbol]);

  // Save/load settings
  useEffect(() => {
    localStorage.setItem('smartAnalysisSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const saved = localStorage.getItem('smartAnalysisSettings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {}
    }
  }, []);

  // Get signal badge
  const getSignalBadge = (signal: string, direction?: string) => {
    const isBuy = signal === 'BUY' || signal === 'STRONG_BUY' || direction === 'CALL';
    const isSell = signal === 'SELL' || signal === 'STRONG_SELL' || direction === 'PUT';
    
    if (isBuy) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" />
          {t.call}
        </Badge>
      );
    }
    if (isSell) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
          <ArrowDownRight className="w-3 h-3" />
          {t.put}
        </Badge>
      );
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{t.neutral}</Badge>;
  };

  const signal = analysis?.data;

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Control Panel */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {t.title}
                  {analysis?.summary.isReal ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      {t.realData}
                    </Badge>
                  ) : analysis && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                      {t.simulatedData}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-400">{t.subtitle}</CardDescription>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={isRunning ? "border-green-500 text-green-400" : "border-slate-500 text-slate-400"}
            >
              {isRunning ? t.running : t.stopped}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => setIsRunning(true)} disabled={isRunning} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              {t.start}
            </Button>
            <Button onClick={() => setIsRunning(false)} disabled={!isRunning} variant="destructive" className="flex-1">
              <Square className="w-4 h-4 mr-2" />
              {t.stop}
            </Button>
            <Button onClick={fetchAnalysis} disabled={loading} variant="outline" className="border-slate-600">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Symbol & Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t.symbol}</Label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPX">SPX</SelectItem>
                  <SelectItem value="SPY">SPY</SelectItem>
                  <SelectItem value="QQQ">QQQ</SelectItem>
                  <SelectItem value="AAPL">AAPL</SelectItem>
                  <SelectItem value="TSLA">TSLA</SelectItem>
                  <SelectItem value="NVDA">NVDA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t.mode}</Label>
              <Select value={settings.mode} onValueChange={(v) => setSettings({...settings, mode: v as TradingSettings['mode']})}>
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">{t.conservative}</SelectItem>
                  <SelectItem value="balanced">{t.balanced}</SelectItem>
                  <SelectItem value="aggressive">{t.aggressive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t.contracts}</Label>
              <Input type="number" value={settings.contracts} onChange={(e) => setSettings({...settings, contracts: parseInt(e.target.value) || 1})} className="bg-slate-800 border-slate-600" min={1} max={10} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t.confidence} (%)</Label>
              <Input type="number" value={settings.confidenceThreshold} onChange={(e) => setSettings({...settings, confidenceThreshold: parseInt(e.target.value) || 70})} className="bg-slate-800 border-slate-600" min={50} max={95} />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={settings.autoTrade} onCheckedChange={(v) => setSettings({...settings, autoTrade: v})} />
              <Label className="text-slate-300">{t.autoTrade}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings.autoStrike} onCheckedChange={(v) => setSettings({...settings, autoStrike: v})} />
              <Label className="text-slate-300">{t.autoStrike}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {signal && (
        <div className="grid gap-4">
          {/* Overall Signal */}
          <Card className={`bg-gradient-to-br ${signal.direction === 'CALL' ? 'from-green-900/30 to-slate-900 border-green-500' : signal.direction === 'PUT' ? 'from-red-900/30 to-slate-900 border-red-500' : 'from-slate-900 to-slate-800 border-slate-700'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${signal.direction === 'CALL' ? 'bg-green-500/20' : signal.direction === 'PUT' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                    {signal.direction === 'CALL' ? (
                      <TrendingUp className="w-8 h-8 text-green-400" />
                    ) : signal.direction === 'PUT' ? (
                      <TrendingDown className="w-8 h-8 text-red-400" />
                    ) : (
                      <Activity className="w-8 h-8 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {signal.signal.replace('_', ' ')}
                    </div>
                    <div className="text-slate-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {signal.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-slate-400">{isRTL ? 'الثقة' : 'Confidence'}</div>
                  <div className="text-3xl font-bold text-white">{signal.confidence}%</div>
                  <Progress value={signal.confidence} className={`h-2 mt-1 ${signal.confidence >= 70 ? 'bg-green-500' : signal.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <div className="text-xs text-slate-400 mt-1">
                    {signal.confirmationCount} {t.confirmations}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmations */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {t.confirmations}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {signal.confirmations.map((conf, i) => (
                  <div key={i} className={`p-2 rounded-lg ${conf.signal.includes('BUY') ? 'bg-green-900/20' : conf.signal.includes('SELL') ? 'bg-red-900/20' : 'bg-slate-700/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 text-xs font-medium">{conf.indicator}</span>
                      {getSignalBadge(conf.signal)}
                    </div>
                    <div className="text-white font-bold">{conf.strength}%</div>
                    <div className="text-xs text-slate-500 truncate">{conf.reason}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                {t.riskManagement}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-slate-400 text-xs mb-1">{t.entry}</div>
                  <div className="text-white font-bold">${signal.suggestedEntry.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 text-xs mb-1">{t.stopLoss}</div>
                  <div className="text-red-400 font-bold">${signal.suggestedStopLoss.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 text-xs mb-1">{t.takeProfit}</div>
                  <div className="text-green-400 font-bold">${signal.suggestedTakeProfit.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 text-xs mb-1">{t.riskReward}</div>
                  <div className="text-blue-400 font-bold">{signal.riskRewardRatio.toFixed(1)}:1</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* RSI */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="text-slate-400 text-sm mb-1">RSI</div>
                <div className="text-2xl font-bold text-white">{signal.rsi.toFixed(1)}</div>
                <Progress value={signal.rsi} className={`h-1 mt-2 ${signal.rsi < 30 ? 'bg-green-500' : signal.rsi > 70 ? 'bg-red-500' : 'bg-yellow-500'}`} />
              </CardContent>
            </Card>

            {/* MACD */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="text-slate-400 text-sm mb-1">MACD Histogram</div>
                <div className={`text-2xl font-bold ${signal.macd.histogram >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {signal.macd.histogram.toFixed(2)}
                </div>
                <Progress value={Math.abs(signal.macd.histogram) * 20} className="h-1 mt-2" />
              </CardContent>
            </Card>

            {/* ADX */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="text-slate-400 text-sm mb-1">ADX</div>
                <div className="text-2xl font-bold text-white">{signal.adx.toFixed(1)}</div>
                <Progress value={signal.adx} className={`h-1 mt-2 ${signal.adx >= 25 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </CardContent>
            </Card>

            {/* ATR */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="text-slate-400 text-sm mb-1">ATR</div>
                <div className="text-2xl font-bold text-white">{signal.atr.toFixed(2)}</div>
                <div className="text-xs text-slate-500 mt-1">{isRTL ? 'التقلب' : 'Volatility'}</div>
              </CardContent>
            </Card>
          </div>

          {/* Warnings */}
          {signal.warnings.length > 0 && (
            <Card className="bg-yellow-900/20 border-yellow-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 font-medium">{t.warnings}</span>
                </div>
                <div className="space-y-1">
                  {signal.warnings.map((warning, i) => (
                    <div key={i} className="text-sm text-yellow-200">⚠ {warning}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && !analysis && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-4" />
            <span className="text-slate-300">{t.analyzing}</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-red-900/20 border-red-500">
          <CardContent className="py-8 flex flex-col items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
            <span className="text-red-300">{error}</span>
            <Button onClick={fetchAnalysis} variant="outline" className="mt-4 border-red-500 text-red-300">
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading && !analysis && !error && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <Brain className="w-12 h-12 text-slate-500 mb-4" />
            <span className="text-slate-400">{t.noData}</span>
            <Button onClick={fetchAnalysis} className="mt-4 bg-purple-600 hover:bg-purple-700">
              {t.analyze}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
