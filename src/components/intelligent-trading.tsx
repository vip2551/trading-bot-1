"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Shield,
  Brain,
  Gauge,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  LineChart,
  CandlestickChart,
  Settings,
  Play,
  Square,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// Types
interface IndicatorStatus {
  name: string;
  nameAr: string;
  value: number;
  signal: "BUY" | "SELL" | "NEUTRAL";
  strength: number;
  confidence: number;
  enabled: boolean;
}

interface ExplosionSignal {
  detected: boolean;
  direction: "CALL" | "PUT" | "NEUTRAL";
  confidence: number;
  reasons: string[];
}

interface TrendAnalysis {
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: number;
  adx: number;
  isStrong: boolean;
}

interface ReversalSignal {
  detected: boolean;
  type: "BULLISH" | "BEARISH" | null;
  strength: number;
  indicator: string;
}

interface InstitutionalActivity {
  detected: boolean;
  type: string;
  volume: number;
  significance: number;
}

interface SupplyDemandZone {
  type: "SUPPLY" | "DEMAND";
  price: number;
  strength: number;
  distance: number;
}

interface TradingSignal {
  direction: "CALL" | "PUT" | "NEUTRAL";
  confidence: number;
  quality: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  warnings: string[];
  indicators: IndicatorStatus[];
  explosion?: ExplosionSignal;
  trend?: TrendAnalysis;
  reversal?: ReversalSignal;
  institutional?: InstitutionalActivity;
  zones?: SupplyDemandZone[];
}

interface TradingSettings {
  tradingMode: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
  activeSymbols: string[];
  contractSizeMode: "FIXED" | "PERCENTAGE" | "RISK_BASED" | "CONFIDENCE";
  fixedContracts: number;
  contractsPercentage: number;
  contractsRiskAmount: number;
  minContracts: number;
  maxContracts: number;
  minConfidence: number;
  // Indicator toggles
  useRSI: boolean;
  useMACD: boolean;
  useBollinger: boolean;
  useEMA: boolean;
  useADX: boolean;
  // Detection toggles
  detectExplosions: boolean;
  detectReversals: boolean;
  detectInstitutional: boolean;
  detectSupplyDemand: boolean;
}

// Translations
const translations = {
  en: {
    intelligentTrading: "Intelligent Trading System",
    systemDescription: "Advanced analysis with technical indicators and smart signals",
    tradingModes: "Trading Modes",
    conservative: "Conservative",
    balanced: "Balanced",
    aggressive: "Aggressive",
    conservativeDesc: "High accuracy, fewer trades (80%+ confidence)",
    balancedDesc: "Balance between accuracy and quantity (70%+ confidence)",
    aggressiveDesc: "More trades, lower threshold (60%+ confidence)",
    technicalIndicators: "Technical Indicators",
    signalDetection: "Signal Detection",
    priceExplosion: "Price Explosion",
    reversalDetection: "Reversal Detection",
    institutionalActivity: "Institutional Activity",
    supplyDemand: "Supply & Demand Zones",
    contractSettings: "Contract Settings",
    fixed: "Fixed",
    percentage: "Percentage",
    riskBased: "Risk Based",
    confidenceBased: "Confidence Based",
    contracts: "Contracts",
    minConfidence: "Min Confidence",
    currentSignal: "Current Signal",
    analysisResults: "Analysis Results",
    runAnalysis: "Run Analysis",
    analyzing: "Analyzing...",
    activeSymbols: "Active Symbols",
    addSymbol: "Add Symbol",
    indicatorsEnabled: "Indicators Enabled",
    detectionEnabled: "Detection Enabled",
    strength: "Strength",
    confidence: "Confidence",
    signal: "Signal",
    buy: "BUY",
    sell: "SELL",
    neutral: "NEUTRAL",
    call: "CALL",
    put: "PUT",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
    reasons: "Reasons",
    warnings: "Warnings",
    explosionAlert: "Explosion Alert!",
    trendStrength: "Trend Strength",
    reversalWarning: "Reversal Warning",
    institutionalDetected: "Institutional Activity",
    nearZone: "Near Zone",
    settingsSaved: "Settings saved!",
    analysisComplete: "Analysis complete!",
  },
  ar: {
    intelligentTrading: "نظام التداول الذكي",
    systemDescription: "تحليل متقدم بالمؤشرات الفنية والإشارات الذكية",
    tradingModes: "أنماط التداول",
    conservative: "محافظ",
    balanced: "متوازن",
    aggressive: "عدواني",
    conservativeDesc: "دقة عالية، صفقات أقل (ثقة 80%+)",
    balancedDesc: "توازن بين الدقة والكمية (ثقة 70%+)",
    aggressiveDesc: "صفقات أكثر، عتبة أقل (ثقة 60%+)",
    technicalIndicators: "المؤشرات الفنية",
    signalDetection: "كشف الإشارات",
    priceExplosion: "انفجار السعر",
    reversalDetection: "كشف الانعكاس",
    institutionalActivity: "النشاط المؤسسي",
    supplyDemand: "مناطق العرض والطلب",
    contractSettings: "إعدادات العقود",
    fixed: "ثابت",
    percentage: "نسبة مئوية",
    riskBased: "بناءً على المخاطرة",
    confidenceBased: "بناءً على الثقة",
    contracts: "عقود",
    minConfidence: "أقل ثقة",
    currentSignal: "الإشارة الحالية",
    analysisResults: "نتائج التحليل",
    runAnalysis: "تشغيل التحليل",
    analyzing: "جاري التحليل...",
    activeSymbols: "الرموز النشطة",
    addSymbol: "إضافة رمز",
    indicatorsEnabled: "المؤشرات مفعلة",
    detectionEnabled: "الكشف مفعل",
    strength: "القوة",
    confidence: "الثقة",
    signal: "الإشارة",
    buy: "شراء",
    sell: "بيع",
    neutral: "محايد",
    call: "كول",
    put: "بوت",
    high: "عالي",
    medium: "متوسط",
    low: "منخفض",
    reasons: "الأسباب",
    warnings: "التحذيرات",
    explosionAlert: "تنبيه انفجار!",
    trendStrength: "قوة الاتجاه",
    reversalWarning: "تحذير انعكاس",
    institutionalDetected: "نشاط مؤسسي",
    nearZone: "قرب منطقة",
    settingsSaved: "تم حفظ الإعدادات!",
    analysisComplete: "تم التحليل!",
  },
};

