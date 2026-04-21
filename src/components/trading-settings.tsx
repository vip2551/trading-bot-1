'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  TrendingUp, 
  Shield, 
  MessageCircle, 
  Clock,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Bot,
  DollarSign
} from 'lucide-react';

interface Settings {
  accountType: string;
  tradingMode: string;
  defaultQuantity: number;
  maxRiskPerTrade: number;
  positionSizeMode: string;
  positionSizePercent: number;
  positionSizeAmount: number;
  maxOpenPositions: number;
  maxDailyLoss: number;
  allowMultipleTrades: boolean;
  defaultStopLoss: number | null;
  defaultTakeProfit: number | null;
  trailingStopDefault: number | null;
  telegramEnabled: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  autoTradingEnabled: boolean;
  autoTradingStartTime: string;
  autoTradingEndTime: string;
  ibHost: string;
  ibPort: number;
  ibClientId: number;
  ibConnected: boolean;
  contractSizeMode: string;
  fixedContracts: number;
  minContracts: number;
  maxContracts: number;
  activeSymbols: string;
  updatedAt: string;
}

export function TradingSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // جلب الإعدادات
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // حفظ الإعدادات
  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح! ✓' });
        // تحديث الإعدادات المحلية
        setSettings(data.settings);
      } else {
        setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  // تحديث قيمة معينة
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">جاري تحميل الإعدادات...</span>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8 text-red-500">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>فشل تحميل الإعدادات</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات التداول
            </CardTitle>
            <CardDescription>
              تخصيص إعدادات البوت حسب احتياجاتك
            </CardDescription>
          </div>
          <div className="text-xs text-muted-foreground">
            آخر تحديث: {new Date(settings.updatedAt).toLocaleString('ar-SA')}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="trading" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="trading" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">التداول</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">المخاطر</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">الإشعارات</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">الأتمتة</span>
            </TabsTrigger>
          </TabsList>

          {/* التداول */}
          <TabsContent value="trading" className="space-y-6">
            {/* وضع التداول */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                وضع التداول
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الحساب</Label>
                  <Select
                    value={settings.accountType}
                    onValueChange={(value) => updateSetting('accountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIMULATION">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">●</span>
                          محاكاة (بدون اتصال)
                        </div>
                      </SelectItem>
                      <SelectItem value="PAPER">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500">●</span>
                          Paper Trading (تدريب)
                        </div>
                      </SelectItem>
                      <SelectItem value="LIVE">
                        <div className="flex items-center gap-2">
                          <span className="text-red-500">●</span>
                          LIVE (حقيقي)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>استراتيجية التداول</Label>
                  <Select
                    value={settings.tradingMode}
                    onValueChange={(value) => updateSetting('tradingMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSERVATIVE">
                        <div className="flex flex-col">
                          <span>محافظ</span>
                          <span className="text-xs text-muted-foreground">مخاطر أقل، أرباح مستقرة</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="BALANCED">
                        <div className="flex flex-col">
                          <span>متوازن</span>
                          <span className="text-xs text-muted-foreground">توازن بين المخاطر والعوائد</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="AGGRESSIVE">
                        <div className="flex flex-col">
                          <span>عدواني</span>
                          <span className="text-xs text-muted-foreground">مخاطر أعلى، عوائد أكبر</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* حجم الصفقة */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                حجم الصفقة
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>عدد العقود الافتراضي</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.defaultQuantity}
                    onChange={(e) => updateSetting('defaultQuantity', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الحد الأقصى للمخاطرة ($)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={settings.maxRiskPerTrade}
                    onChange={(e) => updateSetting('maxRiskPerTrade', parseFloat(e.target.value) || 100)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>وضع تحديد الحجم</Label>
                  <Select
                    value={settings.positionSizeMode}
                    onValueChange={(value) => updateSetting('positionSizeMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">ثابت</SelectItem>
                      <SelectItem value="PERCENTAGE">نسبة من المحفظة</SelectItem>
                      <SelectItem value="RISK_BASED">حسب المخاطرة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {settings.positionSizeMode === 'PERCENTAGE' && (
                <div className="space-y-2">
                  <Label>نسبة المحفظة (%)</Label>
                  <Input
                    type="number"
                    min={0.5}
                    max={100}
                    step={0.5}
                    value={settings.positionSizePercent}
                    onChange={(e) => updateSetting('positionSizePercent', parseFloat(e.target.value) || 5)}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* إدارة المخاطر */}
          <TabsContent value="risk" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                حدود المخاطر
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأقصى للصفقات المفتوحة</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={settings.maxOpenPositions}
                    onChange={(e) => updateSetting('maxOpenPositions', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الحد الأقصى للخسارة اليومية ($)</Label>
                  <Input
                    type="number"
                    min={50}
                    value={settings.maxDailyLoss}
                    onChange={(e) => updateSetting('maxDailyLoss', parseFloat(e.target.value) || 500)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>وقف الخسارة الافتراضي (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={settings.defaultStopLoss || ''}
                    onChange={(e) => updateSetting('defaultStopLoss', parseFloat(e.target.value) || null)}
                    placeholder="اختياري"
                  />
                </div>

                <div className="space-y-2">
                  <Label>جني الأرباح الافتراضي (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={settings.defaultTakeProfit || ''}
                    onChange={(e) => updateSetting('defaultTakeProfit', parseFloat(e.target.value) || null)}
                    placeholder="اختياري"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الوقف المتحرك الافتراضي (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    step={0.5}
                    value={settings.trailingStopDefault || ''}
                    onChange={(e) => updateSetting('trailingStopDefault', parseFloat(e.target.value) || null)}
                    placeholder="اختياري"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label>السماح بصفقات متعددة</Label>
                    <p className="text-sm text-muted-foreground">
                      السماح بأكثر من صفقة في نفس الوقت
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowMultipleTrades}
                    onCheckedChange={(checked) => updateSetting('allowMultipleTrades', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* الإشعارات */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-cyan-500" />
                إشعارات Telegram
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
                <div>
                  <Label>تفعيل إشعارات Telegram</Label>
                  <p className="text-sm text-muted-foreground">
                    استلام تنبيهات الصفقات عبر Telegram
                  </p>
                </div>
                <Switch
                  checked={settings.telegramEnabled}
                  onCheckedChange={(checked) => updateSetting('telegramEnabled', checked)}
                />
              </div>

              {settings.telegramEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bot Token</Label>
                    <Input
                      type="password"
                      value={settings.telegramBotToken || ''}
                      onChange={(e) => updateSetting('telegramBotToken', e.target.value)}
                      placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Chat ID</Label>
                    <Input
                      value={settings.telegramChatId || ''}
                      onChange={(e) => updateSetting('telegramChatId', e.target.value)}
                      placeholder="-1001234567890"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* الأتمتة */}
          <TabsContent value="automation" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                التداول التلقائي
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
                <div>
                  <Label>تفعيل التداول التلقائي</Label>
                  <p className="text-sm text-muted-foreground">
                    تنفيذ الصفقات تلقائياً عند استقبال إشارات TradingView
                  </p>
                </div>
                <Switch
                  checked={settings.autoTradingEnabled}
                  onCheckedChange={(checked) => updateSetting('autoTradingEnabled', checked)}
                />
              </div>

              {settings.autoTradingEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وقت البدء</Label>
                    <Input
                      type="time"
                      value={settings.autoTradingStartTime}
                      onChange={(e) => updateSetting('autoTradingStartTime', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>وقت الانتهاء</Label>
                    <Input
                      type="time"
                      value={settings.autoTradingEndTime}
                      onChange={(e) => updateSetting('autoTradingEndTime', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* إعدادات IB */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">إعدادات Interactive Brokers</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input
                    value={settings.ibHost}
                    onChange={(e) => updateSetting('ibHost', e.target.value)}
                    placeholder="127.0.0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={settings.ibPort}
                    onChange={(e) => updateSetting('ibPort', parseInt(e.target.value) || 7497)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    type="number"
                    value={settings.ibClientId}
                    onChange={(e) => updateSetting('ibClientId', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <div className={`h-3 w-3 rounded-full ${settings.ibConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  حالة الاتصال: {settings.ibConnected ? 'متصل' : 'غير متصل'}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* رسالة الحفظ */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* زر الحفظ */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة تحميل
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
