"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bot,
  Play,
  Square,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  RefreshCw,
  Zap,
  Shield,
  History,
  Save,
  Wifi,
  WifiOff,
  Bell,
  MessageSquare,
  Calculator,
  Send,
  Radio,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  BarChart3,
  LineChart,
  PieChart,
  Brain,
  Fish,
  Newspaper,
  Users,
  FileText,
  Lock,
  Globe,
  HelpCircle,
  Database,
  TestTube,
  Calendar,
  Briefcase,
  Languages,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Crown,
  Check,
  Star,
  LogOut,
  User,
  Mail,
  KeyRound,
  Smartphone,
  Clock,
  Sparkles,
  Gauge,
  Compass,
  Signal,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Server,
  Terminal,
  Download,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { PlansManager } from "@/components/plans-manager";
import { WatchlistSignals } from "@/components/watchlist-signals";

// Translations
const translations = {
  en: {
    // Header
    title: "Trading Bot Pro",
    demo: "Demo",
    trades: "trades",
    start: "Start",
    stop: "Stop",
    
    // Tabs
    dashboard: "Dashboard",
    tradesTab: "Trades",
    manual: "Manual",
    strike: "Strike",
    ai: "AI",
    analytics: "Analytics",
    charts: "Charts",
    whales: "Whales",
    connection: "Connection",
    webhook: "Webhook",
    notifications: "Notifications",
    risk: "Risk",
    journal: "Journal",
    calendar: "Calendar",
    security: "Security",
    backup: "Backup",
    help: "Help",
    
    // Dashboard
    totalTrades: "Total Trades",
    openTrades: "Open Trades",
    winRate: "Win Rate",
    totalPL: "Total P&L",
    botStatus: "Bot Status",
    running: "Running",
    stopped: "Stopped",
    stopBot: "Stop Bot",
    startBot: "Start Bot",
    interactiveBrokers: "Interactive Brokers",
    connected: "Connected",
    notConnected: "Not Connected",
    online: "Online",
    offline: "Offline",
    enabled: "Enabled",
    disabled: "Disabled",
    active: "Active",
    inactive: "Inactive",
    strikeMode: "Strike Mode",
    points: "pts",
    recentTrades: "Recent Trades",
    noTrades: "No trades yet",
    
    // Trades
    allTrades: "All Trades",
    
    // Manual Trade
    manualTrade: "Manual Trade",
    executeTrade: "Execute a trade manually",
    symbol: "Symbol",
    direction: "Direction",
    quantity: "Quantity",
    strikeOptional: "Strike (optional)",
    auto: "Auto",
    executeTradeBtn: "Execute Trade",
    startBotFirst: "Start Bot First",
    
    // Strike Settings
    strikeSelectionSettings: "Strike Selection Settings",
    configureStrikes: "Configure how strikes are selected",
    strikeSelectionMode: "Strike Selection Mode",
    strikeModeOffset: "OFFSET - Fixed strikes from ATM",
    strikeModePrice: "CONTRACT_PRICE - Price range based",
    strikeModeDelta: "DELTA - Delta target based",
    strikeModeManual: "MANUAL - Manual selection",
    chooseStrikes: "Choose how strikes are automatically selected for options trades",
    contractPriceRange: "Contract Price Range ($)",
    min: "Min",
    max: "Max",
    strikeOffset: "Strike Offset",
    pointsFromATM: "Points from ATM (OFFSET mode)",
    deltaTarget: "Delta Target",
    deltaValue: "Delta value (DELTA mode)",
    saveSettings: "Save Settings",
    
    // AI
    aiMarketAnalysis: "AI Market Analysis",
    aiPowered: "AI-powered market insights",
    runAnalysis: "Run Analysis",
    marketSentiment: "Market Sentiment",
    bullish: "Bullish",
    bearish: "Bearish",
    neutral: "Neutral",
    
    // Analytics
    performance: "Performance",
    performanceChart: "Performance Chart",
    winLossRatio: "Win/Loss Ratio",
    win: "Win",
    loss: "Loss",
    
    // Charts
    tradingCharts: "Trading Charts",
    priceCharts: "Price charts will appear here",
    
    // Whales
    whaleTracker: "Whale Tracker",
    trackMovements: "Track large market movements",
    largeCallBlock: "Large CALL Block",
    largePutBlock: "Large PUT Block",
    minAgo: "min ago",
    
    // Connection
    configureIB: "Configure IB TWS or Gateway",
    host: "Host",
    port: "Port",
    clientId: "Client ID",
    startBotConnect: "Start bot to connect",
    webhookURL: "Webhook URL",
    useInTradingView: "Use in TradingView alerts",
    
    // Webhook
    webhookTester: "Webhook Tester",
    testIntegration: "Test TradingView webhook integration",
    sendTestWebhook: "Send Test Webhook",
    
    // Notifications
    telegramNotifications: "Telegram Notifications",
    receiveNotifications: "Receive trade notifications",
    enableTelegram: "Enable Telegram",
    receiveOnTelegram: "Receive notifications",
    botToken: "Bot Token",
    chatId: "Chat ID",
    test: "Test",
    
    // Risk
    riskManagement: "Risk Management",
    riskParameters: "Configure risk parameters",
    maxRiskPerTrade: "Max Risk Per Trade ($)",
    defaultQuantity: "Default Quantity",
    maxOpenPositions: "Max Open Positions",
    maxDailyLoss: "Max Daily Loss ($)",
    important: "Important",
    protectAccountInfo: "These settings help protect your account.",
    
    // Journal
    tradingJournal: "Trading Journal",
    documentTrades: "Document your trades",
    journalEntries: "Journal entries will appear here",
    
    // Calendar
    economicCalendar: "Economic Calendar",
    upcomingEvents: "Upcoming market events",
    fomcMeeting: "FOMC Meeting",
    cpiData: "CPI Data",
    
    // Security
    securitySettings: "Security Settings",
    protectAccountTitle: "Protect your account",
    twoFactor: "Two-Factor Authentication",
    extraSecurity: "Add extra security",
    sessionTimeout: "Session Timeout",
    autoLogout: "Auto logout after inactivity",
    
    // Backup
    backupRestore: "Backup & Restore",
    manageData: "Manage your data",
    exportData: "Export Data",
    importData: "Import Data",
    lastBackup: "Last Backup",
    never: "Never",
    backupNow: "Backup Now",
    
    // Help
    userGuide: "User Guide",
    howToUse: "How to use the bot",
    step1Title: "1. Start the Bot",
    step1Desc: "Click the Start button to connect to Interactive Brokers and begin trading.",
    step2Title: "2. Configure Strike Settings",
    step2Desc: "Go to Strike tab to set how strikes are selected for options.",
    step3Title: "3. Set Up Notifications",
    step3Desc: "Enable Telegram in Notifications tab to receive trade alerts.",
    step4Title: "4. TradingView Webhook",
    step4Desc: "Use the webhook URL in TradingView alerts to trigger trades.",
    
    // Status
    open: "Open",
    closed: "Closed",
    pending: "Pending",
    
    // Messages
    botStarted: "Bot started!",
    botStopped: "Bot stopped!",
    settingsSaved: "Settings saved!",
    tradeExecuted: "Trade executed!",
    telegramTestOk: "Telegram test OK!",
    webhookTestOk: "Webhook test OK!",
    failed: "Failed",
    
    // Language
    language: "Language",
    arabic: "العربية",
    english: "English",
    
    // Plans
    plans: "Plans",
    choosePlan: "Choose Your Plan",
    currentPlan: "Current Plan",
    upgradePlan: "Upgrade Plan",
    monthly: "Monthly",
    yearly: "Yearly",
    perMonth: "/month",
    perYear: "/year",
    subscribe: "Subscribe",
    popular: "Popular",
    unlimited: "Unlimited",
    tradesPerDay: "trades/day",
    activeTrades: "active trades",
    daysFree: "days free",
    
    // Auth
    login: "Login",
    register: "Register",
    logout: "Logout",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    createAccount: "Create Account",
    rememberMe: "Remember me",
    
    // 2FA
    twoFactorAuth: "Two-Factor Authentication",
    enable2FA: "Enable 2FA",
    disable2FA: "Disable 2FA",
    enterCode: "Enter 6-digit code",
    scanQR: "Scan QR code with authenticator app",
    orEnterManually: "Or enter manually:",
    verify: "Verify",
  },
  ar: {
    // Header
    title: "بوت التداول برو",
    demo: "تجريبي",
    trades: "صفقات",
    start: "تشغيل",
    stop: "إيقاف",
    
    // Tabs
    dashboard: "لوحة التحكم",
    tradesTab: "الصفقات",
    manual: "يدوي",
    strike: "الاسترايك",
    ai: "الذكاء الاصطناعي",
    analytics: "التحليلات",
    charts: "الرسوم البيانية",
    whales: "الحيتان",
    connection: "الاتصال",
    webhook: "الويب هوك",
    notifications: "الإشعارات",
    risk: "المخاطر",
    journal: "اليومية",
    calendar: "التقويم",
    security: "الأمان",
    backup: "النسخ الاحتياطي",
    help: "المساعدة",
    
    // Dashboard
    totalTrades: "إجمالي الصفقات",
    openTrades: "الصفقات المفتوحة",
    winRate: "نسبة الفوز",
    totalPL: "إجمالي الربح/الخسارة",
    botStatus: "حالة البوت",
    running: "يعمل",
    stopped: "متوقف",
    stopBot: "إيقاف البوت",
    startBot: "تشغيل البوت",
    interactiveBrokers: "انتراكتيف بروكرز",
    connected: "متصل",
    notConnected: "غير متصل",
    online: "متصل",
    offline: "غير متصل",
    enabled: "مفعّل",
    disabled: "معطّل",
    active: "نشط",
    inactive: "غير نشط",
    strikeMode: "وضع الاسترايك",
    points: "نقاط",
    recentTrades: "الصفقات الأخيرة",
    noTrades: "لا توجد صفقات بعد",
    
    // Trades
    allTrades: "جميع الصفقات",
    
    // Manual Trade
    manualTrade: "صفقة يدوية",
    executeTrade: "تنفيذ صفقة يدوياً",
    symbol: "الرمز",
    direction: "الاتجاه",
    quantity: "الكمية",
    strikeOptional: "الاسترايك (اختياري)",
    auto: "تلقائي",
    executeTradeBtn: "تنفيذ الصفقة",
    startBotFirst: "شغّل البوت أولاً",
    
    // Strike Settings
    strikeSelectionSettings: "إعدادات اختيار الاسترايك",
    configureStrikes: "تكوين طريقة اختيار الاسترايك",
    strikeSelectionMode: "وضع اختيار الاسترايك",
    strikeModeOffset: "OFFSET - استرايكات ثابتة من ATM",
    strikeModePrice: "CONTRACT_PRICE - بناءً على نطاق السعر",
    strikeModeDelta: "DELTA - بناءً على الدلتا",
    strikeModeManual: "MANUAL - اختيار يدوي",
    chooseStrikes: "اختر كيفية اختيار الاسترايكات تلقائياً لصفقات الخيارات",
    contractPriceRange: "نطاق سعر العقد ($)",
    min: "أدنى",
    max: "أقصى",
    strikeOffset: "إزاحة الاسترايك",
    pointsFromATM: "النقاط من ATM (وضع OFFSET)",
    deltaTarget: "الهدف الدلتا",
    deltaValue: "قيمة الدلتا (وضع DELTA)",
    saveSettings: "حفظ الإعدادات",
    
    // AI
    aiMarketAnalysis: "تحليل السوق بالذكاء الاصطناعي",
    aiPowered: "رؤى السوق بالذكاء الاصطناعي",
    runAnalysis: "تشغيل التحليل",
    marketSentiment: "معنويات السوق",
    bullish: "صعودي",
    bearish: "هابط",
    neutral: "محايد",
    
    // Analytics
    performance: "الأداء",
    performanceChart: "رسم بياني للأداء",
    winLossRatio: "نسبة الفوز/الخسارة",
    win: "فوز",
    loss: "خسارة",
    
    // Charts
    tradingCharts: "رسوم التداول البيانية",
    priceCharts: "الرسوم البيانية للأسعار ستظهر هنا",
    
    // Whales
    whaleTracker: "متتبع الحيتان",
    trackMovements: "تتبع حركات السوق الكبيرة",
    largeCallBlock: "كتلة CALL كبيرة",
    largePutBlock: "كتلة PUT كبيرة",
    minAgo: "دقيقة مضت",
    
    // Connection
    configureIB: "تكوين IB TWS أو Gateway",
    host: "المضيف",
    port: "المنفذ",
    clientId: "معرف العميل",
    startBotConnect: "شغّل البوت للاتصال",
    webhookURL: "رابط الويب هوك",
    useInTradingView: "استخدم في تنبيهات TradingView",
    
    // Webhook
    webhookTester: "اختبار الويب هوك",
    testIntegration: "اختبار تكامل TradingView webhook",
    sendTestWebhook: "إرسال ويب هوك تجريبي",
    
    // Notifications
    telegramNotifications: "إشعارات تيليجرام",
    receiveNotifications: "استلام إشعارات الصفقات",
    enableTelegram: "تفعيل تيليجرام",
    receiveOnTelegram: "استلام الإشعارات",
    botToken: "توكن البوت",
    chatId: "معرف المحادثة",
    test: "اختبار",
    
    // Risk
    riskManagement: "إدارة المخاطر",
    riskParameters: "تكوين معايير المخاطر",
    maxRiskPerTrade: "أقصى مخاطرة للصفقة ($)",
    defaultQuantity: "الكمية الافتراضية",
    maxOpenPositions: "أقصى صفقات مفتوحة",
    maxDailyLoss: "أقصى خسارة يومية ($)",
    important: "مهم",
    protectAccountInfo: "هذه الإعدادات تساعد في حماية حسابك.",
    
    // Journal
    tradingJournal: "يومية التداول",
    documentTrades: "وثّق صفقاتك",
    journalEntries: "إدخالات اليومية ستظهر هنا",
    
    // Calendar
    economicCalendar: "التقويم الاقتصادي",
    upcomingEvents: "أحداث السوق القادمة",
    fomcMeeting: "اجتماع FOMC",
    cpiData: "بيانات مؤشر الأسعار",
    
    // Security
    securitySettings: "إعدادات الأمان",
    protectAccountTitle: "احمِ حسابك",
    twoFactor: "المصادقة الثنائية",
    extraSecurity: "أضف أماناً إضافياً",
    sessionTimeout: "مهلة الجلسة",
    autoLogout: "تسجيل خروج تلقائي بعد الخمول",
    
    // Backup
    backupRestore: "النسخ الاحتياطي والاستعادة",
    manageData: "إدارة بياناتك",
    exportData: "تصدير البيانات",
    importData: "استيراد البيانات",
    lastBackup: "آخر نسخة احتياطية",
    never: "أبداً",
    backupNow: "نسخ احتياطي الآن",
    
    // Help
    userGuide: "دليل المستخدم",
    howToUse: "كيفية استخدام البوت",
    step1Title: "1. تشغيل البوت",
    step1Desc: "اضغط على زر التشغيل للاتصال بـ Interactive Brokers والبدء في التداول.",
    step2Title: "2. تكوين إعدادات الاسترايك",
    step2Desc: "اذهب إلى تبويب الاسترايك لضبط كيفية اختيار الاسترايكات للخيارات.",
    step3Title: "3. إعداد الإشعارات",
    step3Desc: "فعّل تيليجرام في تبويب الإشعارات لاستلام تنبيهات الصفقات.",
    step4Title: "4. ويب هوك TradingView",
    step4Desc: "استخدم رابط الويب هوك في تنبيهات TradingView لتشغيل الصفقات.",
    
    // Status
    open: "مفتوح",
    closed: "مغلق",
    pending: "معلق",
    
    // Messages
    botStarted: "تم تشغيل البوت!",
    botStopped: "تم إيقاف البوت!",
    settingsSaved: "تم حفظ الإعدادات!",
    tradeExecuted: "تم تنفيذ الصفقة!",
    telegramTestOk: "نجح اختبار تيليجرام!",
    webhookTestOk: "نجح اختبار الويب هوك!",
    failed: "فشل",
    
    // Language
    language: "اللغة",
    arabic: "العربية",
    english: "English",
    
    // Plans
    plans: "الباقات",
    choosePlan: "اختر باقتك",
    currentPlan: "الباقة الحالية",
    upgradePlan: "ترقية الباقة",
    monthly: "شهري",
    yearly: "سنوي",
    perMonth: "/شهر",
    perYear: "/سنة",
    subscribe: "اشترك",
    popular: "الأكثر شعبية",
    unlimited: "غير محدود",
    tradesPerDay: "صفقة/يوم",
    activeTrades: "صفقة نشطة",
    daysFree: "أيام مجاناً",
    
    // Auth
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    logout: "تسجيل الخروج",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    resetPassword: "إعادة تعيين كلمة المرور",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    createAccount: "إنشاء حساب",
    rememberMe: "تذكرني",
    
    // 2FA
    twoFactorAuth: "المصادقة الثنائية",
    enable2FA: "تفعيل المصادقة الثنائية",
    disable2FA: "إلغاء تفعيل المصادقة الثنائية",
    enterCode: "أدخل الرمز المكون من 6 أرقام",
    scanQR: "امسح رمز QR بتطبيق المصادقة",
    orEnterManually: "أو أدخل يدوياً:",
    verify: "تحقق",
  }
};

type Language = "en" | "ar";

// Types
interface BotSettings {
  id: string;
  isRunning: boolean;
  accountType: string;
  strikeSelectionMode: string;
  contractPriceMin: number;
  contractPriceMax: number;
  spxStrikeOffset: number;
  spxDeltaTarget: number;
  ibHost: string;
  ibPort: number;
  ibClientId: number;
  ibConnected: boolean;
  telegramEnabled: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
}

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  strike: number | null;
  optionType: string | null;
  status: string;
  pnl: number | null;
  createdAt: string;
}

interface IBStatus {
  connected: boolean;
  accountType: string;
  message: string;
}

// Auth types
interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  subscription?: {
    planName: string;
    status: string;
    isTrial: boolean;
    maxTradesPerDay: number;
    maxActiveTrades: number;
  } | null;
}

