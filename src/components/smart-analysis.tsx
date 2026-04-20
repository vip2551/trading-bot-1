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
import { toast } from "sonner";

// Types
interface SmartAnalysisData {
  success: boolean;
  symbol: string;
  price: number;
  timestamp: number;
  analysis: {
    rsi: { value: number; signal: string; strength: number; confidence: number };
    macd: { value: number; signal: string; strength: number; confidence: number };
    ema: { value: number; signal: string; strength: number; confidence: number };
    bollinger: { value: number; signal: string; strength: number; confidence: number };
    overall: {
      direction: 'CALL' | 'PUT' | 'NEUTRAL';
      confidence: number;
      signals: string[];
      warnings: string[];
    };
  };
  explosion: {
    detected: boolean;
    direction: 'CALL' | 'PUT' | 'NEUTRAL';
    confidence: number;
    reasons: string[];
  };
  trend: {
    direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number;
    adx: number;
    isStrong: boolean;
  };
  supplyDemand: Array<{
    type: 'SUPPLY' | 'DEMAND';
    price: number;
    strength: number;
  }>;
  volume: {
    ratio: number;
    isUnusual: boolean;
    signal: 'HIGH' | 'LOW' | 'NORMAL';
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
    title: isRTL ? 'التحليل الذكي الشامل' : 'Smart Analysis',
    subtitle: isRTL ? 'تحليل فني متكامل مع 4 مؤشرات' : 'Complete technical analysis with 4 indicators',
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
  };