type Language = "en" | "ar";

export function IntelligentTradingPanel({
  lang = "ar",
  onSignalGenerated,
}: {
  lang?: Language;
  onSignalGenerated?: (signal: TradingSignal) => void;
}) {
  const t = translations[lang];
  const isRTL = lang === "ar";

  // State
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [settings, setSettings] = useState<TradingSettings>({
    tradingMode: "BALANCED",
    activeSymbols: ["SPX"],
    contractSizeMode: "FIXED",
    fixedContracts: 1,
    contractsPercentage: 2,
    contractsRiskAmount: 100,
    minContracts: 1,
    maxContracts: 10,
    minConfidence: 70,
    useRSI: true,
    useMACD: true,
    useBollinger: true,
    useEMA: true,
    useADX: true,
    detectExplosions: true,
    detectReversals: true,
    detectInstitutional: true,
    detectSupplyDemand: true,
  });

  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [newSymbol, setNewSymbol] = useState("");

  // Fetch settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings?userId=demo");
      const data = await res.json();
      if (data?.settings) {
        const s = data.settings;
        setSettings({
          tradingMode: s.tradingMode || "BALANCED",
          activeSymbols: s.activeSymbols ? JSON.parse(s.activeSymbols) : ["SPX"],
          contractSizeMode: s.contractSizeMode || "FIXED",
          fixedContracts: s.fixedContracts || 1,
          contractsPercentage: s.contractsPercentage || 2,
          contractsRiskAmount: s.contractsRiskAmount || 100,
          minContracts: s.minContracts || 1,
          maxContracts: s.maxContracts || 10,
          minConfidence: getMinConfidence(s.tradingMode || "BALANCED", s),
          useRSI: s.useRSI ?? true,
          useMACD: s.useMACD ?? true,
          useBollinger: s.useBollinger ?? true,
          useEMA: s.useEMA ?? true,
          useADX: s.useADX ?? true,
          detectExplosions: s.detectExplosions ?? true,
          detectReversals: s.detectReversals ?? true,
          detectInstitutional: s.detectInstitutional ?? true,
          detectSupplyDemand: s.detectSupplyDemand ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const getMinConfidence = (mode: string, s: any) => {
    switch (mode) {
      case "CONSERVATIVE":
        return s.minConfidenceConservative || 80;
      case "AGGRESSIVE":
        return s.minConfidenceAggressive || 60;
      default:
        return s.minConfidenceBalanced || 70;
    }
  };

  // Save settings
  const saveSettings = async (newSettings: Partial<TradingSettings>) => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo",
          tradingMode: updatedSettings.tradingMode,
          activeSymbols: JSON.stringify(updatedSettings.activeSymbols),
          contractSizeMode: updatedSettings.contractSizeMode,
          fixedContracts: updatedSettings.fixedContracts,
          contractsPercentage: updatedSettings.contractsPercentage,
          contractsRiskAmount: updatedSettings.contractsRiskAmount,
          minContracts: updatedSettings.minContracts,
          maxContracts: updatedSettings.maxContracts,
          useRSI: updatedSettings.useRSI,
          useMACD: updatedSettings.useMACD,
          useBollinger: updatedSettings.useBollinger,
          useEMA: updatedSettings.useEMA,
          useADX: updatedSettings.useADX,
          detectExplosions: updatedSettings.detectExplosions,
          detectReversals: updatedSettings.detectReversals,
          detectInstitutional: updatedSettings.detectInstitutional,
          detectSupplyDemand: updatedSettings.detectSupplyDemand,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(updatedSettings);
        toast.success(t.settingsSaved);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run analysis
  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/trading/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo",
          symbol: settings.activeSymbols[0] || "SPX",
          settings: {
            useRSI: settings.useRSI,
            useMACD: settings.useMACD,
            useBollinger: settings.useBollinger,
            useEMA: settings.useEMA,
            useADX: settings.useADX,
            detectExplosions: settings.detectExplosions,
            detectReversals: settings.detectReversals,
            detectInstitutional: settings.detectInstitutional,
            detectSupplyDemand: settings.detectSupplyDemand,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.signal) {
        setSignal(data.signal);
        onSignalGenerated?.(data.signal);
        toast.success(t.analysisComplete);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      // Generate mock signal for demo
      generateMockSignal();
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate mock signal for demo
  const generateMockSignal = () => {
    const mockSignal: TradingSignal = {
      direction: Math.random() > 0.5 ? "CALL" : "PUT",
      confidence: Math.floor(Math.random() * 30) + 60,
      quality: "MEDIUM",
      reasons: [
        lang === "ar" ? "RSI في منطقة التشبع" : "RSI in oversold zone",
        lang === "ar" ? "MACD تقاطع صاعد" : "MACD bullish crossover",
        lang === "ar" ? "السعر فوق EMA 21" : "Price above EMA 21",
      ],
      warnings: [
        lang === "ar" ? "حجم التداول منخفض" : "Low trading volume",
      ],
      indicators: [
        { name: "RSI", nameAr: "RSI", value: 35, signal: "BUY", strength: 75, confidence: 70, enabled: settings.useRSI },
        { name: "MACD", nameAr: "MACD", value: 0.5, signal: "BUY", strength: 65, confidence: 60, enabled: settings.useMACD },
        { name: "EMA", nameAr: "EMA", value: 5020, signal: "BUY", strength: 70, confidence: 65, enabled: settings.useEMA },
        { name: "Bollinger", nameAr: "Bollinger", value: 0.3, signal: "NEUTRAL", strength: 50, confidence: 45, enabled: settings.useBollinger },
        { name: "ADX", nameAr: "ADX", value: 28, signal: "BUY", strength: 60, confidence: 55, enabled: settings.useADX },
      ],
      explosion: {
        detected: Math.random() > 0.7,
        direction: "CALL",
        confidence: 75,
        reasons: [lang === "ar" ? "ضيق بولينجر شديد" : "Tight Bollinger squeeze"],
      },
      trend: {
        direction: "BULLISH",
        strength: 65,
        adx: 28,
        isStrong: true,
      },
    };
    setSignal(mockSignal);
    onSignalGenerated?.(mockSignal);
  };

  // Add symbol
  const addSymbol = () => {
    if (newSymbol && !settings.activeSymbols.includes(newSymbol.toUpperCase())) {
      const newSymbols = [...settings.activeSymbols, newSymbol.toUpperCase()];
      saveSettings({ activeSymbols: newSymbols });
      setNewSymbol("");
    }
  };

  // Remove symbol
  const removeSymbol = (symbol: string) => {
    const newSymbols = settings.activeSymbols.filter((s) => s !== symbol);
    saveSettings({ activeSymbols: newSymbols });
  };

  // Get signal color
  const getSignalColor = (sig: "BUY" | "SELL" | "NEUTRAL") => {
    switch (sig) {
      case "BUY":
        return "text-green-500";
      case "SELL":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  // Get direction color
  const getDirectionColor = (dir: "CALL" | "PUT" | "NEUTRAL") => {
    switch (dir) {
      case "CALL":
        return "bg-green-500";
      case "PUT":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  // Get quality color
  const getQualityColor = (quality: "HIGH" | "MEDIUM" | "LOW") => {
    switch (quality) {
      case "HIGH":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  return (
    <div className={`space-y-4 ${isRTL ? "rtl" : "ltr"}`}>
      {/* Trading Mode Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" />
            {t.tradingModes}
          </CardTitle>
          <CardDescription>{t.systemDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Conservative */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.tradingMode === "CONSERVATIVE"
                  ? "border-green-500 bg-green-500/10"
                  : "border-gray-200 hover:border-green-300"
              }`}
              onClick={() => saveSettings({ tradingMode: "CONSERVATIVE", minConfidence: 80 })}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{t.conservative}</span>
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground">{t.conservativeDesc}</p>
            </div>

            {/* Balanced */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.tradingMode === "BALANCED"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => saveSettings({ tradingMode: "BALANCED", minConfidence: 70 })}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{t.balanced}</span>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground">{t.balancedDesc}</p>
            </div>

            {/* Aggressive */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.tradingMode === "AGGRESSIVE"
                  ? "border-red-500 bg-red-500/10"
                  : "border-gray-200 hover:border-red-300"
              }`}
              onClick={() => saveSettings({ tradingMode: "AGGRESSIVE", minConfidence: 60 })}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{t.aggressive}</span>
                <Zap className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground">{t.aggressiveDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Settings */}
        <div className="space-y-4">
          {/* Active Symbols */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t.activeSymbols}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.activeSymbols.map((symbol) => (
                  <Badge
                    key={symbol}
                    variant="secondary"
                    className="px-3 py-1 cursor-pointer hover:bg-red-500/20"
                    onClick={() => removeSymbol(symbol)}
                  >
                    {symbol} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t.addSymbol}
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button size="sm" onClick={addSymbol} disabled={!newSymbol}>
                  +
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                {t.technicalIndicators}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "useRSI", label: "RSI", labelAr: "RSI" },
                { key: "useMACD", label: "MACD", labelAr: "MACD" },
                { key: "useBollinger", label: "Bollinger Bands", labelAr: "نطاقات بولينجر" },
                { key: "useEMA", label: "EMA Alignment", labelAr: "تALIGNEMA" },
                { key: "useADX", label: "ADX (Trend Strength)", labelAr: "ADX (قوة الاتجاه)" },
              ].map((indicator) => (
                <div key={indicator.key} className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <span>{lang === "ar" ? indicator.labelAr : indicator.label}</span>
                  </Label>
                  <Switch
                    checked={settings[indicator.key as keyof TradingSettings] as boolean}
                    onCheckedChange={(checked) =>
                      saveSettings({ [indicator.key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Signal Detection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t.signalDetection}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "detectExplosions", label: t.priceExplosion, icon: Zap },
                { key: "detectReversals", label: t.reversalDetection, icon: TrendingUp },
                { key: "detectInstitutional", label: t.institutionalActivity, icon: BarChart3 },
                { key: "detectSupplyDemand", label: t.supplyDemand, icon: Target },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Label>
                  <Switch
                    checked={settings[item.key as keyof TradingSettings] as boolean}
                    onCheckedChange={(checked) =>
                      saveSettings({ [item.key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contract Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t.contractSettings}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">{lang === "ar" ? "وضع الكمية" : "Size Mode"}</Label>
                <Select
                  value={settings.contractSizeMode}
                  onValueChange={(value) =>
                    saveSettings({ contractSizeMode: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">{t.fixed}</SelectItem>
                    <SelectItem value="PERCENTAGE">{t.percentage}</SelectItem>
                    <SelectItem value="RISK_BASED">{t.riskBased}</SelectItem>
                    <SelectItem value="CONFIDENCE">{t.confidenceBased}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.contractSizeMode === "FIXED" && (
                <div>
                  <Label className="mb-2 block">{t.contracts}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.fixedContracts}
                    onChange={(e) =>
                      saveSettings({ fixedContracts: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              )}

              {settings.contractSizeMode === "PERCENTAGE" && (
                <div>
                  <Label className="mb-2 block">% {lang === "ar" ? "من المحفظة" : "of Portfolio"}</Label>
                  <Input
                    type="number"
                    min={0.5}
                    max={100}
                    step={0.5}
                    value={settings.contractsPercentage}
                    onChange={(e) =>
                      saveSettings({ contractsPercentage: parseFloat(e.target.value) || 2 })
                    }
                  />
                </div>
              )}

              {settings.contractSizeMode === "RISK_BASED" && (
                <div>
                  <Label className="mb-2 block">$ {lang === "ar" ? "مبلغ المخاطرة" : "Risk Amount"}</Label>
                  <Input
                    type="number"
                    min={10}
                    value={settings.contractsRiskAmount}
                    onChange={(e) =>
                      saveSettings({ contractsRiskAmount: parseFloat(e.target.value) || 100 })
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-2 block">{lang === "ar" ? "أقل عقود" : "Min Contracts"}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.minContracts}
                    onChange={(e) =>
                      saveSettings({ minContracts: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2 block">{lang === "ar" ? "أكثر عقود" : "Max Contracts"}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.maxContracts}
                    onChange={(e) =>
                      saveSettings({ maxContracts: parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Analysis */}
        <div className="space-y-4">
          {/* Run Analysis Button */}
          <Button
            className="w-full h-14 text-lg font-semibold"
            onClick={runAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                {t.analyzing}
              </>
            ) : (
              <>
                <Brain className="h-5 w-5 mr-2" />
                {t.runAnalysis}
              </>
            )}
          </Button>

          {/* Signal Result */}
          {signal && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-slate-800 to-slate-900">
                <CardTitle className="flex items-center justify-between text-white">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t.currentSignal}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getDirectionColor(signal.direction)} text-white px-3 py-1`}>
                      {signal.direction}
                    </Badge>
                    <Badge className={`${getQualityColor(signal.quality)} text-white px-2 py-1`}>
                      {signal.quality}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Confidence */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{t.confidence}</span>
                    <span className="text-sm font-bold">{signal.confidence}%</span>
                  </div>
                  <Progress value={signal.confidence} className="h-2" />
                </div>

                {/* Indicators Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {signal.indicators.filter(i => i.enabled).map((ind) => (
                    <div
                      key={ind.name}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium">{lang === "ar" ? ind.nameAr : ind.name}</span>
                        <span className={`text-xs font-bold ${getSignalColor(ind.signal)}`}>
                          {ind.signal === "BUY" ? "↑" : ind.signal === "SELL" ? "↓" : "→"}
                        </span>
                      </div>
                      <Progress value={ind.strength} className="h-1" />
                    </div>
                  ))}
                </div>

                {/* Explosion Alert */}
                {signal.explosion?.detected && (
                  <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold text-orange-500">{t.explosionAlert}</span>
                    </div>
                    <p className="text-sm">
                      {lang === "ar" ? "اتجاه: " : "Direction: "}
                      {signal.explosion.direction} ({signal.explosion.confidence}%)
                    </p>
                  </div>
                )}

                {/* Trend Strength */}
                {signal.trend && (
                  <div className="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t.trendStrength}</span>
                      <Badge variant={signal.trend.isStrong ? "default" : "secondary"}>
                        ADX: {signal.trend.adx}
                      </Badge>
                    </div>
                    <Progress value={signal.trend.strength} className="h-1" />
                  </div>
                )}

                {/* Reasons */}
                {signal.reasons.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t.reasons}
                    </h4>
                    <ul className="text-sm space-y-1">
                      {signal.reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {signal.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      {t.warnings}
                    </h4>
                    <ul className="text-sm space-y-1">
                      {signal.warnings.map((warning, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-yellow-500">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          {!signal && (
            <Card className="bg-slate-50 dark:bg-slate-900">
              <CardContent className="pt-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {lang === "ar"
                    ? "اضغط على 'تشغيل التحليل' لبدء تحليل السوق"
                    : "Click 'Run Analysis' to start market analysis"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