export default function Dashboard() {
  // Language
  const [lang, setLang] = useState<Language>("ar");
  const t = translations[lang];
  const isRTL = lang === "ar";
  
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  
  // Bot state
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [tradesList, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [saving, setSaving] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const settingsLoadedRef = useRef(false); // Use ref to track if settings loaded once
  const [ibStatus, setIbStatus] = useState<IBStatus | null>(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, open: 0, winRate: 0, pnl: 0 });

  // Strike Settings
  const [strikeSelectionMode, setStrikeSelectionMode] = useState("OFFSET");
  const [contractPriceMin, setContractPriceMin] = useState("300");
  const [contractPriceMax, setContractPriceMax] = useState("400");
  const [spxStrikeOffset, setSpxStrikeOffset] = useState("5");
  const [spxDeltaTarget, setSpxDeltaTarget] = useState("0.3");

  // IB Connection Settings
  const [ibHost, setIbHost] = useState("127.0.0.1");
  const [ibPort, setIbPort] = useState("7497");
  const [ibClientId, setIbClientId] = useState("1");

  // VPS Settings
  const [vpsIP, setVpsIP] = useState("");

  // Platform Integration Settings
  const [platformConnections, setPlatformConnections] = useState<{binance: boolean; coinbase: boolean; exness: boolean}>({
    binance: false,
    coinbase: false,
    exness: false,
  });
  const [platformLoading, setPlatformLoading] = useState<string | null>(null);
  
  // Binance
  const [binanceApiKey, setBinanceApiKey] = useState("");
  const [binanceApiSecret, setBinanceApiSecret] = useState("");
  const [binanceTestnet, setBinanceTestnet] = useState(true);
  
  // Coinbase
  const [coinbaseApiKey, setCoinbaseApiKey] = useState("");
  const [coinbaseApiSecret, setCoinbaseApiSecret] = useState("");
  const [coinbasePassphrase, setCoinbasePassphrase] = useState("");
  const [coinbaseSandbox, setCoinbaseSandbox] = useState(true);
  
  // Exness
  const [exnessApiKey, setExnessApiKey] = useState("");
  const [exnessApiSecret, setExnessApiSecret] = useState("");
  const [exnessAccountId, setExnessAccountId] = useState("");
  const [exnessDemo, setExnessDemo] = useState(true);
  
  // Quick Trade
  const [quickTradePlatform, setQuickTradePlatform] = useState("binance");
  const [quickTradeSymbol, setQuickTradeSymbol] = useState("BTCUSDT");
  const [quickTradeSide, setQuickTradeSide] = useState<"BUY" | "SELL">("BUY");
  const [quickTradeQuantity, setQuickTradeQuantity] = useState("0.001");

  // Telegram Settings
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isEditingTelegram, setIsEditingTelegram] = useState(false);

  // Manual Trade
  const [manualSymbol, setManualSymbol] = useState("SPX");
  const [manualDirection, setManualDirection] = useState("CALL");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualStrike, setManualStrike] = useState("");
  const [manualInstrumentType, setManualInstrumentType] = useState("OPTION");
  
  // Protection Features for Manual Trade
  const [enableStopLoss, setEnableStopLoss] = useState(false);
  const [stopLossValue, setStopLossValue] = useState("");
  const [stopLossType, setStopLossType] = useState<"PRICE" | "PERCENT">("PERCENT");
  
  const [enableTakeProfit, setEnableTakeProfit] = useState(false);
  const [takeProfitValue, setTakeProfitValue] = useState("");
  const [takeProfitType, setTakeProfitType] = useState<"PRICE" | "PERCENT">("PERCENT");
  
  const [enableAutoClose, setEnableAutoClose] = useState(false);
  const [autoCloseMinutes, setAutoCloseMinutes] = useState("60");
  
  const [enableTrailingStop, setEnableTrailingStop] = useState(false);
  const [trailingStopValue, setTrailingStopValue] = useState("");
  const [trailingStopType, setTrailingStopType] = useState<"AMOUNT" | "PERCENT">("PERCENT");
  
  const [enableBracketOrder, setEnableBracketOrder] = useState(false);
  
  // Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  
  // Backup
  const [backups, setBackups] = useState<{filename: string; size: number; createdAt: string}[]>([]);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  // Trade Intelligence
  const [intelData, setIntelData] = useState<{
    trend: { direction: string; strength: number; confidence: number; reversalProbability: number };
    indicators: { rsi: number; macdSignal: string };
    entrySignal: { quality: string; score: number; reasons: string[]; warnings: string[] } | null;
    exitSignal: { shouldExit: boolean; reason: string; urgency: string } | null;
  } | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelSymbol, setIntelSymbol] = useState("SPX");
  const [intelDirection, setIntelDirection] = useState<"CALL" | "PUT">("CALL");
  const [intelPrice, setIntelPrice] = useState("5000");

  // Auto Monitor
  const [autoMonitorData, setAutoMonitorData] = useState<{
    decisions: Array<{
      tradeId: string;
      action: string;
      reason: string;
      confidence: number;
      urgency: string;
      currentPnL?: number;
    }>;
    entrySignals: Array<{
      symbol: string;
      signal: string;
      strength: number;
      reasons: string[];
    }>;
    alerts: { critical: number; high: number; total: number };
    summary: { hold: number; exitNow: number; exitSoon: number; takeProfit: number };
  } | null>(null);
  const [autoMonitorLoading, setAutoMonitorLoading] = useState(false);
  const [autoMonitorEnabled, setAutoMonitorEnabled] = useState(true);

  // Auto Trading
  const [autoTraderEnabled, setAutoTraderEnabled] = useState(false);
  const [autoTraderLoading, setAutoTraderLoading] = useState(false);
  const [autoTraderStatus, setAutoTraderStatus] = useState<{
    enabled: boolean;
    openPositions: number;
    maxPositions: number;
    tradingHours: { start: number; end: number };
    analyses: Array<{
      symbol: string;
      price: number;
      rsi: number;
      trend: string;
      signal: string;
      confidence: number;
      reasons: string[];
    }>;
    recentLogs: Array<{ time: string; type: string; message: string }>;
  } | null>(null);

  // === NEW: Advanced Trading Settings ===
  
  // Trading Mode
  const [tradingMode, setTradingMode] = useState<"CONSERVATIVE" | "BALANCED" | "AGGRESSIVE">("BALANCED");
  
  // Multiple Symbols
  const [activeSymbols, setActiveSymbols] = useState<string[]>(["SPX"]);
  const [primarySymbol, setPrimarySymbol] = useState("SPX");
  const [newSymbol, setNewSymbol] = useState("");
  
  // Contract Settings
  const [contractSizeMode, setContractSizeMode] = useState<"FIXED" | "PERCENTAGE" | "RISK_BASED" | "CONFIDENCE">("FIXED");
  const [fixedContracts, setFixedContracts] = useState("1");
  const [contractsPercentage, setContractsPercentage] = useState("2");
  const [contractsRiskAmount, setContractsRiskAmount] = useState("100");
  const [minContracts, setMinContracts] = useState("1");
  const [maxContracts, setMaxContracts] = useState("10");
  
  // Confidence Thresholds
  const [minConfidenceConservative, setMinConfidenceConservative] = useState("80");
  const [minConfidenceBalanced, setMinConfidenceBalanced] = useState("70");
  const [minConfidenceAggressive, setMinConfidenceAggressive] = useState("60");
  
  // Technical Indicators
  const [useRSI, setUseRSI] = useState(true);
  const [useMACD, setUseMACD] = useState(true);
  const [useBollinger, setUseBollinger] = useState(true);
  const [useEMA, setUseEMA] = useState(true);
  const [useADX, setUseADX] = useState(true);
  
  // Signal Detection
  const [detectExplosions, setDetectExplosions] = useState(true);
  const [detectReversals, setDetectReversals] = useState(true);
  const [detectInstitutional, setDetectInstitutional] = useState(true);
  const [detectSupplyDemand, setDetectSupplyDemand] = useState(true);
  const [explosionVolumeThreshold, setExplosionVolumeThreshold] = useState("2.0");
  const [explosionVolatilityThreshold, setExplosionVolatilityThreshold] = useState("1.5");
  
  // Auto Trading Hours
  const [autoTradingStartTime, setAutoTradingStartTime] = useState("09:30");
  const [autoTradingEndTime, setAutoTradingEndTime] = useState("16:00");
  const [processTradingViewSignals, setProcessTradingViewSignals] = useState(true);
  const [autoSelectStrike, setAutoSelectStrike] = useState(true);
  const [autoDetermineDirection, setAutoDetermineDirection] = useState(true);

  // Fetch all data with timeout
  const fetchWithTimeout = async (url: string, timeoutMs: number = 5000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      // Fetch trades with timeout
      const tradesRes = await fetchWithTimeout('/api/trades', 5000);
      const tradesData = await tradesRes.json();
      const allTrades = tradesData.trades || [];
      setTrades(allTrades);

      const closed = allTrades.filter((t: Trade) => t.status === "CLOSED");
      const openTradesList = allTrades.filter((t: Trade) => t.status === "OPEN" || t.status === "PENDING");
      const wins = closed.filter((t: Trade) => (t.pnl || 0) > 0);

      setStats({
        total: allTrades.length,
        open: openTradesList.length,
        winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
        pnl: closed.reduce((sum: number, t: Trade) => sum + (t.pnl || 0), 0),
      });

      // Fetch settings with timeout - only load once on initial load
      if (!settingsLoadedRef.current) {
        const settingsRes = await fetchWithTimeout('/api/settings?userId=demo', 5000);
        const settingsData = await settingsRes.json();
        
        if (settingsData?.settings) {
          const s = settingsData.settings;
          setSettings(s);
          setIsBotRunning(s.isRunning || false);
          setStrikeSelectionMode(s.strikeSelectionMode || "OFFSET");
          setContractPriceMin(String(s.contractPriceMin || 300));
          setContractPriceMax(String(s.contractPriceMax || 400));
          setSpxStrikeOffset(String(s.spxStrikeOffset || 5));
          setSpxDeltaTarget(String(s.spxDeltaTarget || 0.3));
          setIbHost(s.ibHost || "127.0.0.1");
          setIbPort(String(s.ibPort || 7497));
          setIbClientId(String(s.ibClientId || 1));
          setTelegramEnabled(s.telegramEnabled || false);
          setTelegramBotToken(s.telegramBotToken || "");
          setTelegramChatId(s.telegramChatId || "");
          
          // Load new advanced settings
          setTradingMode(s.tradingMode || "BALANCED");
          setActiveSymbols(s.activeSymbols ? s.activeSymbols.split(",") : ["SPX"]);
          setPrimarySymbol(s.primarySymbol || "SPX");
          setContractSizeMode(s.contractSizeMode || "FIXED");
          setFixedContracts(String(s.fixedContracts || 1));
          setContractsPercentage(String(s.contractsPercentage || 2));
          setContractsRiskAmount(String(s.contractsRiskAmount || 100));
          setMinContracts(String(s.minContracts || 1));
          setMaxContracts(String(s.maxContracts || 10));
          setMinConfidenceConservative(String(s.minConfidenceConservative || 80));
          setMinConfidenceBalanced(String(s.minConfidenceBalanced || 70));
          setMinConfidenceAggressive(String(s.minConfidenceAggressive || 60));
          setUseRSI(s.useRSI ?? true);
          setUseMACD(s.useMACD ?? true);
          setUseBollinger(s.useBollinger ?? true);
          setUseEMA(s.useEMA ?? true);
          setUseADX(s.useADX ?? true);
          setDetectExplosions(s.detectExplosions ?? true);
          setDetectReversals(s.detectReversals ?? true);
          setDetectInstitutional(s.detectInstitutional ?? true);
          setDetectSupplyDemand(s.detectSupplyDemand ?? true);
          setExplosionVolumeThreshold(String(s.explosionVolumeThreshold || 2.0));
          setExplosionVolatilityThreshold(String(s.explosionVolatilityThreshold || 1.5));
          setAutoTradingStartTime(s.autoTradingStartTime || "09:30");
          setAutoTradingEndTime(s.autoTradingEndTime || "16:00");
          setProcessTradingViewSignals(s.processTradingViewSignals ?? true);
          setAutoSelectStrike(s.autoSelectStrike ?? true);
          setAutoDetermineDirection(s.autoDetermineDirection ?? true);
          settingsLoadedRef.current = true;
        }
      }

      try {
        const ibRes = await fetch('/api/ib');
        if (ibRes.ok) {
          setIbStatus(await ibRes.json());
        }
      } catch { /* ignore */ }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchBackups();
    checkAuth();
    fetchAutoMonitor();
    fetchAutoTraderStatus();
    const interval = setInterval(fetchData, 10000);
    const monitorInterval = setInterval(fetchAutoMonitor, 30000); // Every 30 seconds
    const autoTraderInterval = setInterval(fetchAutoTraderStatus, 30000); // Every 30 seconds
    return () => {
      clearInterval(interval);
      clearInterval(monitorInterval);
      clearInterval(autoTraderInterval);
    };
  }, [fetchData]);

  // Load VPS IP from localStorage
  useEffect(() => {
    const savedVpsIP = localStorage.getItem("vpsIP");
    if (savedVpsIP) {
      setVpsIP(savedVpsIP);
    }
  }, []);

  // Check auth status
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch {
      // Not logged in
    }
  };

  // Auto Monitor - Fetch bot decisions
  const fetchAutoMonitor = async () => {
    if (!autoMonitorEnabled) return;
    setAutoMonitorLoading(true);
    try {
      const res = await fetch("/api/trading/auto-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "monitor", userId: "demo" }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoMonitorData({
          decisions: data.decisions || [],
          entrySignals: data.entrySignals || [],
          alerts: data.alerts || { critical: 0, high: 0, total: 0 },
          summary: data.summary || { hold: 0, exitNow: 0, exitSoon: 0, takeProfit: 0 }
        });
        
        // Show alerts for critical decisions
        data.decisions?.forEach((decision: { action: string; reason: string; urgency: string }) => {
          if (decision.urgency === 'CRITICAL') {
            toast.error(decision.reason);
          } else if (decision.urgency === 'HIGH' && decision.action !== 'HOLD') {
            toast.warning(decision.reason);
          }
        });
      }
    } catch {
      console.log("Auto monitor not available");
    } finally {
      setAutoMonitorLoading(false);
    }
  };

  // Execute bot decision
  const executeDecision = async (tradeId: string, action: string) => {
    try {
      if (action === 'EXIT_NOW' || action === 'TAKE_PROFIT') {
        const res = await fetch("/api/trading/auto-monitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "execute_exit",
            tradeId,
            exitPrice: 5000 // Would use actual current price
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(lang === "ar" ? "تم إغلاق الصفقة!" : "Trade closed!");
          fetchData();
          fetchAutoMonitor();
        }
      }
    } catch {
      toast.error(lang === "ar" ? "فشل التنفيذ" : "Execution failed");
    }
  };

  // Auto Trading - Fetch status
  const fetchAutoTraderStatus = async () => {
    try {
      const res = await fetch("/api/auto-trading");
      const data = await res.json();
      if (data.success) {
        setAutoTraderStatus(data.status);
        setAutoTraderEnabled(data.config?.enabled || false);
      }
    } catch {
      console.log("Auto trader not available");
    }
  };

  // Auto Trading - Enable
  const enableAutoTrader = async () => {
    setAutoTraderLoading(true);
    try {
      const res = await fetch("/api/auto-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enable",
          userId: "demo",
          maxOpenPositions: 3,
          minConfidence: 70,
          autoEntryEnabled: true,
          autoExitEnabled: true
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoTraderEnabled(true);
        toast.success(lang === "ar" ? "تم تفعيل التداول التلقائي!" : "Auto trading enabled!");
        fetchAutoTraderStatus();
      } else {
        toast.error(lang === "ar" ? "فشل التفعيل" : "Failed to enable");
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
    } finally {
      setAutoTraderLoading(false);
    }
  };

  // Auto Trading - Disable
  const disableAutoTrader = async () => {
    setAutoTraderLoading(true);
    try {
      const res = await fetch("/api/auto-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoTraderEnabled(false);
        toast.success(lang === "ar" ? "تم إيقاف التداول التلقائي" : "Auto trading disabled");
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
    } finally {
      setAutoTraderLoading(false);
    }
  };

  // Auto Trading - Run manual cycle
  const runAutoTraderCycle = async () => {
    setAutoTraderLoading(true);
    try {
      const res = await fetch("/api/auto-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم تنفيذ الدورة!" : "Cycle executed!");
        fetchAutoTraderStatus();
        fetchData();
      }
    } catch {
      toast.error(lang === "ar" ? "فشل التنفيذ" : "Execution failed");
    } finally {
      setAutoTraderLoading(false);
    }
  };

  // Login
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error(lang === "ar" ? "يرجى إدخال البريد وكلمة المرور" : "Please enter email and password");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setShowLoginDialog(false);
        setLoginEmail("");
        setLoginPassword("");
        toast.success(lang === "ar" ? "تم تسجيل الدخول بنجاح!" : "Login successful!");
        fetchData();
      } else {
        toast.error(data.error || (lang === "ar" ? "فشل تسجيل الدخول" : "Login failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
    } finally {
      setLoginLoading(false);
    }
  };

  // Register
  const handleRegister = async () => {
    if (!registerEmail || !registerPassword || !registerName) {
      toast.error(lang === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error(lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords don't match");
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: registerEmail, 
          password: registerPassword,
          name: registerName 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setShowLoginDialog(false);
        setShowRegister(false);
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterName("");
        setRegisterConfirmPassword("");
        toast.success(lang === "ar" ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!");
        fetchData();
      } else {
        toast.error(data.error || (lang === "ar" ? "فشل إنشاء الحساب" : "Registration failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success(lang === "ar" ? "تم تسجيل الخروج" : "Logged out");
    } catch {
      // Still clear user
      setUser(null);
    }
  };

  // Start bot
  const startBot = async () => {
    if (togglingBot) return;
    setTogglingBot(true);
    try {
      const res = await fetch("/api/bot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsBotRunning(true);
        if (data.settings) setSettings(data.settings);
        if (data.ibStatus) setIbStatus(data.ibStatus);
        toast.success(t.botStarted);
      } else {
        toast.error(data.error || t.failed);
      }
    } catch {
      toast.error(t.failed);
    } finally {
      setTogglingBot(false);
    }
  };

  // Stop bot
  const stopBot = async () => {
    if (togglingBot) return;
    setTogglingBot(true);
    try {
      const res = await fetch("/api/bot/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsBotRunning(false);
        if (data.settings) setSettings(data.settings);
        toast.success(t.botStopped);
      } else {
        toast.error(data.error || t.failed);
      }
    } catch {
      toast.error(t.failed);
    } finally {
      setTogglingBot(false);
    }
  };

  // Save settings
  const saveSettings = async (data: Record<string, unknown>) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo", ...data }),
      });
      const result = await res.json();
      if (result.success) {
        if (result.settings) setSettings(result.settings);
        toast.success(t.settingsSaved);
      } else {
        toast.error(t.failed);
      }
    } catch {
      toast.error(t.failed);
    } finally {
      setSaving(false);
    }
  };

  // Manual trade
  const executeManualTrade = async () => {
    try {
      const res = await fetch("/api/trades/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo",
          symbol: manualSymbol,
          direction: manualDirection,
          quantity: parseInt(manualQuantity) || 1,
          strike: manualStrike ? parseFloat(manualStrike) : null,
          instrumentType: manualInstrumentType,
          // Protection features
          stopLoss: enableStopLoss ? parseFloat(stopLossValue) : null,
          stopLossType: stopLossType,
          takeProfit: enableTakeProfit ? parseFloat(takeProfitValue) : null,
          takeProfitType: takeProfitType,
          maxHoldingMinutes: enableAutoClose ? parseInt(autoCloseMinutes) : null,
          trailingStopEnabled: enableTrailingStop,
          trailingStopAmount: trailingStopType === "AMOUNT" && enableTrailingStop ? parseFloat(trailingStopValue) : null,
          trailingStopPercent: trailingStopType === "PERCENT" && enableTrailingStop ? parseFloat(trailingStopValue) : null,
          isBracketOrder: enableBracketOrder,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t.tradeExecuted);
        fetchData();
        // Reset protection settings
        setEnableStopLoss(false);
        setEnableTakeProfit(false);
        setEnableAutoClose(false);
        setEnableTrailingStop(false);
        setEnableBracketOrder(false);
        setStopLossValue("");
        setTakeProfitValue("");
        setTrailingStopValue("");
      } else {
        toast.error(data.error || t.failed);
      }
    } catch {
      toast.error(t.failed);
    }
  };
  
  // Platform Integration Functions
  const connectPlatform = async (platform: 'binance' | 'coinbase' | 'exness') => {
    setPlatformLoading(platform);
    try {
      let config: any = {};
      
      if (platform === 'binance') {
        if (!binanceApiKey || !binanceApiSecret) {
          toast.error(lang === "ar" ? "يرجى إدخال API Key و API Secret" : "Please enter API Key and API Secret");
          setPlatformLoading(null);
          return;
        }
        config = {
          apiKey: binanceApiKey,
          apiSecret: binanceApiSecret,
          testnet: binanceTestnet,
        };
      } else if (platform === 'coinbase') {
        if (!coinbaseApiKey || !coinbaseApiSecret || !coinbasePassphrase) {
          toast.error(lang === "ar" ? "يرجى إدخال جميع البيانات" : "Please enter all credentials");
          setPlatformLoading(null);
          return;
        }
        config = {
          apiKey: coinbaseApiKey,
          apiSecret: coinbaseApiSecret,
          passphrase: coinbasePassphrase,
          sandbox: coinbaseSandbox,
        };
      } else if (platform === 'exness') {
        if (!exnessApiKey || !exnessApiSecret) {
          toast.error(lang === "ar" ? "يرجى إدخال API Key و API Secret" : "Please enter API Key and API Secret");
          setPlatformLoading(null);
          return;
        }
        config = {
          apiKey: exnessApiKey,
          apiSecret: exnessApiSecret,
          accountId: exnessAccountId,
          demo: exnessDemo,
        };
      }
      
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          action: "configure",
          config,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setPlatformConnections(prev => ({ ...prev, [platform]: true }));
        toast.success(lang === "ar" ? `تم ربط ${platform} بنجاح!` : `${platform} connected successfully!`);
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل الاتصال" : "Connection failed"));
      }
    } catch (error: any) {
      toast.error(error.message || (lang === "ar" ? "فشل الاتصال" : "Connection failed"));
    } finally {
      setPlatformLoading(null);
    }
  };
  
  const disconnectPlatform = async (platform: 'binance' | 'coinbase' | 'exness') => {
    try {
      await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          action: "disconnect",
        }),
      });
      
      setPlatformConnections(prev => ({ ...prev, [platform]: false }));
      toast.success(lang === "ar" ? `تم قطع اتصال ${platform}` : `${platform} disconnected`);
    } catch {
      toast.error(lang === "ar" ? "فشل قطع الاتصال" : "Failed to disconnect");
    }
  };
  
  const executeQuickTrade = async () => {
    const platformKey = quickTradePlatform as keyof typeof platformConnections;
    if (!platformConnections[platformKey] && quickTradePlatform !== 'ib') {
      toast.error(lang === "ar" ? "المنصة غير متصلة" : "Platform not connected");
      return;
    }
    
    try {
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: quickTradePlatform,
          action: "market_order",
          symbol: quickTradeSymbol,
          side: quickTradeSide,
          quantity: parseFloat(quickTradeQuantity),
          volume: parseFloat(quickTradeQuantity),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(lang === "ar" ? "تم تنفيذ الصفقة!" : "Trade executed!");
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل التنفيذ" : "Execution failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
    }
  };
  
  // Fetch backups
  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (data.backups) {
        setBackups(data.backups);
        setLastBackup(data.backups[0]?.createdAt || null);
      }
    } catch {
      console.log("Could not fetch backups");
    }
  };
  
  // Create backup
  const createBackup = async (type: string = "FULL") => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, userId: "demo" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم إنشاء النسخة الاحتياطية!" : "Backup created successfully!");
        fetchBackups();
      } else {
        toast.error(lang === "ar" ? "فشل إنشاء النسخة الاحتياطية" : "Failed to create backup");
      }
    } catch {
      toast.error(lang === "ar" ? "فشل إنشاء النسخة الاحتياطية" : "Failed to create backup");
    } finally {
      setBackupLoading(false);
    }
  };
  
  // Restore backup
  const restoreBackup = async (filename: string) => {
    if (!confirm(lang === "ar" ? "هل أنت متأكد؟ سيتم استبدال البيانات الحالية." : "Are you sure? Current data will be replaced.")) return;
    try {
      const res = await fetch("/api/backup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم استعادة النسخة الاحتياطية!" : "Backup restored successfully!");
        fetchData();
      } else {
        toast.error(lang === "ar" ? "فشل استعادة النسخة الاحتياطية" : "Failed to restore backup");
      }
    } catch {
      toast.error(lang === "ar" ? "فشل استعادة النسخة الاحتياطية" : "Failed to restore backup");
    }
  };
  
  // Download backup
  const downloadBackup = async (filename: string) => {
    window.open(`/api/backup?download=${filename}`, '_blank');
  };
  
  // Export data
  const exportData = async () => {
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-bot-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(lang === "ar" ? "تم تصدير البيانات!" : "Data exported!");
    } catch {
      toast.error(lang === "ar" ? "فشل تصدير البيانات" : "Failed to export data");
    }
  };

  // Test Telegram
  const testTelegram = async () => {
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "test_message", 
          userId: "demo",
          botToken: telegramBotToken,
          chatId: telegramChatId
        }),
      });
      const data = await res.json();
      if (data.success) toast.success(t.telegramTestOk);
      else toast.error(data.error || t.failed);
    } catch {
      toast.error(t.failed);
    }
  };

  // Test Webhook
  const testWebhook = async () => {
    try {
      const res = await fetch("/api/webhook/tradingview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CALL", symbol: "SPX", price: 5000 }),
      });
      const data = await res.json();
      if (data.success) toast.success(t.webhookTestOk);
      else toast.error(t.failed);
    } catch {
      toast.error(t.failed);
    }
  };

  // AI Analysis
  const runAIAnalysis = async () => {
    setAiAnalysis(lang === "ar" ? "جاري تحليل ظروف السوق..." : "Analyzing market conditions...");
    try {
      const res = await fetch("/api/ai/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: "SPX" }),
      });
      const data = await res.json();
      if (data.analysis) setAiAnalysis(data.analysis);
      else setAiAnalysis(lang === "ar" ? "غير قادر على تحليل ظروف السوق." : "Unable to analyze market conditions.");
    } catch {
      setAiAnalysis(lang === "ar" ? "التحليل غير متاح. يرجى المحاولة مرة أخرى." : "Analysis unavailable. Please try again.");
    }
  };

  // Trade Intelligence Analysis
  const runIntelAnalysis = async (type: 'entry' | 'exit' | 'full' = 'full') => {
    setIntelLoading(true);
    try {
      const res = await fetch("/api/trading/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: type === 'entry' ? 'entry_signal' : type === 'exit' ? 'exit_signal' : 'analyze',
          symbol: intelSymbol,
          currentPrice: parseFloat(intelPrice) || 5000,
          direction: intelDirection,
          trade: type === 'exit' ? { entryPrice: parseFloat(intelPrice) * 0.99, direction: intelDirection } : undefined
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIntelData({
          trend: data.trend,
          indicators: data.indicators,
          entrySignal: data.entrySignal || null,
          exitSignal: data.exitSignal || null
        });
        toast.success(lang === "ar" ? "تم التحليل!" : "Analysis complete!");
      } else {
        toast.error(lang === "ar" ? "فشل التحليل" : "Analysis failed");
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
    } finally {
      setIntelLoading(false);
    }
  };


  const getDirectionIcon = (dir: string) => 
    dir === "CALL" || dir === "BUY" 
      ? <TrendingUp className="h-4 w-4 text-green-500" /> 
      : <TrendingDown className="h-4 w-4 text-red-500" />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN": return <Badge className="bg-green-500">{t.open}</Badge>;
      case "CLOSED": return <Badge variant="secondary">{t.closed}</Badge>;
      case "PENDING": return <Badge variant="outline">{t.pending}</Badge>;
      default: return <Badge variant="destructive">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-muted/20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-7 w-7 text-primary" />
              {isBotRunning && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{t.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{t.demo}</Badge>
                <Badge variant="outline" className="text-xs">{stats.total} {t.trades}</Badge>
                {ibStatus?.connected && (
                  <Badge className="bg-green-500 text-xs"><Wifi className="h-3 w-3 mr-1" />IB</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            >
              <Languages className="h-4 w-4 mr-1" />
              {lang === "ar" ? "EN" : "عر"}
            </Button>
            
            {/* User Info / Login */}
            {user ? (
              <div className="flex items-center gap-2">
                {user.isAdmin && (
                  <Badge className="bg-yellow-500 text-xs"><Crown className="h-3 w-3 mr-1" />Admin</Badge>
                )}
                <span className="text-sm hidden sm:inline">{user.name || user.email}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" /> {t.logout}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowLoginDialog(true)}>
                <User className="h-4 w-4 mr-1" /> {t.login}
              </Button>
            )}
            
            {isBotRunning ? (
              <Button variant="destructive" size="sm" onClick={stopBot} disabled={togglingBot}>
                <Square className="h-4 w-4 mr-1" /> {t.stop}
              </Button>
            ) : (
              <Button size="sm" onClick={startBot} className="bg-green-600 hover:bg-green-700" disabled={togglingBot}>
                <Play className="h-4 w-4 mr-1" /> {t.start}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tabs in two rows */}
          <div className="relative mb-6">
            <TabsList className="flex-wrap h-auto gap-1 p-2 bg-muted/50 rounded-lg w-full grid grid-cols-6 sm:grid-cols-9">
              <TabsTrigger value="dashboard" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Activity className="h-4 w-4 text-blue-500" /><span className="hidden sm:inline text-xs">{t.dashboard}</span></TabsTrigger>
              <TabsTrigger value="trades" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><History className="h-4 w-4 text-purple-500" /><span className="hidden sm:inline text-xs">{t.tradesTab}</span></TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Send className="h-4 w-4 text-green-500" /><span className="hidden sm:inline text-xs">{t.manual}</span></TabsTrigger>
              <TabsTrigger value="strike" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Target className="h-4 w-4 text-orange-500" /><span className="hidden sm:inline text-xs">{t.strike}</span></TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Brain className="h-4 w-4 text-pink-500" /><span className="hidden sm:inline text-xs">{t.ai}</span></TabsTrigger>
              <TabsTrigger value="intelligence" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Gauge className="h-4 w-4 text-rose-500" /><span className="hidden sm:inline text-xs">{lang === "ar" ? "ذكاء" : "Intel"}</span></TabsTrigger>
              <TabsTrigger value="monitor" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                <Radio className="h-4 w-4 text-emerald-500" />
                <span className="hidden sm:inline text-xs">{lang === "ar" ? "مراقبة" : "Monitor"}</span>
                {autoMonitorData?.alerts?.total ? (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                    {autoMonitorData.alerts.total}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="autotrader" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span className="hidden sm:inline text-xs">{lang === "ar" ? "تلقائي" : "Auto"}</span>
                {autoTraderEnabled && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Eye className="h-4 w-4 text-sky-500" />
                <span className="hidden sm:inline text-xs">{lang === "ar" ? "مراقبة" : "Watch"}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><BarChart3 className="h-4 w-4 text-cyan-500" /><span className="hidden sm:inline text-xs">{t.analytics}</span></TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><LineChart className="h-4 w-4 text-indigo-500" /><span className="hidden sm:inline text-xs">{t.charts}</span></TabsTrigger>
              <TabsTrigger value="whales" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Fish className="h-4 w-4 text-teal-500" /><span className="hidden sm:inline text-xs">{t.whales}</span></TabsTrigger>
              <TabsTrigger value="connection" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{ibStatus?.connected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}<span className="hidden sm:inline text-xs">{t.connection}</span></TabsTrigger>
              <TabsTrigger value="webhook" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><TestTube className="h-4 w-4 text-amber-500" /><span className="hidden sm:inline text-xs">{t.webhook}</span></TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Bell className="h-4 w-4 text-red-400" /><span className="hidden sm:inline text-xs">{t.notifications}</span></TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Calculator className="h-4 w-4 text-yellow-500" /><span className="hidden sm:inline text-xs">{t.risk}</span></TabsTrigger>
              <TabsTrigger value="journal" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><FileText className="h-4 w-4 text-slate-500" /><span className="hidden sm:inline text-xs">{t.journal}</span></TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Calendar className="h-4 w-4 text-blue-400" /><span className="hidden sm:inline text-xs">{t.calendar}</span></TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Lock className="h-4 w-4 text-gray-600" /><span className="hidden sm:inline text-xs">{t.security}</span></TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Database className="h-4 w-4 text-emerald-500" /><span className="hidden sm:inline text-xs">{t.backup}</span></TabsTrigger>
              <TabsTrigger value="help" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><HelpCircle className="h-4 w-4 text-sky-500" /><span className="hidden sm:inline text-xs">{t.help}</span></TabsTrigger>
              <TabsTrigger value="plans" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Crown className="h-4 w-4 text-yellow-500" /><span className="hidden sm:inline text-xs">{t.plans}</span></TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Settings className="h-4 w-4 text-violet-500" /><span className="hidden sm:inline text-xs">{lang === "ar" ? "متقدم" : "Advanced"}</span></TabsTrigger>
              <TabsTrigger value="platforms" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Globe className="h-4 w-4 text-yellow-500" /><span className="hidden sm:inline text-xs">{lang === "ar" ? "منصات" : "Platforms"}</span></TabsTrigger>
              <TabsTrigger value="push" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Smartphone className="h-4 w-4 text-pink-500" /><span className="hidden sm:inline text-xs">{lang === "ar" ? "Push" : "Push"}</span></TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><LineChart className="h-4 w-4 text-teal-500" /><span className="hidden sm:inline text-xs">{lang === "ar" ? "تحليل" : "Analysis"}</span></TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Smartphone className="h-4 w-4 text-indigo-500" /><span className="hidden sm:inline text-xs">{lang === "ar" ? "موبايل" : "Mobile"}</span></TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.totalTrades}</p><p className="text-2xl font-bold">{stats.total}</p></div><Activity className="h-8 w-8 text-primary" /></CardContent></Card>
              <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.openTrades}</p><p className="text-2xl font-bold text-blue-500">{stats.open}</p></div><Zap className="h-8 w-8 text-blue-500" /></CardContent></Card>
              <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.winRate}</p><p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p></div><Target className="h-8 w-8 text-green-500" /></CardContent></Card>
              <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.totalPL}</p><p className={`text-2xl font-bold ${stats.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>${stats.pnl.toFixed(2)}</p></div><DollarSign className={`h-8 w-8 ${stats.pnl >= 0 ? "text-green-500" : "text-red-500"}`} /></CardContent></Card>
            </div>

            {/* Auto Trading Quick Toggle - PROMINENT */}
            <Card className={`border-2 ${autoTraderEnabled ? 'border-violet-500 bg-violet-500/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${autoTraderEnabled ? 'bg-violet-500' : 'bg-amber-500/20'}`}>
                      <Sparkles className={`h-6 w-6 ${autoTraderEnabled ? 'text-white' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {autoTraderEnabled 
                          ? (lang === "ar" ? "🟢 التداول التلقائي يعمل" : "🟢 Auto Trading Active")
                          : (lang === "ar" ? "التداول التلقائي متوقف" : "Auto Trading Stopped")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {autoTraderEnabled 
                          ? (lang === "ar" ? "البوت يراقب السوق ويتخذ القرارات تلقائياً" : "Bot monitors market and makes decisions automatically")
                          : (lang === "ar" ? "اضغط لتفعيل التداول الآلي الكامل" : "Click to enable full auto trading")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {autoTraderEnabled ? (
                      <>
                        <Button onClick={runAutoTraderCycle} disabled={autoTraderLoading} variant="outline" size="sm">
                          <RefreshCw className={`h-4 w-4 mr-1 ${autoTraderLoading ? 'animate-spin' : ''}`} />
                          {lang === "ar" ? "تنفيذ الآن" : "Run Now"}
                        </Button>
                        <Button onClick={disableAutoTrader} disabled={autoTraderLoading} variant="destructive" size="sm">
                          <Square className="h-4 w-4 mr-1" />
                          {lang === "ar" ? "إيقاف" : "Stop"}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={enableAutoTrader} disabled={autoTraderLoading} className="bg-violet-600 hover:bg-violet-700 h-12 px-6 text-lg">
                        <Play className="h-5 w-5 mr-2" />
                        {lang === "ar" ? "تفعيل التداول التلقائي" : "Start Auto Trading"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />{t.botStatus}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${isBotRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-lg font-medium">{isBotRunning ? t.running : t.stopped}</span>
                  </div>
                  {isBotRunning ? (
                    <Button variant="destructive" onClick={stopBot} disabled={togglingBot}><Square className="h-4 w-4 mr-2" />{t.stopBot}</Button>
                  ) : (
                    <Button onClick={startBot} className="bg-green-600 hover:bg-green-700" disabled={togglingBot}><Play className="h-4 w-4 mr-2" />{t.startBot}</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Strike Selection Info Card */}
            <Card className="border-2 border-orange-500/20 bg-orange-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-orange-600">
                  <Target className="h-4 w-4" />
                  {lang === "ar" ? "اختيار الاسترايك التلقائي" : "Auto Strike Selection"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{lang === "ar" ? "يختار CALL/PUT" : "Selects CALL/PUT"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{lang === "ar" ? "نطاق سعر $" : "Price range $"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{lang === "ar" ? "يحسب الدلتا" : "Calculates Delta"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{lang === "ar" ? "يتحقق من السيولة" : "Checks Liquidity"}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {lang === "ar" 
                    ? `الوضع الحالي: ${strikeSelectionMode} | نطاق السعر: $${contractPriceMin}-$${contractPriceMax}`
                    : `Current mode: ${strikeSelectionMode} | Price range: $${contractPriceMin}-$${contractPriceMax}`}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm">{ibStatus?.connected ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}{t.interactiveBrokers}</CardTitle></CardHeader>
                <CardContent><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{ibStatus?.connected ? `${t.connected} (${ibStatus.accountType})` : t.notConnected}</span><Badge variant={ibStatus?.connected ? "default" : "secondary"}>{ibStatus?.connected ? t.online : t.offline}</Badge></div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm">{telegramEnabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Info className="h-4 w-4 text-muted-foreground" />}Telegram</CardTitle></CardHeader>
                <CardContent><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{telegramEnabled ? t.enabled : t.disabled}</span><Badge variant={telegramEnabled ? "default" : "secondary"}>{telegramEnabled ? t.active : t.inactive}</Badge></div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" />{t.strikeMode}</CardTitle></CardHeader>
                <CardContent><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{strikeSelectionMode}</span><Badge variant="outline">{spxStrikeOffset} {t.points}</Badge></div></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />{t.recentTrades}</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {tradesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground"><Shield className="h-12 w-12 mb-2" /><p>{t.noTrades}</p></div>
                  ) : (
                    <div className="space-y-2">
                      {tradesList.slice(0, 10).map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center gap-2">{getDirectionIcon(trade.direction)}<span className="font-semibold">{trade.symbol}</span>{trade.strike && <Badge variant="outline">{trade.strike}</Badge>}{getStatusBadge(trade.status)}</div>
                          <div className="text-sm text-muted-foreground">{new Date(trade.createdAt).toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades */}
          <TabsContent value="trades" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />{t.allTrades}</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {tradesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground"><Shield className="h-12 w-12 mb-2" /><p>{t.noTrades}</p></div>
                  ) : (
                    <div className="space-y-2">
                      {tradesList.map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center gap-2">{getDirectionIcon(trade.direction)}<span className="font-semibold">{trade.symbol}</span>{trade.strike && <Badge variant="outline">{trade.strike}</Badge>}{trade.optionType && <Badge variant="outline">{trade.optionType}</Badge>}</div>
                          <div className="flex items-center gap-3">{getStatusBadge(trade.status)}{trade.pnl !== null && <span className={`font-medium ${trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>${trade.pnl.toFixed(2)}</span>}<span className="text-sm text-muted-foreground">{new Date(trade.createdAt).toLocaleDateString()}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Trade */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />{t.manualTrade}</CardTitle><CardDescription>{t.executeTrade}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {/* Instrument Type Selection */}
                <div className="space-y-2">
                  <Label>{lang === "ar" ? "نوع الأداة" : "Instrument Type"}</Label>
                  <Select value={manualInstrumentType} onValueChange={setManualInstrumentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPTION">{lang === "ar" ? "خيارات (Options)" : "Options"}</SelectItem>
                      <SelectItem value="STOCK">{lang === "ar" ? "أسهم (Stocks)" : "Stocks"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.symbol}</Label>
                    <Select value={manualSymbol} onValueChange={setManualSymbol}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {manualInstrumentType === "OPTION" ? (
                          <>
                            <SelectItem value="SPX">SPX (Index Options)</SelectItem>
                            <SelectItem value="SPY">SPY (ETF Options)</SelectItem>
                            <SelectItem value="QQQ">QQQ (ETF Options)</SelectItem>
                            <SelectItem value="VIX">VIX (Volatility)</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="AAPL">AAPL (Apple)</SelectItem>
                            <SelectItem value="TSLA">TSLA (Tesla)</SelectItem>
                            <SelectItem value="MSFT">MSFT (Microsoft)</SelectItem>
                            <SelectItem value="GOOGL">GOOGL (Google)</SelectItem>
                            <SelectItem value="AMZN">AMZN (Amazon)</SelectItem>
                            <SelectItem value="NVDA">NVDA (NVIDIA)</SelectItem>
                            <SelectItem value="META">META (Meta)</SelectItem>
                            <SelectItem value="SPY">SPY (S&P 500 ETF)</SelectItem>
                            <SelectItem value="QQQ">QQQ (Nasdaq ETF)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.direction}</Label>
                    <Select value={manualDirection} onValueChange={setManualDirection}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {manualInstrumentType === "OPTION" ? (
                          <>
                            <SelectItem value="CALL">CALL {lang === "ar" ? "(صعود)" : "(Bullish)"}</SelectItem>
                            <SelectItem value="PUT">PUT {lang === "ar" ? "(هبوط)" : "(Bearish)"}</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="BUY">BUY {lang === "ar" ? "(شراء)" : "(Long)"}</SelectItem>
                            <SelectItem value="SELL">SELL {lang === "ar" ? "(بيع)" : "(Short)"}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.quantity}</Label><Input type="number" value={manualQuantity} onChange={(e) => setManualQuantity(e.target.value)} /></div>
                  {manualInstrumentType === "OPTION" && (
                    <div className="space-y-2"><Label>{t.strikeOptional}</Label><Input type="number" placeholder={t.auto} value={manualStrike} onChange={(e) => setManualStrike(e.target.value)} /></div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Protection Features Card */}
            <Card className="border-2 border-amber-500/20">
              <CardHeader className="bg-amber-500/5">
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Shield className="h-5 w-5" />
                  {lang === "ar" ? "ميزات الحماية" : "Protection Features"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "احمِ صفقتك من الخسائر الكبيرة" : "Protect your trade from large losses"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                
                {/* Stop Loss */}
                <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <Label className="font-semibold">{lang === "ar" ? "وقف الخسارة (Stop Loss)" : "Stop Loss"}</Label>
                    </div>
                    <Switch checked={enableStopLoss} onCheckedChange={setEnableStopLoss} />
                  </div>
                  {enableStopLoss && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{lang === "ar" ? "النوع" : "Type"}</Label>
                        <Select value={stopLossType} onValueChange={(v) => setStopLossType(v as "PRICE" | "PERCENT")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENT">{lang === "ar" ? "نسبة %" : "Percent %"}</SelectItem>
                            <SelectItem value="PRICE">{lang === "ar" ? "سعر $" : "Price $"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{lang === "ar" ? "القيمة" : "Value"}</Label>
                        <Input 
                          type="number" 
                          placeholder={stopLossType === "PERCENT" ? "5" : "140"} 
                          value={stopLossValue} 
                          onChange={(e) => setStopLossValue(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {lang === "ar" 
                      ? "يغلق الصفقة تلقائياً عند الخسارة المحددة" 
                      : "Automatically closes trade at specified loss"}
                  </p>
                </div>
                
                {/* Take Profit */}
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <Label className="font-semibold">{lang === "ar" ? "جني الأرباح (Take Profit)" : "Take Profit"}</Label>
                    </div>
                    <Switch checked={enableTakeProfit} onCheckedChange={setEnableTakeProfit} />
                  </div>
                  {enableTakeProfit && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{lang === "ar" ? "النوع" : "Type"}</Label>
                        <Select value={takeProfitType} onValueChange={(v) => setTakeProfitType(v as "PRICE" | "PERCENT")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENT">{lang === "ar" ? "نسبة %" : "Percent %"}</SelectItem>
                            <SelectItem value="PRICE">{lang === "ar" ? "سعر $" : "Price $"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{lang === "ar" ? "القيمة" : "Value"}</Label>
                        <Input 
                          type="number" 
                          placeholder={takeProfitType === "PERCENT" ? "10" : "170"} 
                          value={takeProfitValue} 
                          onChange={(e) => setTakeProfitValue(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {lang === "ar" 
                      ? "يغلق الصفقة تلقائياً عند الربح المحدد" 
                      : "Automatically closes trade at specified profit"}
                  </p>
                </div>
                
                {/* Auto Close */}
                <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <Label className="font-semibold">{lang === "ar" ? "إغلاق تلقائي" : "Auto Close"}</Label>
                    </div>
                    <Switch checked={enableAutoClose} onCheckedChange={setEnableAutoClose} />
                  </div>
                  {enableAutoClose && (
                    <div className="space-y-1">
                      <Label className="text-xs">{lang === "ar" ? "بعد (دقائق)" : "After (minutes)"}</Label>
                      <Select value={autoCloseMinutes} onValueChange={setAutoCloseMinutes}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 {lang === "ar" ? "دقيقة" : "min"}</SelectItem>
                          <SelectItem value="30">30 {lang === "ar" ? "دقيقة" : "min"}</SelectItem>
                          <SelectItem value="60">1 {lang === "ar" ? "ساعة" : "hour"}</SelectItem>
                          <SelectItem value="120">2 {lang === "ar" ? "ساعة" : "hours"}</SelectItem>
                          <SelectItem value="240">4 {lang === "ar" ? "ساعات" : "hours"}</SelectItem>
                          <SelectItem value="390">6.5 {lang === "ar" ? "ساعات (يوم كامل)" : "hours (full day)"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {lang === "ar" 
                      ? "يغلق الصفقة بعد الوقت المحدد" 
                      : "Closes trade after specified time"}
                  </p>
                </div>
                
                {/* Trailing Stop */}
                <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-purple-500" />
                      <Label className="font-semibold">{lang === "ar" ? "وقف متحرك (Trailing Stop)" : "Trailing Stop"}</Label>
                    </div>
                    <Switch checked={enableTrailingStop} onCheckedChange={setEnableTrailingStop} />
                  </div>
                  {enableTrailingStop && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{lang === "ar" ? "النوع" : "Type"}</Label>
                        <Select value={trailingStopType} onValueChange={(v) => setTrailingStopType(v as "AMOUNT" | "PERCENT")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENT">{lang === "ar" ? "نسبة %" : "Percent %"}</SelectItem>
                            <SelectItem value="AMOUNT">{lang === "ar" ? "مبلغ $" : "Amount $"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{lang === "ar" ? "القيمة" : "Value"}</Label>
                        <Input 
                          type="number" 
                          placeholder={trailingStopType === "PERCENT" ? "3" : "5"} 
                          value={trailingStopValue} 
                          onChange={(e) => setTrailingStopValue(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {lang === "ar" 
                      ? "يتتبع السعر صعوداً ويحمي الأرباح" 
                      : "Follows price upward and protects profits"}
                  </p>
                </div>
                
                {/* Bracket Order */}
                <div className="p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-cyan-500" />
                      <Label className="font-semibold">{lang === "ar" ? "أمر محيط (Bracket Order)" : "Bracket Order"}</Label>
                    </div>
                    <Switch checked={enableBracketOrder} onCheckedChange={setEnableBracketOrder} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {lang === "ar" 
                      ? "يضع Stop Loss و Take Profit معاً كأمر واحد" 
                      : "Places both Stop Loss and Take Profit as one order"}
                  </p>
                </div>
                
              </CardContent>
            </Card>
            
            {/* Execute Button */}
            <Button onClick={executeManualTrade} className="w-full h-12 text-lg">
              <Send className="h-5 w-5 mr-2" />
              {t.executeTradeBtn}
            </Button>
          </TabsContent>

          {/* Strike Settings */}
          <TabsContent value="strike" className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-muted/50"><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />{t.strikeSelectionSettings}</CardTitle><CardDescription>{t.configureStrikes}</CardDescription></CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">{t.strikeSelectionMode}</Label>
                  <Select value={strikeSelectionMode} onValueChange={setStrikeSelectionMode}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OFFSET">{t.strikeModeOffset}</SelectItem>
                      <SelectItem value="CONTRACT_PRICE">{t.strikeModePrice}</SelectItem>
                      <SelectItem value="DELTA">{t.strikeModeDelta}</SelectItem>
                      <SelectItem value="MANUAL">{t.strikeModeManual}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t.chooseStrikes}</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-base font-semibold">{t.contractPriceRange}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-sm text-muted-foreground">{t.min}</Label><Input type="number" value={contractPriceMin} onChange={(e) => setContractPriceMin(e.target.value)} /></div>
                    <div className="space-y-2"><Label className="text-sm text-muted-foreground">{t.max}</Label><Input type="number" value={contractPriceMax} onChange={(e) => setContractPriceMax(e.target.value)} /></div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-base font-semibold">{t.strikeOffset}</Label><Input type="number" value={spxStrikeOffset} onChange={(e) => setSpxStrikeOffset(e.target.value)} /><p className="text-xs text-muted-foreground">{t.pointsFromATM}</p></div>
                  <div className="space-y-2"><Label className="text-base font-semibold">{t.deltaTarget}</Label><Input type="number" step="0.1" value={spxDeltaTarget} onChange={(e) => setSpxDeltaTarget(e.target.value)} /><p className="text-xs text-muted-foreground">{t.deltaValue}</p></div>
                </div>
                <Button onClick={() => saveSettings({ strikeSelectionMode, contractPriceMin: parseFloat(contractPriceMin) || 300, contractPriceMax: parseFloat(contractPriceMax) || 400, spxStrikeOffset: parseInt(spxStrikeOffset) || 5, spxDeltaTarget: parseFloat(spxDeltaTarget) || 0.3 })} className="w-full" disabled={saving}>{saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}{t.saveSettings}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analysis */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />{t.aiMarketAnalysis}</CardTitle><CardDescription>{t.aiPowered}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={runAIAnalysis} className="w-full"><Brain className="h-4 w-4 mr-2" />{t.runAnalysis}</Button>
                {aiAnalysis && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{aiAnalysis}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" />{t.marketSentiment}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><span>{t.bullish}</span><Progress value={65} className="w-48" /></div>
                  <div className="flex items-center justify-between"><span>{t.bearish}</span><Progress value={35} className="w-48" /></div>
                  <div className="flex items-center justify-between"><span>{t.neutral}</span><Progress value={50} className="w-48" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Intelligence */}
          <TabsContent value="intelligence" className="space-y-6">
            <Card className="border-2 border-rose-500/20">
              <CardHeader className="bg-rose-500/5">
                <CardTitle className="flex items-center gap-2 text-rose-600">
                  <Gauge className="h-5 w-5" />
                  {lang === "ar" ? "ذكاء التداول" : "Trade Intelligence"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "تحليل ذكي للدخول والخروج من الصفقات" : "Smart analysis for trade entry and exit"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Symbol Selection */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "الرمز" : "Symbol"}</Label>
                    <Select value={intelSymbol} onValueChange={setIntelSymbol}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SPX">SPX</SelectItem>
                        <SelectItem value="SPY">SPY</SelectItem>
                        <SelectItem value="QQQ">QQQ</SelectItem>
                        <SelectItem value="AAPL">AAPL</SelectItem>
                        <SelectItem value="TSLA">TSLA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "الاتجاه" : "Direction"}</Label>
                    <Select value={intelDirection} onValueChange={(v) => setIntelDirection(v as "CALL" | "PUT")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CALL">CALL {lang === "ar" ? "(صعود)" : ""}</SelectItem>
                        <SelectItem value="PUT">PUT {lang === "ar" ? "(هبوط)" : ""}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "السعر الحالي" : "Current Price"}</Label>
                    <Input type="number" value={intelPrice} onChange={(e) => setIntelPrice(e.target.value)} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => runIntelAnalysis('full')} disabled={intelLoading} className="bg-rose-600 hover:bg-rose-700">
                    {intelLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Compass className="h-4 w-4 mr-2" />}
                    {lang === "ar" ? "تحليل شامل" : "Full Analysis"}
                  </Button>
                  <Button onClick={() => runIntelAnalysis('entry')} disabled={intelLoading} variant="outline" className="border-green-500 text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    {lang === "ar" ? "إشارة دخول" : "Entry Signal"}
                  </Button>
                  <Button onClick={() => runIntelAnalysis('exit')} disabled={intelLoading} variant="outline" className="border-red-500 text-red-600">
                    <ArrowDownRight className="h-4 w-4 mr-2" />
                    {lang === "ar" ? "إشارة خروج" : "Exit Signal"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            {intelData?.trend && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Signal className="h-5 w-5" />
                    {lang === "ar" ? "تحليل الاتجاه" : "Trend Analysis"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Direction */}
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground mb-1">{lang === "ar" ? "الاتجاه" : "Direction"}</p>
                      <p className={`text-lg font-bold ${
                        intelData.trend.direction.includes('BULLISH') ? 'text-green-500' :
                        intelData.trend.direction.includes('BEARISH') ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {intelData.trend.direction === 'STRONG_BULLISH' ? (lang === "ar" ? "صعودي قوي 🚀" : "Strong Bullish 🚀") :
                         intelData.trend.direction === 'BULLISH' ? (lang === "ar" ? "صعودي 📈" : "Bullish 📈") :
                         intelData.trend.direction === 'WEAK_BULLISH' ? (lang === "ar" ? "صعودي ضعيف" : "Weak Bullish") :
                         intelData.trend.direction === 'STRONG_BEARISH' ? (lang === "ar" ? "هبوطي قوي 📉" : "Strong Bearish 📉") :
                         intelData.trend.direction === 'BEARISH' ? (lang === "ar" ? "هبوطي" : "Bearish") :
                         intelData.trend.direction === 'WEAK_BEARISH' ? (lang === "ar" ? "هبوطي ضعيف" : "Weak Bearish") :
                         (lang === "ar" ? "محايد" : "Neutral")}
                      </p>
                    </div>
                    {/* Strength */}
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground mb-1">{lang === "ar" ? "القوة" : "Strength"}</p>
                      <p className="text-2xl font-bold">{intelData.trend.strength}%</p>
                      <Progress value={intelData.trend.strength} className="h-2 mt-2" />
                    </div>
                    {/* Confidence */}
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground mb-1">{lang === "ar" ? "الثقة" : "Confidence"}</p>
                      <p className="text-2xl font-bold">{intelData.trend.confidence}%</p>
                      <Progress value={intelData.trend.confidence} className="h-2 mt-2" />
                    </div>
                    {/* Reversal Probability */}
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground mb-1">{lang === "ar" ? "احتمالية الانعكاس" : "Reversal"}</p>
                      <p className={`text-2xl font-bold ${intelData.trend.reversalProbability > 60 ? 'text-red-500' : ''}`}>
                        {intelData.trend.reversalProbability}%
                      </p>
                      <Progress value={intelData.trend.reversalProbability} className="h-2 mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Entry Signal */}
            {intelData?.entrySignal && (
              <Card className={`border-2 ${
                intelData.entrySignal.quality === 'EXCELLENT' ? 'border-green-500' :
                intelData.entrySignal.quality === 'GOOD' ? 'border-blue-500' :
                intelData.entrySignal.quality === 'MODERATE' ? 'border-yellow-500' :
                intelData.entrySignal.quality === 'POOR' ? 'border-orange-500' : 'border-red-500'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                      {lang === "ar" ? "إشارة الدخول" : "Entry Signal"}
                    </span>
                    <Badge className={`${
                      intelData.entrySignal.quality === 'EXCELLENT' ? 'bg-green-500' :
                      intelData.entrySignal.quality === 'GOOD' ? 'bg-blue-500' :
                      intelData.entrySignal.quality === 'MODERATE' ? 'bg-yellow-500' :
                      intelData.entrySignal.quality === 'POOR' ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {intelData.entrySignal.quality} - {intelData.entrySignal.score}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Reasons */}
                  {intelData.entrySignal.reasons.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-green-600">{lang === "ar" ? "أسباب الدخول:" : "Entry Reasons:"}</Label>
                      <div className="space-y-1">
                        {intelData.entrySignal.reasons.map((reason, i) => (
                          <p key={i} className="text-sm text-green-600">• {reason}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Warnings */}
                  {intelData.entrySignal.warnings.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-yellow-600">{lang === "ar" ? "تحذيرات:" : "Warnings:"}</Label>
                      <div className="space-y-1">
                        {intelData.entrySignal.warnings.map((warning, i) => (
                          <p key={i} className="text-sm text-yellow-600">• {warning}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Levels */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{lang === "ar" ? "سعر الدخول" : "Entry"}</p>
                      <p className="font-bold">${intelData.entrySignal.suggestedEntry}</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{lang === "ar" ? "وقف الخسارة" : "Stop Loss"}</p>
                      <p className="font-bold text-red-500">${intelData.entrySignal.stopLoss}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">TP1</p>
                      <p className="font-bold text-green-500">${intelData.entrySignal.takeProfit1}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">TP2</p>
                      <p className="font-bold text-green-500">${intelData.entrySignal.takeProfit2}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exit Signal */}
            {intelData?.exitSignal && (
              <Card className={`border-2 ${intelData.exitSignal.shouldExit ? 'border-red-500' : 'border-green-500'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ArrowDownRight className={`h-5 w-5 ${intelData.exitSignal.shouldExit ? 'text-red-500' : 'text-green-500'}`} />
                      {lang === "ar" ? "إشارة الخروج" : "Exit Signal"}
                    </span>
                    <Badge className={intelData.exitSignal.urgency === 'IMMEDIATE' ? 'bg-red-500' :
                                     intelData.exitSignal.urgency === 'SOON' ? 'bg-orange-500' :
                                     intelData.exitSignal.urgency === 'MONITOR' ? 'bg-yellow-500' : 'bg-green-500'}>
                      {intelData.exitSignal.urgency}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className={`font-medium ${intelData.exitSignal.shouldExit ? 'text-red-500' : 'text-green-500'}`}>
                      {intelData.exitSignal.reason}
                    </p>
                    {intelData.exitSignal.shouldExit && (
                      <Button variant="destructive" className="w-full mt-4">
                        {lang === "ar" ? "إغلاق الصفقة الآن" : "Close Trade Now"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Indicators */}
            {intelData?.indicators && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {lang === "ar" ? "المؤشرات الفنية" : "Technical Indicators"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                      <span>RSI</span>
                      <span className={`font-bold ${
                        intelData.indicators.rsi > 70 ? 'text-red-500' :
                        intelData.indicators.rsi < 30 ? 'text-green-500' : ''
                      }`}>{intelData.indicators.rsi}</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                      <span>MACD</span>
                      <Badge className={intelData.indicators.macdSignal === 'BULLISH' ? 'bg-green-500' :
                                       intelData.indicators.macdSignal === 'BEARISH' ? 'bg-red-500' : ''}>
                        {intelData.indicators.macdSignal}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Auto Monitor - الذكاء التلقائي */}
          <TabsContent value="monitor" className="space-y-6">
            {/* Status Header */}
            <Card className="border-2 border-emerald-500/20">
              <CardHeader className="bg-emerald-500/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-emerald-600">
                    <Radio className="h-5 w-5 animate-pulse" />
                    {lang === "ar" ? "المراقبة الذكية التلقائية" : "Smart Auto Monitor"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={autoMonitorEnabled} 
                      onCheckedChange={setAutoMonitorEnabled}
                    />
                    <Badge className={autoMonitorEnabled ? "bg-green-500" : "bg-gray-500"}>
                      {autoMonitorEnabled ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "متوقف" : "Paused")}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {lang === "ar" 
                    ? "البوت يراقب صفقاتك ويتخذ قرارات تلقائية بناءً على تحليل السوق"
                    : "Bot monitors your trades and makes automatic decisions based on market analysis"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button onClick={fetchAutoMonitor} disabled={autoMonitorLoading} variant="outline" size="sm">
                      {autoMonitorLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      {lang === "ar" ? "تحديث الآن" : "Refresh Now"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {lang === "ar" ? "آخر تحديث:" : "Last update:"} {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  {autoMonitorData?.alerts?.total ? (
                    <Badge className="bg-red-500 animate-pulse">
                      {autoMonitorData.alerts.critical} {lang === "ar" ? "حرج" : "Critical"} | {autoMonitorData.alerts.high} {lang === "ar" ? "عاجل" : "High"}
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500">
                      {lang === "ar" ? "لا توجد تنبيهات" : "No alerts"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            {autoMonitorData && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-500">{autoMonitorData.summary.hold}</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "ابقِ" : "Hold"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-500/20">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-red-500">{autoMonitorData.summary.exitNow}</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "اخرج الآن" : "Exit Now"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-500/5 border-orange-500/20">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-orange-500">{autoMonitorData.summary.exitSoon}</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "اخرج قريباً" : "Exit Soon"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-emerald-500">{autoMonitorData.summary.takeProfit}</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "جني أرباح" : "Take Profit"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-blue-500">{autoMonitorData.decisions?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "مراقب" : "Monitored"}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Active Decisions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {lang === "ar" ? "قرارات البوت الحالية" : "Current Bot Decisions"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!autoMonitorData?.decisions?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Radio className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{lang === "ar" ? "لا توجد صفقات مفتوحة للمراقبة" : "No open trades to monitor"}</p>
                    <p className="text-sm mt-1">{lang === "ar" ? "افتح صفقة لبدء المراقبة التلقائية" : "Open a trade to start auto monitoring"}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {autoMonitorData.decisions.map((decision, index) => (
                        <div 
                          key={decision.tradeId || index}
                          className={`p-4 rounded-lg border ${
                            decision.urgency === 'CRITICAL' ? 'border-red-500 bg-red-500/10' :
                            decision.urgency === 'HIGH' ? 'border-orange-500 bg-orange-500/10' :
                            decision.urgency === 'MEDIUM' ? 'border-yellow-500 bg-yellow-500/10' :
                            'border-green-500 bg-green-500/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={
                                decision.action === 'EXIT_NOW' ? 'bg-red-500' :
                                decision.action === 'EXIT_SOON' ? 'bg-orange-500' :
                                decision.action === 'TAKE_PROFIT' ? 'bg-green-500' :
                                decision.action === 'ADJUST_STOP' ? 'bg-blue-500' :
                                'bg-gray-500'
                              }>
                                {decision.action === 'EXIT_NOW' ? (lang === "ar" ? "اخرج الآن!" : "EXIT NOW!") :
                                 decision.action === 'EXIT_SOON' ? (lang === "ar" ? "اخرج قريباً" : "EXIT SOON") :
                                 decision.action === 'TAKE_PROFIT' ? (lang === "ar" ? "جني أرباح" : "TAKE PROFIT") :
                                 decision.action === 'ADJUST_STOP' ? (lang === "ar" ? "عدّل الوقف" : "ADJUST STOP") :
                                 (lang === "ar" ? "ابقِ" : "HOLD")}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {lang === "ar" ? "الثقة:" : "Confidence:"} {decision.confidence}%
                              </span>
                            </div>
                            {decision.currentPnL !== undefined && (
                              <span className={`font-bold ${decision.currentPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {decision.currentPnL >= 0 ? '+' : ''}{decision.currentPnL?.toFixed(2)}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium">{decision.reason}</p>
                          {(decision.action === 'EXIT_NOW' || decision.action === 'TAKE_PROFIT') && (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="mt-3"
                              onClick={() => executeDecision(decision.tradeId, decision.action)}
                            >
                              {lang === "ar" ? "تنفيذ الأمر" : "Execute Order"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Entry Signals - فرص دخول */}
            {autoMonitorData?.entrySignals && autoMonitorData.entrySignals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    {lang === "ar" ? "فرص دخول مقترحة" : "Suggested Entry Opportunities"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "إشارات دخول يكتشفها البوت تلقائياً" : "Entry signals automatically detected by the bot"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {autoMonitorData.entrySignals.map((signal, index) => (
                      <Card key={index} className={`${
                        signal.signal === 'BUY' ? 'border-green-500/50' : 
                        signal.signal === 'SELL' ? 'border-red-500/50' : 'border-gray-500/50'
                      }`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-lg">{signal.symbol}</span>
                            <Badge className={
                              signal.signal === 'BUY' ? 'bg-green-500' :
                              signal.signal === 'SELL' ? 'bg-red-500' : 'bg-gray-500'
                            }>
                              {signal.signal === 'BUY' ? (lang === "ar" ? "شراء" : "BUY") :
                               signal.signal === 'SELL' ? (lang === "ar" ? "بيع" : "SELL") :
                               (lang === "ar" ? "انتظر" : "HOLD")}
                            </Badge>
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{lang === "ar" ? "القوة:" : "Strength:"}</span>
                              <span className="font-medium">{signal.strength.toFixed(0)}%</span>
                            </div>
                            <Progress value={signal.strength} className="h-2 mt-1" />
                          </div>
                          {signal.reasons.length > 0 && (
                            <div className="text-xs text-muted-foreground space-y-1 mt-3">
                              {signal.reasons.map((reason, i) => (
                                <p key={i}>• {reason}</p>
                              ))}
                            </div>
                          )}
                          {signal.signal !== 'HOLD' && (
                            <Button 
                              size="sm" 
                              className={`w-full mt-3 ${signal.signal === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                              onClick={() => {
                                toast.success(lang === "ar" ? `سيتم فتح صفقة ${signal.signal === 'BUY' ? 'شراء' : 'بيع'} على ${signal.symbol}` : `Opening ${signal.signal} trade on ${signal.symbol}`);
                              }}
                            >
                              {lang === "ar" ? `فتح صفقة ${signal.signal === 'BUY' ? 'شراء' : 'بيع'}` : `Open ${signal.signal} Trade`}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Auto Trading */}
          <TabsContent value="autotrader" className="space-y-6">
            {/* Status Card */}
            <Card className={`border-2 ${autoTraderEnabled ? 'border-violet-500/50' : 'border-gray-500/20'}`}>
              <CardHeader className={autoTraderEnabled ? 'bg-violet-500/5' : ''}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-violet-600">
                    <Sparkles className="h-5 w-5" />
                    {lang === "ar" ? "التداول التلقائي الكامل" : "Full Auto Trading"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={autoTraderEnabled ? "bg-green-500 animate-pulse" : "bg-gray-500"}>
                      {autoTraderEnabled ? (lang === "ar" ? "يعمل تلقائياً" : "Auto Running") : (lang === "ar" ? "متوقف" : "Stopped")}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {lang === "ar" 
                    ? "يعمل البوت تلقائياً 24/7 بدون تدخل منك - يراقب السوق ويفتح ويغلق الصفقات"
                    : "Bot runs automatically 24/7 without your intervention - monitors market and opens/closes trades"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {autoTraderEnabled ? (
                      <Button onClick={disableAutoTrader} disabled={autoTraderLoading} variant="destructive" size="sm">
                        <Square className="h-4 w-4 mr-2" />
                        {lang === "ar" ? "إيقاف التداول التلقائي" : "Stop Auto Trading"}
                      </Button>
                    ) : (
                      <Button onClick={enableAutoTrader} disabled={autoTraderLoading} className="bg-violet-600 hover:bg-violet-700" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        {lang === "ar" ? "تشغيل التداول التلقائي" : "Start Auto Trading"}
                      </Button>
                    )}
                    <Button onClick={runAutoTraderCycle} disabled={autoTraderLoading || !autoTraderEnabled} variant="outline" size="sm">
                      {autoTraderLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      {lang === "ar" ? "تنفيذ دورة الآن" : "Run Cycle Now"}
                    </Button>
                  </div>
                  <Button onClick={fetchAutoTraderStatus} variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-600 mb-1">
                        {lang === "ar" ? "كيف يعمل التداول التلقائي؟" : "How does auto trading work?"}
                      </p>
                      <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                        <li>{lang === "ar" ? "يحلل السوق كل 30 ثانية باستخدام المؤشرات الفنية" : "Analyzes market every 30 seconds using technical indicators"}</li>
                        <li>{lang === "ar" ? "يكتشف الاتجاهات القوية ويحدد نقاط الدخول والخروج" : "Detects strong trends and determines entry/exit points"}</li>
                        <li>{lang === "ar" ? "يفتح صفقات تلقائياً عند توفر إشارات قوية" : "Opens trades automatically when strong signals appear"}</li>
                        <li>{lang === "ar" ? "يغلق الصفقات عند تحقيق الهدف أو وقف الخسارة" : "Closes trades at take profit or stop loss"}</li>
                        <li>{lang === "ar" ? "يعمل على السيرفر أو VPS بدون الحاجة لفتح المتصفح" : "Runs on server or VPS without needing to open browser"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Stats */}
            {autoTraderStatus && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-blue-500">{autoTraderStatus.openPositions}</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "صفقات مفتوحة" : "Open Positions"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/5 border-purple-500/20">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-purple-500">{autoTraderStatus.maxPositions}</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "أقصى صفقات" : "Max Positions"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-emerald-500">{autoTraderStatus.tradingHours?.start}:00 - {autoTraderStatus.tradingHours?.end}:00</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "ساعات التداول" : "Trading Hours"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-violet-500/5 border-violet-500/20">
                  <CardContent className="pt-4 text-center">
                    <div className={`h-3 w-3 rounded-full mx-auto mb-2 ${autoTraderEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "حالة النظام" : "System Status"}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Market Analysis */}
            {autoTraderStatus?.analyses && autoTraderStatus.analyses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {lang === "ar" ? "تحليل السوق الحالي" : "Current Market Analysis"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {autoTraderStatus.analyses.map((analysis, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{analysis.symbol}</span>
                          <Badge variant="outline">${analysis.price.toFixed(2)}</Badge>
                          <Badge className={
                            analysis.signal === 'STRONG_BUY' ? 'bg-green-500' :
                            analysis.signal === 'BUY' ? 'bg-green-400' :
                            analysis.signal === 'STRONG_SELL' ? 'bg-red-500' :
                            analysis.signal === 'SELL' ? 'bg-red-400' : 'bg-gray-500'
                          }>
                            {analysis.signal}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">RSI: {analysis.rsi}</span>
                          <span className="text-sm text-muted-foreground">
                            {lang === "ar" ? "ثقة" : "Confidence"}: {analysis.confidence}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Logs */}
            {autoTraderStatus?.recentLogs && autoTraderStatus.recentLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    {lang === "ar" ? "سجل العمليات" : "Operation Log"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {autoTraderStatus.recentLogs.map((log, idx) => (
                        <div key={idx} className={`p-2 rounded text-sm ${
                          log.type === 'TRADE' ? 'bg-green-500/10 border border-green-500/20' :
                          log.type === 'ERROR' ? 'bg-red-500/10 border border-red-500/20' :
                          'bg-muted/30'
                        }`}>
                          <span className="text-muted-foreground text-xs">
                            {new Date(log.time).toLocaleTimeString()}
                          </span>
                          <span className="mx-2">|</span>
                          {log.message}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Vultr VPS Settings */}
            <Card className="border-2 border-blue-500/20">
              <CardHeader className="bg-blue-500/5">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Server className="h-5 w-5" />
                  {lang === "ar" ? "إعدادات Vultr VPS" : "Vultr VPS Settings"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "إعدادات السيرفر من Vultr" : "Your Vultr server configuration"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Vultr Provider */}
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Vultr Cloud Compute</p>
                    <p className="text-xs text-muted-foreground">{lang === "ar" ? "ابدأ من $6/شهر" : "Starting at $6/month"}</p>
                  </div>
                </div>

                {/* VPS IP Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{lang === "ar" ? "عنوان IP الـ VPS" : "VPS IP Address"}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="مثال: 192.168.1.100"
                      value={vpsIP}
                      onChange={(e) => setVpsIP(e.target.value)}
                      className="font-mono"
                    />
                    <Button variant="outline" size="sm" onClick={() => {
                      if (vpsIP) {
                        localStorage.setItem("vpsIP", vpsIP);
                        toast.success(lang === "ar" ? "تم حفظ عنوان VPS" : "VPS IP saved");
                      }
                    }}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lang === "ar" 
                      ? "أدخل IP الـ VPS من لوحة تحكم Vultr"
                      : "Enter your VPS IP from Vultr dashboard"}
                  </p>
                </div>

                {/* VPS Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{lang === "ar" ? "منفذ البوت" : "Bot Port"}</p>
                    <p className="font-mono font-semibold">3000</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{lang === "ar" ? "نظام التشغيل" : "OS"}</p>
                    <p className="font-semibold">Ubuntu 22.04</p>
                  </div>
                </div>

                {/* IB Gateway Ports */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{lang === "ar" ? "منافذ IB Gateway" : "IB Gateway Ports"}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-center">
                      <p className="text-xs text-emerald-600">{lang === "ar" ? "ورقي" : "Paper"}</p>
                      <p className="font-mono font-bold">7497</p>
                    </div>
                    <div className="p-2 bg-red-500/10 rounded border border-red-500/20 text-center">
                      <p className="text-xs text-red-600">{lang === "ar" ? "حقيقي" : "Live"}</p>
                      <p className="font-mono font-bold">7496</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 text-center">
                      <p className="text-xs text-blue-600">{lang === "ar" ? "Gateway" : "Gateway"}</p>
                      <p className="font-mono font-bold">4001</p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{lang === "ar" ? "روابط سريعة" : "Quick Links"}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                      const ip = vpsIP || "YOUR_VPS_IP";
                      navigator.clipboard.writeText(`ssh root@${ip}`);
                      toast.success(lang === "ar" ? "تم نسخ أمر SSH" : "SSH command copied");
                    }}>
                      <Terminal className="h-4 w-4 mr-2" />
                      SSH Command
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                      const ip = vpsIP || "YOUR_VPS_IP";
                      navigator.clipboard.writeText(`http://${ip}:3000/api/health`);
                      toast.success(lang === "ar" ? "تم نسخ رابط Health" : "Health URL copied");
                    }}>
                      <Activity className="h-4 w-4 mr-2" />
                      Health Check
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                      const ip = vpsIP || "YOUR_VPS_IP";
                      navigator.clipboard.writeText(`http://${ip}:3000/api/webhook/tradingview`);
                      toast.success(lang === "ar" ? "تم نسخ رابط Webhook" : "Webhook URL copied");
                    }}>
                      <Radio className="h-4 w-4 mr-2" />
                      Webhook URL
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                      navigator.clipboard.writeText("pm2 logs trading-bot");
                      toast.success(lang === "ar" ? "تم نسخ أمر السجلات" : "Logs command copied");
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      PM2 Logs
                    </Button>
                  </div>
                </div>

                {/* Vultr Quick Setup */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">{lang === "ar" ? "خطوات الإعداد السريع:" : "Quick Setup Steps:"}</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <div>
                        <p className="text-sm font-medium">{lang === "ar" ? "إنشاء VPS" : "Create VPS"}</p>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "اختر Ubuntu 22.04 - $6/شهر" : "Choose Ubuntu 22.04 - $6/month"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <div>
                        <p className="text-sm font-medium">{lang === "ar" ? "الاتصال بـ SSH" : "Connect via SSH"}</p>
                        <p className="text-xs text-muted-foreground font-mono">ssh root@YOUR_IP</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <div>
                        <p className="text-sm font-medium">{lang === "ar" ? "تثبيت المتطلبات" : "Install Requirements"}</p>
                        <p className="text-xs text-muted-foreground font-mono">curl -fsSL https://bun.sh/install | bash</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <div>
                        <p className="text-sm font-medium">{lang === "ar" ? "رفع وتشغيل البوت" : "Upload & Start Bot"}</p>
                        <p className="text-xs text-muted-foreground font-mono">pm2 start ecosystem.config.js</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                  <p className="text-sm text-green-600">
                    {lang === "ar" 
                      ? "✅ البوت سيعمل 24/7 على Vultr VPS حتى لو أغلقت المتصفح"
                      : "✅ Bot will run 24/7 on Vultr VPS even if you close browser"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PM2 Commands */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  {lang === "ar" ? "أوامر PM2" : "PM2 Commands"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 bg-muted rounded font-mono text-sm cursor-pointer hover:bg-muted/80" onClick={() => {
                    navigator.clipboard.writeText("pm2 start trading-bot");
                    toast.success(lang === "ar" ? "تم النسخ" : "Copied");
                  }}>pm2 start trading-bot</div>
                  <div className="p-2 bg-muted rounded font-mono text-sm cursor-pointer hover:bg-muted/80" onClick={() => {
                    navigator.clipboard.writeText("pm2 stop trading-bot");
                    toast.success(lang === "ar" ? "تم النسخ" : "Copied");
                  }}>pm2 stop trading-bot</div>
                  <div className="p-2 bg-muted rounded font-mono text-sm cursor-pointer hover:bg-muted/80" onClick={() => {
                    navigator.clipboard.writeText("pm2 restart trading-bot");
                    toast.success(lang === "ar" ? "تم النسخ" : "Copied");
                  }}>pm2 restart trading-bot</div>
                  <div className="p-2 bg-muted rounded font-mono text-sm cursor-pointer hover:bg-muted/80" onClick={() => {
                    navigator.clipboard.writeText("pm2 logs trading-bot");
                    toast.success(lang === "ar" ? "تم النسخ" : "Copied");
                  }}>pm2 logs trading-bot</div>
                  <div className="p-2 bg-muted rounded font-mono text-sm cursor-pointer hover:bg-muted/80" onClick={() => {
                    navigator.clipboard.writeText("pm2 status");
                    toast.success(lang === "ar" ? "تم النسخ" : "Copied");
                  }}>pm2 status</div>
                  <div className="p-2 bg-muted rounded font-mono text-sm cursor-pointer hover:bg-muted/80" onClick={() => {
                    navigator.clipboard.writeText("pm2 monit");
                    toast.success(lang === "ar" ? "تم النسخ" : "Copied");
                  }}>pm2 monit</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Watchlist & Signals */}
          <TabsContent value="watchlist" className="space-y-6">
            <WatchlistSignals lang={lang} />
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t.performance}</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <LineChart className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>{t.performanceChart}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" />{t.winLossRatio}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center"><div className="text-3xl font-bold text-green-500">{stats.winRate.toFixed(0)}%</div><div className="text-sm text-muted-foreground">{t.win}</div></div>
                    <div className="text-center"><div className="text-3xl font-bold text-red-500">{(100 - stats.winRate).toFixed(0)}%</div><div className="text-sm text-muted-foreground">{t.loss}</div></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Charts */}
          <TabsContent value="charts" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" />{t.tradingCharts}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <LineChart className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p>{t.priceCharts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Whales */}
          <TabsContent value="whales" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="pt-4 text-center">
                  <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-500">8</p>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "صعودي" : "Bullish"}</p>
                </CardContent>
              </Card>
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="pt-4 text-center">
                  <TrendingDown className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-500">4</p>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "هبوطي" : "Bearish"}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="pt-4 text-center">
                  <Fish className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-500">8</p>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "عقود خيارات" : "Options"}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardContent className="pt-4 text-center">
                  <BarChart3 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-500">4</p>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "أسهم" : "Stocks"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Options Activity */}
            <Card className="border-2 border-teal-500/20">
              <CardHeader className="bg-teal-500/5">
                <CardTitle className="flex items-center gap-2 text-teal-600">
                  <Target className="h-5 w-5" />
                  {lang === "ar" ? "عقود الخيارات (Options)" : "Options Activity"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "حركات كبيرة في عقود الخيارات" : "Large options block trades"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {/* SPX Options */}
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-green-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold">SPX 5050 CALL</p>
                          <p className="text-sm text-muted-foreground">2,500 عقود • $850K</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-green-500">BULLISH</Badge>
                        <p className="text-xs text-muted-foreground mt-1">2 {t.minAgo}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-red-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-semibold">SPX 5100 PUT</p>
                          <p className="text-sm text-muted-foreground">1,800 عقود • $620K</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-red-500">BEARISH</Badge>
                        <p className="text-xs text-muted-foreground mt-1">5 {t.minAgo}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-green-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold">SPX 5075 CALL</p>
                          <p className="text-sm text-muted-foreground">3,200 عقود • $1.1M</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-green-500">BULLISH</Badge>
                        <p className="text-xs text-muted-foreground mt-1">8 {t.minAgo}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-green-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold">SPY 510 CALL</p>
                          <p className="text-sm text-muted-foreground">5,000 عقود • $450K</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-green-500">BULLISH</Badge>
                        <p className="text-xs text-muted-foreground mt-1">3 {t.minAgo}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-red-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-semibold">QQQ 480 PUT</p>
                          <p className="text-sm text-muted-foreground">2,800 عقود • $250K</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-red-500">BEARISH</Badge>
                        <p className="text-xs text-muted-foreground mt-1">10 {t.minAgo}</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Stocks Activity */}
            <Card className="border-2 border-purple-500/20">
              <CardHeader className="bg-purple-500/5">
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <BarChart3 className="h-5 w-5" />
                  {lang === "ar" ? "حركات الأسهم (Stocks)" : "Stock Activity"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "مشتريات كبيرة في الأسهم" : "Large stock purchases"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-green-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-600">
                          AAPL
                        </div>
                        <div>
                          <p className="font-semibold">Apple Inc.</p>
                          <p className="text-sm text-muted-foreground">50,000 سهم • $9.5M</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-green-500">BUY</Badge>
                        <p className="text-xs text-muted-foreground mt-1">1 {t.minAgo}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-green-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-600">
                          NVDA
                        </div>
                        <div>
                          <p className="font-semibold">NVIDIA Corp.</p>
                          <p className="text-sm text-muted-foreground">18,000 سهم • $15M</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-green-500">BUY</Badge>
                        <p className="text-xs text-muted-foreground mt-1">9 {t.minAgo}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-green-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-600">
                          TSLA
                        </div>
                        <div>
                          <p className="font-semibold">Tesla Inc.</p>
                          <p className="text-sm text-muted-foreground">25,000 سهم • $4.5M</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-green-500">BUY</Badge>
                        <p className="text-xs text-muted-foreground mt-1">6 {t.minAgo}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-l from-green-500/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-600">
                          META
                        </div>
                        <div>
                          <p className="font-semibold">Meta Platforms</p>
                          <p className="text-sm text-muted-foreground">15,000 سهم • $7.2M</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge className="bg-green-500">BUY</Badge>
                        <p className="text-xs text-muted-foreground mt-1">15 {t.minAgo}</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connection */}
          <TabsContent value="connection" className="space-y-6">
            {/* IB Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Interactive Brokers {lang === "ar" ? "إعدادات" : "Settings"}
                </CardTitle>
                <CardDescription>{t.configureIB}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t.host}</Label>
                    <Input value={ibHost} onChange={(e) => setIbHost(e.target.value)} placeholder="127.0.0.1" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.port}</Label>
                    <Select value={ibPort} onValueChange={setIbPort}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7497">7497 (Paper)</SelectItem>
                        <SelectItem value="7496">7496 (Live)</SelectItem>
                        <SelectItem value="4001">4001 (Gateway)</SelectItem>
                        <SelectItem value="4002">4002 (Gateway Live)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.clientId}</Label>
                    <Input value={ibClientId} onChange={(e) => setIbClientId(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => saveSettings({ ibHost, ibPort: parseInt(ibPort) || 7497, ibClientId: parseInt(ibClientId) || 1 })} disabled={saving}>
                    {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {t.saveSettings}
                  </Button>

                  {/* Connect/Disconnect Button - ALWAYS VISIBLE */}
                  {ibStatus?.connected ? (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        setSaving(true);
                        try {
                          const res = await fetch("/api/ib/disconnect", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: "demo" })
                          });
                          const data = await res.json();
                          if (data.success) {
                            toast.success(lang === "ar" ? "تم قطع الاتصال" : "Disconnected");
                            fetchData();
                          }
                        } catch (e) {
                          toast.error(lang === "ar" ? "فشل قطع الاتصال" : "Disconnect failed");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {lang === "ar" ? "قطع الاتصال" : "Disconnect"}
                    </Button>
                  ) : (
                    <Button
                      onClick={async () => {
                        setSaving(true);
                        try {
                          const res = await fetch("/api/ib", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "connect",
                              userId: "demo",
                              host: ibHost,
                              port: parseInt(ibPort) || 7497,
                              clientId: parseInt(ibClientId) || 1,
                              accountType: settings?.accountType || "simulation"
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            toast.success(lang === "ar" ? "تم الاتصال بنجاح!" : "Connected successfully!");
                            fetchData();
                          } else {
                            toast.error(data.error || data.message || (lang === "ar" ? "فشل الاتصال" : "Connection failed"));
                          }
                        } catch (e) {
                          toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      {lang === "ar" ? "🔗 اتصال الآن" : "🔗 Connect Now"}
                    </Button>
                  )}
                </div>

                {/* Quick Actions - 3 Connection Modes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  {/* Simulation Mode */}
                  <Button
                    variant="outline"
                    className={`h-auto py-4 flex flex-col items-center gap-2 ${settings?.accountType === 'simulation' ? 'border-green-500 bg-green-500/10' : ''}`}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await fetch("/api/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: "demo", accountType: "simulation" })
                        });
                        toast.success(lang === "ar" ? "تم التبديل إلى الوضع التجريبي" : "Switched to Simulation mode");
                        fetchData();
                      } catch (e) {
                        toast.error(lang === "ar" ? "فشل" : "Failed");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    <TestTube className="h-6 w-6 text-green-500" />
                    <span className="font-bold">{lang === "ar" ? "وضع تجريبي" : "Simulation Mode"}</span>
                    <span className="text-xs text-muted-foreground">{lang === "ar" ? "بدون IB - للتجربة" : "No IB needed - For testing"}</span>
                  </Button>

                  {/* Paper Trading */}
                  <Button
                    variant="outline"
                    className={`h-auto py-4 flex flex-col items-center gap-2 ${settings?.accountType === 'paper' ? 'border-blue-500 bg-blue-500/10' : ''}`}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await fetch("/api/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: "demo", accountType: "paper" })
                        });
                        setIbPort("7497");
                        toast.success(lang === "ar" ? "تم التبديل إلى Paper Trading" : "Switched to Paper Trading");
                        fetchData();
                      } catch (e) {
                        toast.error(lang === "ar" ? "فشل" : "Failed");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    <Shield className="h-6 w-6 text-blue-500" />
                    <span className="font-bold">{lang === "ar" ? "Paper Trading" : "Paper Trading"}</span>
                    <span className="text-xs text-muted-foreground">{lang === "ar" ? "حساب تجريبي IB (7497)" : "IB Demo Account (7497)"}</span>
                  </Button>

                  {/* Live Trading */}
                  <Button
                    variant="outline"
                    className={`h-auto py-4 flex flex-col items-center gap-2 ${settings?.accountType === 'live' ? 'border-red-500 bg-red-500/10' : ''}`}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await fetch("/api/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: "demo", accountType: "live" })
                        });
                        setIbPort("7496");
                        toast.success(lang === "ar" ? "تم التبديل إلى التداول الحقيقي" : "Switched to Live Trading");
                        fetchData();
                      } catch (e) {
                        toast.error(lang === "ar" ? "فشل" : "Failed");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    <TrendingUp className="h-6 w-6 text-red-500" />
                    <span className="font-bold">{lang === "ar" ? "اتصال حقيقي" : "Live Trading"}</span>
                    <span className="text-xs text-muted-foreground">{lang === "ar" ? "تداول حقيقي (7496)" : "Real Trading (7496)"}</span>
                  </Button>
                </div>

                {/* Connection Status */}
                <div className={`flex items-center gap-4 p-4 rounded-lg ${ibStatus?.connected ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className={`h-4 w-4 rounded-full ${ibStatus?.connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  <div>
                    <p className="font-medium">
                      {ibStatus?.connected
                        ? (lang === "ar" ? "✅ متصل" : "✅ Connected")
                        : (lang === "ar" ? "❌ غير متصل" : "❌ Not Connected")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ibStatus?.isSimulation
                        ? (lang === "ar" ? "وضع التجربة - لا يحتاج IB" : "Simulation mode - no IB needed")
                        : ibStatus?.message || (lang === "ar" ? "شغّل IB TWS أو Gateway" : "Start IB TWS or Gateway")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to Connect IB */}
            <Card className="border-2 border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Info className="h-5 w-5" />
                  {lang === "ar" ? "كيفية الاتصال بـ IB" : "How to Connect to IB"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>{lang === "ar" ? "افتح IB TWS أو IB Gateway" : "Open IB TWS or IB Gateway"}</li>
                  <li>
                    {lang === "ar" ? "اذهب إلى: File → Global Configuration → API → Settings" : "Go to: File → Global Configuration → API → Settings"}
                  </li>
                  <li>{lang === "ar" ? "فعّل: \"Enable ActiveX and Socket Clients\"" : "Enable: \"Enable ActiveX and Socket Clients\""}</li>
                  <li>{lang === "ar" ? "تأكد من أن المنفذ صحيح (7497 Paper, 7496 Live)" : "Ensure port is correct (7497 Paper, 7496 Live)"}</li>
                  <li>{lang === "ar" ? "أضف 127.0.0.1 إلى قائمة Trusted IP Addresses" : "Add 127.0.0.1 to Trusted IP Addresses"}</li>
                  <li>{lang === "ar" ? "احفظ الإعدادات وأعد تشغيل TWS" : "Save settings and restart TWS"}</li>
                </ol>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 mt-3">
                  <p className="text-sm text-blue-600">
                    💡 {lang === "ar"
                      ? "نصيحة: استخدم وضع \"تجريبي\" للتدريب بدون حاجة لـ IB"
                      : "Tip: Use \"Simulation\" mode for practice without IB"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5" />{t.webhookURL}</CardTitle><CardDescription>{t.useInTradingView}</CardDescription></CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm break-all">{typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/tradingview` : '/api/webhook/tradingview'}</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook Tester */}
          <TabsContent value="webhook" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TestTube className="h-5 w-5" />{t.webhookTester}</CardTitle><CardDescription>{t.testIntegration}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm">
                  <pre>{JSON.stringify({ action: "CALL", symbol: "SPX", price: 5000, quantity: 1 }, null, 2)}</pre>
                </div>
                <Button onClick={testWebhook} className="w-full"><TestTube className="h-4 w-4 mr-2" />{t.sendTestWebhook}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Status Card */}
            <Card className={`border-2 ${telegramEnabled && telegramBotToken && telegramChatId ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${telegramEnabled && telegramBotToken && telegramChatId ? 'bg-green-500' : 'bg-amber-500/20'}`}>
                      <MessageSquare className={`h-6 w-6 ${telegramEnabled && telegramBotToken && telegramChatId ? 'text-white' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {telegramEnabled && telegramBotToken && telegramChatId
                          ? (lang === "ar" ? "🟢 Telegram متصل" : "🟢 Telegram Connected")
                          : (lang === "ar" ? "Telegram غير مُعد" : "Telegram Not Configured")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {telegramEnabled && telegramBotToken && telegramChatId
                          ? (lang === "ar" ? "ستصل الإشعارات إلى Telegram" : "Notifications will be sent to Telegram")
                          : (lang === "ar" ? "أدخل التوكن ومعرف المحادثة للتفعيل" : "Enter token and chat ID to enable")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={telegramEnabled}
                    onCheckedChange={(checked) => {
                      setTelegramEnabled(checked);
                      saveSettings({ telegramEnabled: checked, telegramBotToken, telegramChatId });
                    }}
                    disabled={!telegramBotToken || !telegramChatId}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Telegram Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  {lang === "ar" ? "إعدادات Telegram" : "Telegram Configuration"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "أدخل بيانات البوت الخاص بك" : "Enter your bot credentials"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    {t.botToken}
                  </Label>
                  <Input
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={telegramBotToken}
                    onChange={(e) => {
                      setTelegramBotToken(e.target.value);
                      setIsEditingTelegram(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {lang === "ar"
                      ? "احصل عليه من @BotFather في Telegram"
                      : "Get it from @BotFather in Telegram"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t.chatId}
                  </Label>
                  <Input
                    placeholder="-1001234567890"
                    value={telegramChatId}
                    onChange={(e) => {
                      setTelegramChatId(e.target.value);
                      setIsEditingTelegram(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {lang === "ar"
                      ? "معرف المحادثة أو القناة (أرسل رسالة للبوت ثم احصل على ID من @userinfobot)"
                      : "Chat or Channel ID (message your bot, then get ID from @userinfobot)"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsEditingTelegram(false);
                      saveSettings({ telegramEnabled, telegramBotToken, telegramChatId });
                    }}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {t.saveSettings}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={testTelegram}
                    disabled={!telegramBotToken || !telegramChatId}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {t.test}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-500" />
                  {lang === "ar" ? "أنواع الإشعارات" : "Notification Types"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "اختر الإشعارات التي تريد استلامها" : "Choose which notifications to receive"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trade Opened */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <Label className="font-medium">
                        {lang === "ar" ? "صفقة جديدة مفتوحة" : "Trade Opened"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "إشعار عند فتح صفقة جديدة" : "Notify when a new trade opens"}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                {/* Trade Closed */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label className="font-medium">
                        {lang === "ar" ? "صفقة مغلقة" : "Trade Closed"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "إشعار عند إغلاق صفقة مع الربح/الخسارة" : "Notify when trade closes with P&L"}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                {/* Daily Report */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label className="font-medium">
                        {lang === "ar" ? "التقرير اليومي" : "Daily Report"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "ملخص يومي للأداء والصفقات" : "Daily performance summary"}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                {/* Error Alerts */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <Label className="font-medium">
                        {lang === "ar" ? "تنبيهات الأخطاء" : "Error Alerts"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "إشعار عند حدوث خطأ في النظام" : "Notify on system errors"}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                {/* Whale Activity */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Fish className="h-5 w-5 text-teal-500" />
                    <div>
                      <Label className="font-medium">
                        {lang === "ar" ? "نشاط الحيتان" : "Whale Activity"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "إشعار عند رصد حركات كبيرة" : "Notify on large market moves"}
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                {/* Price Alerts */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-yellow-500" />
                    <div>
                      <Label className="font-medium">
                        {lang === "ar" ? "تنبيهات السعر" : "Price Alerts"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "تحديثات الأسعار المهمة" : "Important price updates"}
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Notification Language */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "لغة الإشعارات" : "Notification Language"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "اختر لغة إشعارات Telegram" : "Choose Telegram notification language"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={lang}
                  onValueChange={(value) => {
                    setLang(value as "en" | "ar");
                    toast.success(value === "ar" ? "تم تغيير اللغة إلى العربية" : "Language changed to English");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">
                      <div className="flex items-center gap-2">
                        <span>🇸🇦</span>
                        <span>العربية (Arabic)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>English</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  {lang === "ar"
                    ? "جميع إشعارات Telegram ستُرسل بالعربية"
                    : "All Telegram notifications will be sent in English"}
                </p>
              </CardContent>
            </Card>

            {/* Setup Guide */}
            <Card className="border-2 border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <HelpCircle className="h-5 w-5" />
                  {lang === "ar" ? "دليل الإعداد" : "Setup Guide"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">{lang === "ar" ? "إنشاء بوت Telegram" : "Create Telegram Bot"}</p>
                      <p className="text-sm text-muted-foreground">
                        {lang === "ar"
                          ? "افتح Telegram وابحث عن @BotFather، أرسل /newbot واتبع التعليمات"
                          : "Open Telegram, search @BotFather, send /newbot and follow instructions"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">{lang === "ar" ? "احصل على Chat ID" : "Get Chat ID"}</p>
                      <p className="text-sm text-muted-foreground">
                        {lang === "ar"
                          ? "أرسل رسالة لبوتك، ثم ابحث عن @userinfobot للحصول على ID"
                          : "Message your bot, then search @userinfobot to get your ID"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">{lang === "ar" ? "أدخل البيانات" : "Enter Credentials"}</p>
                      <p className="text-sm text-muted-foreground">
                        {lang === "ar"
                          ? "الصق التوكن وChat ID في الحقول أعلاه واضغط حفظ"
                          : "Paste token and Chat ID in fields above, click Save"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
                    <div>
                      <p className="font-medium">{lang === "ar" ? "اختبر الاتصال" : "Test Connection"}</p>
                      <p className="text-sm text-muted-foreground">
                        {lang === "ar"
                          ? "اضغط زر الاختبار للتأكد من وصول الإشعارات"
                          : "Click Test button to verify notifications work"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example Notification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  {lang === "ar" ? "مثال على الإشعار" : "Notification Example"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
{lang === "ar" ? `🔔 *صفقة جديدة مفتوحة*

📈 *SPX* 📈 كول
━━━━━━━━━━━━━━━
📌 *الاسترايك:* 5025
💰 *سعر الاسترايك:* $3.25
📊 *السعر الحالي:* $5002.50
📝 *عدد العقود:* 2
💵 *سعر الدخول:* $650.00
⏰ *الوقت:* 2024/01/15 10:30:00

🤖 _بوت التداول الاحترافي_` : `🔔 *New Trade Opened*

📈 *SPX* 📈 CALL
━━━━━━━━━━━━━━━
📌 *Strike:* 5025
💰 *Strike Price:* $3.25
📊 *Stock Price:* $5002.50
📝 *Contracts:* 2
💵 *Entry Price:* $650.00
⏰ *Time:* 2024/01/15 10:30:00 AM

🤖 _Trading Bot Pro_`}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk */}
          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />{t.riskManagement}</CardTitle><CardDescription>{t.riskParameters}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.maxRiskPerTrade}</Label><Input type="number" defaultValue="100" /></div>
                  <div className="space-y-2"><Label>{t.defaultQuantity}</Label><Input type="number" defaultValue="1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.maxOpenPositions}</Label><Input type="number" defaultValue="1" /></div>
                  <div className="space-y-2"><Label>{t.maxDailyLoss}</Label><Input type="number" defaultValue="500" /></div>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" /><div><p className="font-medium text-yellow-500">{t.important}</p><p className="text-sm text-muted-foreground">{t.protectAccountInfo}</p></div></div>
                </div>
                <Button disabled={saving}>{saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}{t.saveSettings}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Journal */}
          <TabsContent value="journal" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t.tradingJournal}</CardTitle><CardDescription>{t.documentTrades}</CardDescription></CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p>{t.journalEntries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Economic Calendar */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />{t.economicCalendar}</CardTitle><CardDescription>{t.upcomingEvents}</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2"><Newspaper className="h-4 w-4" /><span className="font-medium">{t.fomcMeeting}</span></div>
                    <div className="text-sm text-muted-foreground">{lang === "ar" ? "غداً 2:00 م" : "Tomorrow 2:00 PM"}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2"><Newspaper className="h-4 w-4" /><span className="font-medium">{t.cpiData}</span></div>
                    <div className="text-sm text-muted-foreground">{lang === "ar" ? "الأربعاء 8:30 ص" : "Wed 8:30 AM"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />{t.securitySettings}</CardTitle><CardDescription>{t.protectAccountTitle}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t.twoFactor}</Label>
                    <p className="text-sm text-muted-foreground">{t.extraSecurity}</p>
                  </div>
                  <Switch 
                    checked={twoFactorEnabled} 
                    onCheckedChange={async (checked) => {
                      setTwoFactorEnabled(checked);
                      toast.success(checked 
                        ? (lang === "ar" ? "تم تفعيل المصادقة الثنائية!" : "2FA enabled!") 
                        : (lang === "ar" ? "تم إيقاف المصادقة الثنائية" : "2FA disabled")
                      );
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t.sessionTimeout}</Label>
                    <p className="text-sm text-muted-foreground">{t.autoLogout}</p>
                  </div>
                  <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 {lang === "ar" ? "دقيقة" : "min"}</SelectItem>
                      <SelectItem value="30">30 {lang === "ar" ? "دقيقة" : "min"}</SelectItem>
                      <SelectItem value="60">1 {lang === "ar" ? "ساعة" : "hour"}</SelectItem>
                      <SelectItem value="120">2 {lang === "ar" ? "ساعة" : "hours"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">{lang === "ar" ? "نصائح الأمان" : "Security Tips"}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {lang === "ar" ? "استخدم كلمة مرور قوية" : "Use a strong password"}</li>
                    <li>• {lang === "ar" ? "فعّل المصادقة الثنائية" : "Enable two-factor authentication"}</li>
                    <li>• {lang === "ar" ? "لا تشارك بيانات الاتصال مع أحد" : "Never share your credentials"}</li>
                    <li>• {lang === "ar" ? "راجع سجلات النشاط بانتظام" : "Review activity logs regularly"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />{t.backupRestore}</CardTitle><CardDescription>{t.manageData}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={exportData}>
                    <Database className="h-4 w-4 mr-2" />{t.exportData}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => createBackup("FULL")} disabled={backupLoading}>
                    {backupLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {t.backupNow}
                  </Button>
                </div>
                <Separator />
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.lastBackup}</p>
                      <p className="text-sm text-muted-foreground">
                        {lastBackup ? new Date(lastBackup).toLocaleString() : t.never}
                      </p>
                    </div>
                    <Badge variant="outline">{backups.length} {lang === "ar" ? "نسخة" : "backups"}</Badge>
                  </div>
                </div>
                
                {/* Backup History */}
                {backups.length > 0 && (
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "سجل النسخ الاحتياطية" : "Backup History"}</Label>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {backups.map((backup, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{backup.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {(backup.size / 1024).toFixed(1)} KB • {new Date(backup.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => downloadBackup(backup.filename)}>
                                <Database className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => restoreBackup(backup.filename)}>
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help */}
          <TabsContent value="help" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />{t.userGuide}</CardTitle><CardDescription>{t.howToUse}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">{t.step1Title}</h3>
                    <p className="text-sm text-muted-foreground">{t.step1Desc}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">{t.step2Title}</h3>
                    <p className="text-sm text-muted-foreground">{t.step2Desc}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">{t.step3Title}</h3>
                    <p className="text-sm text-muted-foreground">{t.step3Desc}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">{t.step4Title}</h3>
                    <p className="text-sm text-muted-foreground">{t.step4Desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* TradingView Connection Guide */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "ربط TradingView" : "TradingView Integration"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "كيفية ربط البوت مع TradingView" : "How to connect the bot with TradingView"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Webhook URL */}
                <div className="p-4 bg-primary/5 rounded-lg border">
                  <Label className="font-semibold">
                    {lang === "ar" ? "رابط الويب هوك:" : "Webhook URL:"}
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm overflow-x-auto">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/tradingview
                    </code>
                    <Button size="sm" variant="outline" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/webhook/tradingview`);
                      toast.success(lang === "ar" ? "تم نسخ الرابط!" : "URL copied!");
                    }}>
                      {lang === "ar" ? "نسخ" : "Copy"}
                    </Button>
                  </div>
                </div>
                
                {/* Steps */}
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    {lang === "ar" ? "خطوات الإعداد:" : "Setup Steps:"}
                  </h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>{lang === "ar" ? "افتح TradingView وانتقل إلى الرسم البياني" : "Open TradingView and go to your chart"}</li>
                    <li>{lang === "ar" ? "انقر على 'تنبيهات' (Alerts) في الشريط الجانبي" : "Click on 'Alerts' in the sidebar"}</li>
                    <li>{lang === "ar" ? "أنشئ تنبيهاً جديداً واضبط الشروط" : "Create a new alert and set your conditions"}</li>
                    <li>{lang === "ar" ? "في 'إجراءات التنبيه' اختر 'Webhook URL'" : "In 'Alert Actions' select 'Webhook URL'"}</li>
                    <li>{lang === "ar" ? "الصق رابط الويب هوك أعلاه" : "Paste the webhook URL above"}</li>
                    <li>{lang === "ar" ? "في 'رسالة التنبيه' أضف JSON التالي:" : "In 'Alert Message' add this JSON:"}</li>
                  </ol>
                </div>
                
                {/* JSON Template */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <Label className="font-semibold mb-2 block">
                    {lang === "ar" ? "قالب رسالة التنبيه:" : "Alert Message Template:"}
                  </Label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "symbol": "{{ticker}}",
  "action": "CALL",
  "price": {{close}},
  "strategy": "{{strategy.order.comment}}",
  "quantity": 1
}`}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    {lang === "ar" 
                      ? "للبيع غيّر CALL إلى PUT، أو استخدم BUY/SELL للأسهم" 
                      : "For PUT change CALL to PUT, or use BUY/SELL for stocks"}
                  </p>
                </div>
                
                {/* Available Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Label className="font-semibold text-green-600">
                      {lang === "ar" ? "للخيارات (Options):" : "For Options:"}
                    </Label>
                    <p className="text-sm">CALL, PUT</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Label className="font-semibold text-blue-600">
                      {lang === "ar" ? "للأسهم (Stocks):" : "For Stocks:"}
                    </Label>
                    <p className="text-sm">BUY, SELL</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Management */}
          <TabsContent value="plans" className="space-y-6">
            <PlansManager />
          </TabsContent>

          {/* Advanced Trading Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid gap-6">
              {/* Trading Mode Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-violet-500" />
                    {lang === "ar" ? "أنماط التداول" : "Trading Modes"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "اختر نمط التداول المناسب لاستراتيجيتك" : "Choose a trading mode that fits your strategy"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Conservative */}
                    <Card className={`cursor-pointer border-2 transition-all ${tradingMode === "CONSERVATIVE" ? "border-green-500 bg-green-500/10" : "border-muted"}`} onClick={() => setTradingMode("CONSERVATIVE")}>
                      <CardContent className="p-4 text-center">
                        <Shield className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <h3 className="font-bold">{lang === "ar" ? "محافظ" : "Conservative"}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {lang === "ar" ? "ثقة 80%+" : "80%+ Confidence"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lang === "ar" ? "صفقات أقل، دقة أعلى" : "Fewer trades, higher accuracy"}
                        </p>
                      </CardContent>
                    </Card>
                    {/* Balanced */}
                    <Card className={`cursor-pointer border-2 transition-all ${tradingMode === "BALANCED" ? "border-blue-500 bg-blue-500/10" : "border-muted"}`} onClick={() => setTradingMode("BALANCED")}>
                      <CardContent className="p-4 text-center">
                        <Activity className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <h3 className="font-bold">{lang === "ar" ? "متوازن" : "Balanced"}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {lang === "ar" ? "ثقة 70%+" : "70%+ Confidence"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lang === "ar" ? "توازن بين الكمية والدقة" : "Balance between quantity and accuracy"}
                        </p>
                      </CardContent>
                    </Card>
                    {/* Aggressive */}
                    <Card className={`cursor-pointer border-2 transition-all ${tradingMode === "AGGRESSIVE" ? "border-red-500 bg-red-500/10" : "border-muted"}`} onClick={() => setTradingMode("AGGRESSIVE")}>
                      <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 mx-auto text-red-500 mb-2" />
                        <h3 className="font-bold">{lang === "ar" ? "عدواني" : "Aggressive"}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {lang === "ar" ? "ثقة 60%+" : "60%+ Confidence"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lang === "ar" ? "صفقات أكثر، مخاطرة أعلى" : "More trades, higher risk"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Confidence Thresholds */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        {lang === "ar" ? "حد الثقة (محافظ)" : "Conservative Threshold"} (%)
                      </Label>
                      <Input type="number" value={minConfidenceConservative} onChange={(e) => setMinConfidenceConservative(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        {lang === "ar" ? "حد الثقة (متوازن)" : "Balanced Threshold"} (%)
                      </Label>
                      <Input type="number" value={minConfidenceBalanced} onChange={(e) => setMinConfidenceBalanced(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-red-500" />
                        {lang === "ar" ? "حد الثقة (عدواني)" : "Aggressive Threshold"} (%)
                      </Label>
                      <Input type="number" value={minConfidenceAggressive} onChange={(e) => setMinConfidenceAggressive(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Indicators Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-500" />
                    {lang === "ar" ? "المؤشرات الفنية" : "Technical Indicators"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "فعّل أو ألغِ تفعيل المؤشرات الفنية المستخدمة في التحليل" : "Enable or disable technical indicators used in analysis"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">RSI</span>
                      </div>
                      <Switch checked={useRSI} onCheckedChange={setUseRSI} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">MACD</span>
                      </div>
                      <Switch checked={useMACD} onCheckedChange={setUseMACD} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Bollinger</span>
                      </div>
                      <Switch checked={useBollinger} onCheckedChange={setUseBollinger} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">EMA</span>
                      </div>
                      <Switch checked={useEMA} onCheckedChange={setUseEMA} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">ADX</span>
                      </div>
                      <Switch checked={useADX} onCheckedChange={setUseADX} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signal Detection Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" />
                    {lang === "ar" ? "كشف الإشارات" : "Signal Detection"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "أنواع الإشارات التي يكتشفها البوت تلقائياً" : "Types of signals the bot detects automatically"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="font-medium">{lang === "ar" ? "انفجارات الأسعار" : "Price Explosions"}</span>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "ضغط بولينجر + حجم غير عادي" : "Bollinger squeeze + unusual volume"}</p>
                      </div>
                      <Switch checked={detectExplosions} onCheckedChange={setDetectExplosions} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="font-medium">{lang === "ar" ? "الانعكاسات" : "Reversals"}</span>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "تباعد RSI" : "RSI divergence"}</p>
                      </div>
                      <Switch checked={detectReversals} onCheckedChange={setDetectReversals} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="font-medium">{lang === "ar" ? "النشاط المؤسسي" : "Institutional Activity"}</span>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "أحجام تداول ضخمة" : "Large trading volumes"}</p>
                      </div>
                      <Switch checked={detectInstitutional} onCheckedChange={setDetectInstitutional} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="font-medium">{lang === "ar" ? "مناطق العرض والطلب" : "Supply & Demand"}</span>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "تحديد تلقائي" : "Auto detection"}</p>
                      </div>
                      <Switch checked={detectSupplyDemand} onCheckedChange={setDetectSupplyDemand} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "حد حجم الانفجار (x)" : "Explosion Volume Threshold (x)"}</Label>
                      <Input type="number" step="0.1" value={explosionVolumeThreshold} onChange={(e) => setExplosionVolumeThreshold(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "حد تقلب الانفجار (x)" : "Explosion Volatility Threshold (x)"}</Label>
                      <Input type="number" step="0.1" value={explosionVolatilityThreshold} onChange={(e) => setExplosionVolatilityThreshold(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Settings Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    {lang === "ar" ? "إعدادات العقود" : "Contract Settings"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "كيفية تحديد عدد العقود لكل صفقة" : "How to determine contract quantity per trade"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["FIXED", "PERCENTAGE", "RISK_BASED", "CONFIDENCE"].map((mode) => (
                      <Button
                        key={mode}
                        variant={contractSizeMode === mode ? "default" : "outline"}
                        className={`h-auto py-3 flex-col ${contractSizeMode === mode ? "bg-violet-500 hover:bg-violet-600" : ""}`}
                        onClick={() => setContractSizeMode(mode as "FIXED" | "PERCENTAGE" | "RISK_BASED" | "CONFIDENCE")}
                      >
                        <span className="font-bold">
                          {mode === "FIXED" ? (lang === "ar" ? "ثابت" : "Fixed") :
                           mode === "PERCENTAGE" ? (lang === "ar" ? "نسبة %" : "Percent") :
                           mode === "RISK_BASED" ? (lang === "ar" ? "مخاطرة" : "Risk") :
                           (lang === "ar" ? "ثقة" : "Confidence")}
                        </span>
                        <span className="text-xs opacity-70">
                          {mode === "FIXED" ? (lang === "ar" ? "عدد محدد" : "Fixed number") :
                           mode === "PERCENTAGE" ? (lang === "ar" ? "% من المحفظة" : "% of portfolio") :
                           mode === "RISK_BASED" ? (lang === "ar" ? "مبلغ مخاطرة" : "Risk amount") :
                           (lang === "ar" ? "حسب الثقة" : "Based on confidence")}
                        </span>
                      </Button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "عدد العقود الثابت" : "Fixed Contracts"}</Label>
                      <Input type="number" value={fixedContracts} onChange={(e) => setFixedContracts(e.target.value)} disabled={contractSizeMode !== "FIXED"} />
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "النسبة المئوية (%)" : "Percentage (%)"}</Label>
                      <Input type="number" value={contractsPercentage} onChange={(e) => setContractsPercentage(e.target.value)} disabled={contractSizeMode !== "PERCENTAGE"} />
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "مبلغ المخاطرة ($)" : "Risk Amount ($)"}</Label>
                      <Input type="number" value={contractsRiskAmount} onChange={(e) => setContractsRiskAmount(e.target.value)} disabled={contractSizeMode !== "RISK_BASED"} />
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "أقل عدد عقود" : "Min Contracts"}</Label>
                      <Input type="number" value={minContracts} onChange={(e) => setMinContracts(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "أكثر عدد عقود" : "Max Contracts"}</Label>
                      <Input type="number" value={maxContracts} onChange={(e) => setMaxContracts(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Multiple Symbols Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    {lang === "ar" ? "الرموز المتعددة" : "Multiple Symbols"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "أضف أو أزل الرموز التي يتداول عليها البوت" : "Add or remove symbols the bot trades on"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {activeSymbols.map((symbol) => (
                      <Badge 
                        key={symbol} 
                        variant={symbol === primarySymbol ? "default" : "secondary"}
                        className={`text-sm py-1 px-3 cursor-pointer ${symbol === primarySymbol ? "bg-violet-500" : ""}`}
                        onClick={() => setPrimarySymbol(symbol)}
                      >
                        {symbol}
                        {symbol === primarySymbol && <Star className="h-3 w-3 ml-1 inline" />}
                        {activeSymbols.length > 1 && (
                          <XCircle 
                            className="h-3 w-3 ml-1 inline hover:text-red-500" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSymbols(activeSymbols.filter(s => s !== symbol));
                              if (symbol === primarySymbol && activeSymbols.length > 1) {
                                setPrimarySymbol(activeSymbols.filter(s => s !== symbol)[0]);
                              }
                            }} 
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder={lang === "ar" ? "أضف رمز جديد (مثل: SPY, QQQ)" : "Add new symbol (e.g., SPY, QQQ)"} 
                      value={newSymbol} 
                      onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSymbol && !activeSymbols.includes(newSymbol)) {
                          setActiveSymbols([...activeSymbols, newSymbol]);
                          setNewSymbol("");
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        if (newSymbol && !activeSymbols.includes(newSymbol)) {
                          setActiveSymbols([...activeSymbols, newSymbol]);
                          setNewSymbol("");
                        }
                      }}
                      disabled={!newSymbol || activeSymbols.includes(newSymbol)}
                    >
                      {lang === "ar" ? "إضافة" : "Add"}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {lang === "ar" 
                      ? "اضغط على رمز لجعله الأساسي (★). الرمز الأساسي هو الذي سيتم التداول عليه افتراضياً." 
                      : "Click a symbol to make it primary (★). Primary symbol is the default for trading."}
                  </p>
                </CardContent>
              </Card>

              {/* Auto Trading Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    {lang === "ar" ? "ساعات التداول التلقائي" : "Auto Trading Hours"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "وقت البدء" : "Start Time"}</Label>
                      <Input type="time" value={autoTradingStartTime} onChange={(e) => setAutoTradingStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "وقت الانتهاء" : "End Time"}</Label>
                      <Input type="time" value={autoTradingEndTime} onChange={(e) => setAutoTradingEndTime(e.target.value)} />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">{lang === "ar" ? "معالجة إشارات TradingView" : "Process TradingView Signals"}</span>
                      <Switch checked={processTradingViewSignals} onCheckedChange={setProcessTradingViewSignals} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">{lang === "ar" ? "اختيار الاسترايك تلقائياً" : "Auto Select Strike"}</span>
                      <Switch checked={autoSelectStrike} onCheckedChange={setAutoSelectStrike} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">{lang === "ar" ? "تحديد الاتجاه تلقائياً" : "Auto Determine Direction"}</span>
                      <Switch checked={autoDetermineDirection} onCheckedChange={setAutoDetermineDirection} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset to defaults
                    setTradingMode("BALANCED");
                    setActiveSymbols(["SPX"]);
                    setPrimarySymbol("SPX");
                    setContractSizeMode("FIXED");
                    setFixedContracts("1");
                    setUseRSI(true);
                    setUseMACD(true);
                    setUseBollinger(true);
                    setUseEMA(true);
                    setUseADX(true);
                    setDetectExplosions(true);
                    setDetectReversals(true);
                    setDetectInstitutional(true);
                    setDetectSupplyDemand(true);
                  }}
                >
                  {lang === "ar" ? "إعادة تعيين" : "Reset"}
                </Button>
                <Button 
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const res = await fetch("/api/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: "demo",
                          tradingMode,
                          activeSymbols: activeSymbols.join(","),
                          primarySymbol,
                          contractSizeMode,
                          fixedContracts: parseInt(fixedContracts),
                          contractsPercentage: parseFloat(contractsPercentage),
                          contractsRiskAmount: parseFloat(contractsRiskAmount),
                          minContracts: parseInt(minContracts),
                          maxContracts: parseInt(maxContracts),
                          minConfidenceConservative: parseFloat(minConfidenceConservative),
                          minConfidenceBalanced: parseFloat(minConfidenceBalanced),
                          minConfidenceAggressive: parseFloat(minConfidenceAggressive),
                          useRSI,
                          useMACD,
                          useBollinger,
                          useEMA,
                          useADX,
                          detectExplosions,
                          detectReversals,
                          detectInstitutional,
                          detectSupplyDemand,
                          explosionVolumeThreshold: parseFloat(explosionVolumeThreshold),
                          explosionVolatilityThreshold: parseFloat(explosionVolatilityThreshold),
                          autoTradingStartTime,
                          autoTradingEndTime,
                          processTradingViewSignals,
                          autoSelectStrike,
                          autoDetermineDirection,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success(lang === "ar" ? "تم حفظ الإعدادات المتقدمة!" : "Advanced settings saved!");
                      } else {
                        toast.error(lang === "ar" ? "فشل الحفظ" : "Failed to save");
                      }
                    } catch {
                      toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="bg-violet-500 hover:bg-violet-600"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {lang === "ar" ? "حفظ الإعدادات" : "Save Settings"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Platform Integration - Binance, Coinbase, Exness */}
          <TabsContent value="platforms" className="space-y-6">
            {/* Header */}
            <Card className="border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {lang === "ar" ? "التكامل مع المنصات" : "Platform Integration"}
                    </h2>
                    <p className="text-muted-foreground">
                      {lang === "ar" ? "ربط البوت بمنصات التداول لتنفيذ الصفقات تلقائياً" : "Connect bot to trading platforms for automatic execution"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Binance */}
              <Card className="border-2 border-yellow-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-yellow-500">B</span>
                      </div>
                      <div>
                        <CardTitle>Binance</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {lang === "ar" ? "عملات رقمية (Spot & Futures)" : "Crypto (Spot & Futures)"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={platformConnections.binance ? "default" : "secondary"} className={platformConnections.binance ? "bg-green-500" : ""}>
                      {platformConnections.binance ? (lang === "ar" ? "متصل" : "Connected") : (lang === "ar" ? "غير متصل" : "Offline")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Binance API Key"
                      value={binanceApiKey}
                      onChange={(e) => setBinanceApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">API Secret</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Binance API Secret"
                      value={binanceApiSecret}
                      onChange={(e) => setBinanceApiSecret(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{lang === "ar" ? "وضع التجريبي (Testnet)" : "Testnet Mode"}</span>
                    </div>
                    <Switch 
                      checked={binanceTestnet}
                      onCheckedChange={setBinanceTestnet}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => connectPlatform('binance')}
                      disabled={platformLoading === 'binance'}
                    >
                      {platformLoading === 'binance' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {lang === "ar" ? "ربط" : "Connect"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => disconnectPlatform('binance')}
                      disabled={!platformConnections.binance}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Coinbase */}
              <Card className="border-2 border-blue-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-500">C</span>
                      </div>
                      <div>
                        <CardTitle>Coinbase Pro</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {lang === "ar" ? "عملات رقمية متقدمة" : "Advanced Crypto Trading"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={platformConnections.coinbase ? "default" : "secondary"} className={platformConnections.coinbase ? "bg-green-500" : ""}>
                      {platformConnections.coinbase ? (lang === "ar" ? "متصل" : "Connected") : (lang === "ar" ? "غير متصل" : "Offline")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Coinbase API Key"
                      value={coinbaseApiKey}
                      onChange={(e) => setCoinbaseApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">API Secret</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Coinbase API Secret"
                      value={coinbaseApiSecret}
                      onChange={(e) => setCoinbaseApiSecret(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Passphrase</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Passphrase"
                      value={coinbasePassphrase}
                      onChange={(e) => setCoinbasePassphrase(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{lang === "ar" ? "وضع Sandbox" : "Sandbox Mode"}</span>
                    </div>
                    <Switch 
                      checked={coinbaseSandbox}
                      onCheckedChange={setCoinbaseSandbox}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => connectPlatform('coinbase')}
                      disabled={platformLoading === 'coinbase'}
                    >
                      {platformLoading === 'coinbase' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {lang === "ar" ? "ربط" : "Connect"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => disconnectPlatform('coinbase')}
                      disabled={!platformConnections.coinbase}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Exness */}
              <Card className="border-2 border-emerald-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-emerald-500">E</span>
                      </div>
                      <div>
                        <CardTitle>Exness</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {lang === "ar" ? "فوركس ومعادن" : "Forex & Metals"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={platformConnections.exness ? "default" : "secondary"} className={platformConnections.exness ? "bg-green-500" : ""}>
                      {platformConnections.exness ? (lang === "ar" ? "متصل" : "Connected") : (lang === "ar" ? "غير متصل" : "Offline")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Exness API Key"
                      value={exnessApiKey}
                      onChange={(e) => setExnessApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">API Secret</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter Exness API Secret"
                      value={exnessApiSecret}
                      onChange={(e) => setExnessApiSecret(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{lang === "ar" ? "رقم الحساب" : "Account ID"}</Label>
                    <Input 
                      placeholder="Enter Account ID"
                      value={exnessAccountId}
                      onChange={(e) => setExnessAccountId(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">{lang === "ar" ? "حساب تجريبي (Demo)" : "Demo Account"}</span>
                    </div>
                    <Switch 
                      checked={exnessDemo}
                      onCheckedChange={setExnessDemo}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => connectPlatform('exness')}
                      disabled={platformLoading === 'exness'}
                    >
                      {platformLoading === 'exness' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {lang === "ar" ? "ربط" : "Connect"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => disconnectPlatform('exness')}
                      disabled={!platformConnections.exness}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Interactive Brokers */}
              <Card className="border-2 border-green-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-green-500">IB</span>
                      </div>
                      <div>
                        <CardTitle>Interactive Brokers</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {lang === "ar" ? "أسهم وخيارات" : "Stocks & Options"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={ibStatus?.connected ? "default" : "secondary"} className={ibStatus?.connected ? "bg-green-500" : ""}>
                      {ibStatus?.connected ? (lang === "ar" ? "متصل" : "Connected") : (lang === "ar" ? "غير متصل" : "Offline")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{lang === "ar" ? "المضيف" : "Host"}</Label>
                      <Input value={ibHost} onChange={(e) => setIbHost(e.target.value)} className="h-8" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{lang === "ar" ? "المنفذ" : "Port"}</Label>
                      <Input value={ibPort} onChange={(e) => setIbPort(e.target.value)} className="h-8" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Client ID</Label>
                      <Input value={ibClientId} onChange={(e) => setIbClientId(e.target.value)} className="h-8" />
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${ibStatus?.connected ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                    <div className="flex items-center gap-2">
                      {ibStatus?.connected ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="text-sm">
                        {ibStatus?.connected 
                          ? (lang === "ar" ? `متصل (${ibStatus.accountType})` : `Connected (${ibStatus.accountType})`)
                          : (lang === "ar" ? "شغّل TWS أو Gateway" : "Start TWS or Gateway")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connection Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "حالة الاتصالات" : "Connection Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg ${platformConnections.binance ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Binance</span>
                      {platformConnections.binance && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {binanceTestnet ? (lang === "ar" ? "تجريبي" : "Testnet") : (lang === "ar" ? "حقيقي" : "Live")}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${platformConnections.coinbase ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Coinbase</span>
                      {platformConnections.coinbase && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {coinbaseSandbox ? (lang === "ar" ? "تجريبي" : "Sandbox") : (lang === "ar" ? "حقيقي" : "Live")}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${platformConnections.exness ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Exness</span>
                      {platformConnections.exness && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {exnessDemo ? (lang === "ar" ? "تجريبي" : "Demo") : (lang === "ar" ? "حقيقي" : "Live")}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${ibStatus?.connected ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">IB</span>
                      {ibStatus?.connected && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ibStatus?.connected ? ibStatus.accountType : (lang === "ar" ? "غير متصل" : "Offline")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Trade Panel */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "تداول سريع" : "Quick Trade"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "تنفيذ صفقة سريعة على أي منصة متصلة" : "Execute quick trade on any connected platform"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">{lang === "ar" ? "المنصة" : "Platform"}</Label>
                    <Select value={quickTradePlatform} onValueChange={setQuickTradePlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="coinbase">Coinbase</SelectItem>
                        <SelectItem value="exness">Exness</SelectItem>
                        <SelectItem value="ib">Interactive Brokers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{lang === "ar" ? "الرمز" : "Symbol"}</Label>
                    <Input 
                      placeholder={quickTradePlatform === 'exness' ? 'EURUSD' : 'BTCUSDT'}
                      value={quickTradeSymbol}
                      onChange={(e) => setQuickTradeSymbol(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{lang === "ar" ? "الاتجاه" : "Side"}</Label>
                    <Select value={quickTradeSide} onValueChange={setQuickTradeSide}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">{lang === "ar" ? "شراء" : "BUY"}</SelectItem>
                        <SelectItem value="SELL">{lang === "ar" ? "بيع" : "SELL"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{lang === "ar" ? "الكمية" : "Quantity"}</Label>
                    <Input 
                      type="number"
                      placeholder="0.01"
                      value={quickTradeQuantity}
                      onChange={(e) => setQuickTradeQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">&nbsp;</Label>
                    <Button 
                      className="w-full"
                      onClick={executeQuickTrade}
                      disabled={!platformConnections[quickTradePlatform as keyof typeof platformConnections]}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {lang === "ar" ? "تنفيذ" : "Execute"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Push Notifications */}
          <TabsContent value="push" className="space-y-6">
            {/* Header */}
            <Card className="border-2 border-pink-500/30 bg-gradient-to-r from-pink-500/5 to-purple-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-pink-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {lang === "ar" ? "إشعارات Push للهاتف" : "Push Notifications"}
                    </h2>
                    <p className="text-muted-foreground">
                      {lang === "ar" ? "استلم تنبيهات فورية على هاتفك" : "Get instant alerts on your phone"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Firebase Cloud Messaging */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-500" />
                    Firebase Cloud Messaging
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "إشعارات عبر Google Firebase" : "Notifications via Google Firebase"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium">FCM {lang === "ar" ? "مفعّل" : "Enabled"}</span>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>Server Key</Label>
                    <Input type="password" placeholder="Enter FCM Server Key" />
                  </div>
                  <div className="space-y-2">
                    <Label>Device Token</Label>
                    <Input placeholder="Enter device FCM token" />
                  </div>
                  <Button variant="outline" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    {lang === "ar" ? "إرسال رسالة اختبار" : "Send Test Push"}
                  </Button>
                </CardContent>
              </Card>

              {/* Web Push */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    Web Push API
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "إشعارات المتصفح المباشرة" : "Direct browser notifications"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium">Web Push {lang === "ar" ? "مفعّل" : "Enabled"}</span>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>VAPID Public Key</Label>
                    <Input placeholder="Enter VAPID public key" />
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if ('Notification' in window) {
                        Notification.requestPermission().then((permission) => {
                          if (permission === 'granted') {
                            new Notification('Trading Bot Pro', {
                              body: lang === "ar" ? 'إشعارات Push مفعّلة!' : 'Push notifications enabled!',
                              icon: '/favicon.ico'
                            });
                            toast.success(lang === "ar" ? "تم تفعيل الإشعارات!" : "Notifications enabled!");
                          }
                        });
                      }
                    }}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {lang === "ar" ? "طلب الإذن" : "Request Permission"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "إعدادات الإشعارات" : "Notification Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{lang === "ar" ? "إشارة تداول قوية" : "Strong Trading Signal"}</p>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "ثقة 80%+" : "80%+ confidence"}</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">{lang === "ar" ? "تحذير مخاطرة" : "Risk Warning"}</p>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "تغير كبير في السوق" : "Major market change"}</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{lang === "ar" ? "صفقة منفذة" : "Trade Executed"}</p>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "تأكيد التنفيذ" : "Execution confirmation"}</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">{lang === "ar" ? "تقرير يومي" : "Daily Report"}</p>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "ملخص الأداء" : "Performance summary"}</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "ساعات الهدوء (من)" : "Quiet Hours (From)"}</Label>
                    <Input type="time" defaultValue="22:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "ساعات الهدوء (إلى)" : "Quiet Hours (To)"}</Label>
                    <Input type="time" defaultValue="08:00" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Setup */}
            <Card className="border-2 border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  {lang === "ar" ? "الإعداد السريع" : "Quick Setup"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                    <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">1</div>
                    <p>{lang === "ar" ? "فعّل إشعارات Push بالضغط على الزر أعلاه" : "Enable Push notifications by clicking the button above"}</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                    <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">2</div>
                    <p>{lang === "ar" ? "اسمح للمتصفح بإرسال الإشعارات" : "Allow browser to send notifications"}</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                    <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">✓</div>
                    <p>{lang === "ar" ? "ستصلك الإشعارات فورياً على جهازك" : "You'll receive instant notifications on your device"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Technical Analysis */}
          <TabsContent value="technical" className="space-y-6">
            {/* Header */}
            <Card className="border-2 border-teal-500/30 bg-gradient-to-r from-teal-500/5 to-cyan-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <LineChart className="h-8 w-8 text-teal-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {lang === "ar" ? "التحليل الفني المتقدم" : "Advanced Technical Analysis"}
                    </h2>
                    <p className="text-muted-foreground">
                      {lang === "ar" ? "أدوات احترافية لتحليل السوق" : "Professional tools for market analysis"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Fibonacci Retracement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-yellow-500" />
                    Fibonacci Retracement
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "تحديد مستويات الدعم والمقاومة" : "Identify support and resistance levels"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium">{lang === "ar" ? "تفعيل Fibonacci" : "Enable Fibonacci"}</span>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium mb-2">{lang === "ar" ? "المستويات الرئيسية:" : "Key Levels:"}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>23.6%</span><Badge variant="outline">{lang === "ar" ? "تصحيح خفيف" : "Light retracement"}</Badge></div>
                      <div className="flex justify-between"><span>38.2%</span><Badge variant="outline" className="bg-blue-500/10">{lang === "ar" ? "تصحيح متوسط ⭐" : "Moderate retracement ⭐"}</Badge></div>
                      <div className="flex justify-between"><span>50.0%</span><Badge variant="outline">{lang === "ar" ? "تصحيح نصف" : "Half retracement"}</Badge></div>
                      <div className="flex justify-between"><span>61.8%</span><Badge variant="outline" className="bg-green-500/10">{lang === "ar" ? "التصحيح الذهبي ⭐⭐" : "Golden ratio ⭐⭐"}</Badge></div>
                      <div className="flex justify-between"><span>78.6%</span><Badge variant="outline">{lang === "ar" ? "تصحيح عميق" : "Deep retracement"}</Badge></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "أعلى سعر" : "High Price"}</Label>
                      <Input type="number" placeholder="5100" />
                    </div>
                    <div className="space-y-2">
                      <Label>{lang === "ar" ? "أدنى سعر" : "Low Price"}</Label>
                      <Input type="number" placeholder="4800" />
                    </div>
                  </div>

                  <Button className="w-full">
                    {lang === "ar" ? "حساب مستويات Fibonacci" : "Calculate Fibonacci Levels"}
                  </Button>
                </CardContent>
              </Card>

              {/* Elliott Wave Theory */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Elliott Wave Theory
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "تحليل أنماط الموجات" : "Wave pattern analysis"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium">{lang === "ar" ? "تفعيل Elliott Wave" : "Enable Elliott Wave"}</span>
                    <Switch defaultChecked />
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium mb-2">{lang === "ar" ? "الأنماط الأساسية:" : "Basic Patterns:"}</p>
                    <div className="space-y-3">
                      <div className="p-2 rounded bg-green-500/10">
                        <p className="text-sm font-medium">{lang === "ar" ? "الدافع (5 موجات)" : "Impulse (5 waves)"}</p>
                        <p className="text-xs text-muted-foreground">1-2-3-4-5 {lang === "ar" ? "(اتجاه رئيسي)" : "(main trend)"}</p>
                      </div>
                      <div className="p-2 rounded bg-red-500/10">
                        <p className="text-sm font-medium">{lang === "ar" ? "التصحيحي (3 موجات)" : "Corrective (3 waves)"}</p>
                        <p className="text-xs text-muted-foreground">A-B-C {lang === "ar" ? "(عكس الاتجاه)" : "(counter trend)"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "الموجة الحالية المكتشفة" : "Detected Current Wave"}</Label>
                    <Select defaultValue="3">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Wave 1</SelectItem>
                        <SelectItem value="2">Wave 2</SelectItem>
                        <SelectItem value="3">Wave 3 ({lang === "ar" ? "الأقوى" : "Strongest"})</SelectItem>
                        <SelectItem value="4">Wave 4</SelectItem>
                        <SelectItem value="5">Wave 5</SelectItem>
                        <SelectItem value="A">Wave A</SelectItem>
                        <SelectItem value="B">Wave B</SelectItem>
                        <SelectItem value="C">Wave C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full">
                    {lang === "ar" ? "تحليل Elliott Wave" : "Analyze Elliott Wave"}
                  </Button>
                </CardContent>
              </Card>

              {/* Harmonic Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-cyan-500" />
                    {lang === "ar" ? "الأنماط التوافقية" : "Harmonic Patterns"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "كشف الأنماط السعرية المتقدمة" : "Detect advanced price patterns"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {['Gartley', 'Butterfly', 'Bat', 'Crab', 'Shark', 'Cypher'].map((pattern) => (
                      <div key={pattern} className="flex items-center justify-between p-2 rounded-lg border">
                        <span className="text-sm">{pattern}</span>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-sm text-cyan-600">
                      {lang === "ar"
                        ? "💡 الأنماط التوافقية تحدد نقاط الانعكاس بدقة عالية"
                        : "💡 Harmonic patterns identify reversal points with high precision"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Pivot Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Pivot Points
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar" ? "نقاط المحور اليومية" : "Daily pivot points"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "طريقة الحساب" : "Calculation Method"}</Label>
                    <Select defaultValue="standard">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="fibonacci">Fibonacci</SelectItem>
                        <SelectItem value="camarilla">Camarilla</SelectItem>
                        <SelectItem value="woodie">Woodie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/30 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-red-500">R3</span><span>5150.00</span></div>
                      <div className="flex justify-between"><span className="text-red-400">R2</span><span>5100.00</span></div>
                      <div className="flex justify-between"><span className="text-orange-500">R1</span><span>5050.00</span></div>
                      <div className="flex justify-between font-bold"><span className="text-primary">Pivot</span><span>5000.00</span></div>
                      <div className="flex justify-between"><span className="text-green-500">S1</span><span>4950.00</span></div>
                      <div className="flex justify-between"><span className="text-green-400">S2</span><span>4900.00</span></div>
                      <div className="flex justify-between"><span className="text-green-500">S3</span><span>4850.00</span></div>
                    </div>
                  </div>

                  <Button className="w-full">
                    {lang === "ar" ? "حساب Pivot Points" : "Calculate Pivot Points"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Combined Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-500" />
                  {lang === "ar" ? "التحليل المُجمّع" : "Combined Analysis"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "نتيجة جميع المؤشرات معاً" : "Result of all indicators combined"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-3xl font-bold text-green-500">85%</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "إشارة صعودية" : "Bullish Signal"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-3xl font-bold">SPX</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "الرمز الحالي" : "Current Symbol"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-3xl font-bold text-blue-500">Wave 3</p>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "الموجة الحالية" : "Current Wave"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mobile App */}
          <TabsContent value="mobile" className="space-y-6">
            {/* Header */}
            <Card className="border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {lang === "ar" ? "تطبيق الموبايل" : "Mobile App"}
                    </h2>
                    <p className="text-muted-foreground">
                      {lang === "ar" ? "تداول من أي مكان مع تطبيقنا" : "Trade from anywhere with our app"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* App Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    {lang === "ar" ? "مميزات التطبيق" : "App Features"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{lang === "ar" ? "لوحة تحكم مصغرة" : "Mini Dashboard"}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{lang === "ar" ? "إشعارات فورية" : "Instant Alerts"}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{lang === "ar" ? "رسم بياني تفاعلي" : "Interactive Charts"}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{lang === "ar" ? "تنفيذ الصفقات" : "Execute Trades"}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{lang === "ar" ? "سجل العمليات" : "Trade History"}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{lang === "ar" ? "إعدادات البوت" : "Bot Settings"}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{lang === "ar" ? "وضع الظلام" : "Dark Mode"}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{lang === "ar" ? "دعم العربية" : "Arabic Support"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Download Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    {lang === "ar" ? "تحميل التطبيق" : "Download App"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* iOS */}
                  <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center">
                        <span className="text-white text-2xl"></span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">iOS App</p>
                        <p className="text-sm text-muted-foreground">App Store</p>
                      </div>
                      <Button variant="outline" size="sm">
                        {lang === "ar" ? "قريباً" : "Coming Soon"}
                      </Button>
                    </div>
                  </div>

                  {/* Android */}
                  <div className="p-4 rounded-lg border-2 border-green-200 dark:border-green-800 hover:border-green-400 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                        <span className="text-white text-2xl"></span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Android App</p>
                        <p className="text-sm text-muted-foreground">Google Play</p>
                      </div>
                      <Button variant="outline" size="sm">
                        {lang === "ar" ? "قريباً" : "Coming Soon"}
                      </Button>
                    </div>
                  </div>

                  {/* PWA */}
                  <div className="p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">PWA</p>
                        <p className="text-sm text-muted-foreground">{lang === "ar" ? "تطبيق ويب تقدمي" : "Progressive Web App"}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          toast.success(lang === "ar" ? "يمكنك إضافة الموقع للشاشة الرئيسية!" : "You can add this site to home screen!");
                        }}
                      >
                        {lang === "ar" ? "متوفر" : "Available"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PWA Instructions */}
            <Card className="border-2 border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Globe className="h-5 w-5" />
                  {lang === "ar" ? "كيفية تثبيت PWA" : "How to Install PWA"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="font-medium">{lang === "ar" ? "على iPhone/iPad:" : "On iPhone/iPad:"}</p>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>{lang === "ar" ? "افتح الموقع في Safari" : "Open this site in Safari"}</li>
                      <li>{lang === "ar" ? "اضغط زر المشاركة" : "Tap the Share button"}</li>
                      <li>{lang === "ar" ? "اختر \"إضافة إلى الشاشة الرئيسية\"" : "Select \"Add to Home Screen\""}</li>
                      <li>{lang === "ar" ? "اضغط \"إضافة\"" : "Tap \"Add\""}</li>
                    </ol>
                  </div>
                  <div className="space-y-3">
                    <p className="font-medium">{lang === "ar" ? "على Android:" : "On Android:"}</p>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>{lang === "ar" ? "افتح الموقع في Chrome" : "Open this site in Chrome"}</li>
                      <li>{lang === "ar" ? "اضغط على القائمة ( ثلاث نقاط)" : "Tap the menu (⋮ three dots)"}</li>
                      <li>{lang === "ar" ? "اختر \"إضافة إلى الشاشة الرئيسية\"" : "Select \"Add to Home Screen\""}</li>
                      <li>{lang === "ar" ? "اضغط \"تثبيت\"" : "Tap \"Install\""}</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* App Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "معاينة التطبيق" : "App Preview"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Dashboard Preview */}
                  <div className="aspect-[9/16] bg-gradient-to-b from-background to-muted rounded-2xl border-2 overflow-hidden">
                    <div className="p-4 border-b bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Trading Bot</span>
                        <Badge className="bg-green-500 text-xs">Live</Badge>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="h-16 rounded-lg bg-muted animate-pulse" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-12 rounded-lg bg-muted animate-pulse" />
                        <div className="h-12 rounded-lg bg-muted animate-pulse" />
                      </div>
                      <div className="h-20 rounded-lg bg-muted animate-pulse" />
                      <div className="h-20 rounded-lg bg-muted animate-pulse" />
                    </div>
                  </div>

                  {/* Chart Preview */}
                  <div className="aspect-[9/16] bg-gradient-to-b from-background to-muted rounded-2xl border-2 overflow-hidden">
                    <div className="p-4 border-b bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">SPX</span>
                        <span className="text-green-500 text-sm">+1.2%</span>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="h-32 rounded-lg bg-gradient-to-t from-green-500/20 to-transparent" />
                      <div className="flex justify-between text-xs text-muted-foreground px-2">
                        <span>9:30</span>
                        <span>12:00</span>
                        <span>16:00</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="p-2 rounded bg-muted text-center text-xs">
                          <p className="text-muted-foreground">High</p>
                          <p className="font-bold">5,025</p>
                        </div>
                        <div className="p-2 rounded bg-muted text-center text-xs">
                          <p className="text-muted-foreground">Low</p>
                          <p className="font-bold">4,985</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trades Preview */}
                  <div className="aspect-[9/16] bg-gradient-to-b from-background to-muted rounded-2xl border-2 overflow-hidden">
                    <div className="p-4 border-b bg-muted/50">
                      <span className="font-bold">{lang === "ar" ? "الصفقات" : "Trades"}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-2 rounded-lg bg-muted flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">SPX</span>
                          </div>
                          <span className="text-xs text-green-500">+$250</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {lang === "ar" ? "امسح للتحميل" : "Scan to Download"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-40 w-40 bg-white rounded-lg flex items-center justify-center border-2">
                  <div className="text-center">
                    <QrCode className="h-24 w-24 text-gray-400 mx-auto" />
                    <p className="text-xs text-muted-foreground mt-2">QR Code</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {lang === "ar" 
                    ? "امسح الرمز بكاميرا هاتفك للوصول للتطبيق"
                    : "Scan with your phone camera to access the app"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Login Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLoginDialog(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {showRegister ? (lang === "ar" ? "إنشاء حساب جديد" : "Create Account") : (lang === "ar" ? "تسجيل الدخول" : "Login")}
              </CardTitle>
              <CardDescription>
                {showRegister 
                  ? (lang === "ar" ? "أنشئ حسابك للوصول إلى البوت" : "Create your account to access the bot")
                  : (lang === "ar" ? "سجل دخولك للوصول إلى البوت" : "Login to access the bot")
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showRegister ? (
                <>
                  {/* Login Form */}
                  <div className="space-y-2">
                    <Label>{t.email}</Label>
                    <Input 
                      type="email" 
                      placeholder="admin@tradingbot.com"
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.password}</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  <Button className="w-full" onClick={handleLogin} disabled={loginLoading}>
                    {loginLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                    {t.login}
                  </Button>
                  <div className="text-center">
                    <Button variant="link" size="sm" onClick={() => setShowRegister(true)}>
                      {t.noAccount} {t.createAccount}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Register Form */}
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "الاسم" : "Name"}</Label>
                    <Input 
                      placeholder={lang === "ar" ? "اسمك" : "Your name"}
                      value={registerName} 
                      onChange={(e) => setRegisterName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.email}</Label>
                    <Input 
                      type="email" 
                      placeholder="your@email.com"
                      value={registerEmail} 
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.password}</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={registerPassword} 
                      onChange={(e) => setRegisterPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.confirmPassword}</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={registerConfirmPassword} 
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                    />
                  </div>
                  <Button className="w-full" onClick={handleRegister} disabled={registerLoading}>
                    {registerLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <User className="h-4 w-4 mr-2" />}
                    {t.createAccount}
                  </Button>
                  <div className="text-center">
                    <Button variant="link" size="sm" onClick={() => setShowRegister(false)}>
                      {t.hasAccount} {t.login}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