  // Fetch analysis
  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/smart-analysis?symbol=${selectedSymbol}&action=full`);
      const data = await res.json();
      
      if (data.success) {
        setAnalysis(data);
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
      interval = setInterval(fetchAnalysis, 30000); // Every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, selectedSymbol]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('smartAnalysisSettings', JSON.stringify(settings));
  }, [settings]);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('smartAnalysisSettings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {}
    }
  }, []);

  // Get signal color
  const getSignalColor = (signal: string) => {
    if (signal === 'BUY' || signal === 'CALL' || signal === 'BULLISH') return 'text-green-500';
    if (signal === 'SELL' || signal === 'PUT' || signal === 'BEARISH') return 'text-red-500';
    return 'text-yellow-500';
  };

  // Get signal badge
  const getSignalBadge = (signal: string) => {
    if (signal === 'BUY' || signal === 'CALL' || signal === 'BULLISH') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{t.call}</Badge>;
    }
    if (signal === 'SELL' || signal === 'PUT' || signal === 'BEARISH') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{t.put}</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{t.neutral}</Badge>;
  };

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
                <CardTitle className="text-white">{t.title}</CardTitle>
                <CardDescription className="text-slate-400">{t.subtitle}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={isRunning ? "border-green-500 text-green-400" : "border-slate-500 text-slate-400"}
              >
                {isRunning ? t.running : t.stopped}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Start/Stop Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => setIsRunning(true)}
              disabled={isRunning}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              {t.start}
            </Button>
            <Button
              onClick={() => setIsRunning(false)}
              disabled={!isRunning}
              variant="destructive"
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              {t.stop}
            </Button>
            <Button
              onClick={fetchAnalysis}
              disabled={loading}
              variant="outline"
              className="border-slate-600"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Symbol Selection */}
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
                  <SelectItem value="NDX">NDX</SelectItem>
                  <SelectItem value="TSLA">TSLA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t.mode}</Label>
              <Select 
                value={settings.mode} 
                onValueChange={(v) => setSettings({...settings, mode: v as TradingSettings['mode']})}
              >
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
              <Input
                type="number"
                value={settings.contracts}
                onChange={(e) => setSettings({...settings, contracts: parseInt(e.target.value) || 1})}
                className="bg-slate-800 border-slate-600"
                min={1}
                max={10}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t.confidence} (%)</Label>
              <Input
                type="number"
                value={settings.confidenceThreshold}
                onChange={(e) => setSettings({...settings, confidenceThreshold: parseInt(e.target.value) || 70})}
                className="bg-slate-800 border-slate-600"
                min={50}
                max={95}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.autoTrade}
                onCheckedChange={(v) => setSettings({...settings, autoTrade: v})}
              />
              <Label className="text-slate-300">{t.autoTrade}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.autoStrike}
                onCheckedChange={(v) => setSettings({...settings, autoStrike: v})}
              />
              <Label className="text-slate-300">{t.autoStrike}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid gap-4">
          {/* Overall Direction */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    analysis.analysis.overall.direction === 'CALL' 
                      ? 'bg-green-500/20' 
                      : analysis.analysis.overall.direction === 'PUT'
                      ? 'bg-red-500/20'
                      : 'bg-yellow-500/20'
                  }`}>
                    {analysis.analysis.overall.direction === 'CALL' ? (
                      <TrendingUp className="w-8 h-8 text-green-400" />
                    ) : analysis.analysis.overall.direction === 'PUT' ? (
                      <TrendingDown className="w-8 h-8 text-red-400" />
                    ) : (
                      <Activity className="w-8 h-8 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {analysis.analysis.overall.direction === 'CALL' 
                        ? t.call 
                        : analysis.analysis.overall.direction === 'PUT'
                        ? t.put
                        : t.neutral}
                    </div>
                    <div className="text-slate-400">{t.price}: {analysis.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-slate-400">{isRTL ? 'الثقة' : 'Confidence'}</div>
                  <div className="text-3xl font-bold text-white">{analysis.analysis.overall.confidence}%</div>
                  <Progress value={analysis.analysis.overall.confidence} className="h-2 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicators Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* RSI */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">RSI</span>
                  {getSignalBadge(analysis.analysis.rsi.signal)}
                </div>
                <div className="text-2xl font-bold text-white">
                  {analysis.analysis.rsi.value.toFixed(1)}
                </div>
                <Progress value={analysis.analysis.rsi.confidence} className="h-1 mt-2" />
              </CardContent>
            </Card>

            {/* MACD */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">MACD</span>
                  {getSignalBadge(analysis.analysis.macd.signal)}
                </div>
                <div className="text-2xl font-bold text-white">
                  {analysis.analysis.macd.value.toFixed(2)}
                </div>
                <Progress value={analysis.analysis.macd.confidence} className="h-1 mt-2" />
              </CardContent>
            </Card>

            {/* EMA */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">EMA</span>
                  {getSignalBadge(analysis.analysis.ema.signal)}
                </div>
                <div className="text-2xl font-bold text-white">
                  {analysis.analysis.ema.value.toFixed(1)}
                </div>
                <Progress value={analysis.analysis.ema.confidence} className="h-1 mt-2" />
              </CardContent>
            </Card>

            {/* Bollinger */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">BB %B</span>
                  {getSignalBadge(analysis.analysis.bollinger.signal)}
                </div>
                <div className="text-2xl font-bold text-white">
                  {(analysis.analysis.bollinger.value * 100).toFixed(0)}%
                </div>
                <Progress value={analysis.analysis.bollinger.confidence} className="h-1 mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Explosion & Trend */}
          <div className="grid grid-cols-2 gap-4">
            {/* Explosion Detector */}
            <Card className={`border ${analysis.explosion.detected ? 'bg-orange-900/20 border-orange-500' : 'bg-slate-800/50 border-slate-700'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className={`w-5 h-5 ${analysis.explosion.detected ? 'text-orange-400' : 'text-slate-400'}`} />
                  <span className="text-slate-300 font-medium">{t.explosion}</span>
                </div>
                {analysis.explosion.detected ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {getSignalBadge(analysis.explosion.direction)}
                      <span className="text-white font-bold">{analysis.explosion.confidence}%</span>
                    </div>
                    <div className="text-xs text-orange-300 space-y-1">
                      {analysis.explosion.reasons.map((reason, i) => (
                        <div key={i}>• {reason}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">{t.notDetected}</div>
                )}
              </CardContent>
            </Card>

            {/* Trend Strength */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300 font-medium">{t.trend}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {getSignalBadge(analysis.trend.direction)}
                    <Badge variant="outline" className={analysis.trend.isStrong ? "border-green-500 text-green-400" : "border-yellow-500 text-yellow-400"}>
                      {analysis.trend.isStrong ? t.strong : t.weak}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">ADX</span>
                    <span className="text-white">{analysis.trend.adx.toFixed(1)}</span>
                  </div>
                  <Progress value={analysis.trend.strength} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volume & Supply/Demand */}
          <div className="grid grid-cols-2 gap-4">
            {/* Volume */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300 font-medium">{t.volume}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {analysis.volume.ratio.toFixed(1)}x
                    </div>
                    <Badge 
                      variant="outline" 
                      className={analysis.volume.isUnusual ? "border-cyan-500 text-cyan-400" : "border-slate-500 text-slate-400"}
                    >
                      {analysis.volume.isUnusual ? t.unusual : t.normal}
                    </Badge>
                  </div>
                  {analysis.volume.isUnusual && (
                    <div className="text-cyan-400">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supply & Demand */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300 font-medium">{t.supplyDemand}</span>
                </div>
                <ScrollArea className="h-20">
                  <div className="space-y-1">
                    {analysis.supplyDemand.slice(0, 3).map((zone, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <Badge variant="outline" className={zone.type === 'SUPPLY' ? "border-red-500 text-red-400" : "border-green-500 text-green-400"}>
                          {zone.type === 'SUPPLY' ? 'Supply' : 'Demand'}
                        </Badge>
                        <span className="text-white">{zone.price.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Signals & Warnings */}
          {(analysis.analysis.overall.signals.length > 0 || analysis.analysis.overall.warnings.length > 0) && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Signals */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 font-medium">{t.signals}</span>
                    </div>
                    <div className="space-y-1">
                      {analysis.analysis.overall.signals.map((signal, i) => (
                        <div key={i} className="text-sm text-green-300">✓ {signal}</div>
                      ))}
                    </div>
                  </div>
                  {/* Warnings */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-300 font-medium">{t.warnings}</span>
                    </div>
                    <div className="space-y-1">
                      {analysis.analysis.overall.warnings.map((warning, i) => (
                        <div key={i} className="text-sm text-yellow-300">⚠ {warning}</div>
                      ))}
                    </div>
                  </div>
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
