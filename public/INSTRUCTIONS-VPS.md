# تعليمات تشغيل البوت على VPS مع IB Gateway

## المشكلة
البوت على Railway لا يستطيع الاتصال بـ IB Gateway على VPS لأنهم على خوادم مختلفة.

## الحل
تشغيل البوت على نفس VPS الذي يعمل عليه IB Gateway.

---

## الخطوة 1: رفع ملف البوت إلى VPS

### الخيار أ: باستخدام SCP (من جهازك المحلي)
```bash
# على جهازك المحلي (ويندوز مع Git Bash أو PowerShell)
scp trading-bot-vps-final.tar.gz root@66.135.0.8:/root/
```

### الخيار ب: باستخدام SFTP
1. افتح FileZilla أو WinSCP
2. اتصل بـ: `66.135.0.8` (المستخدم: `root`)
3. ارفع ملف `trading-bot-vps-final.tar.gz` إلى `/root/`

### الخيار ج: تحميل مباشر من URL
```bash
# على VPS
wget https://your-server.com/trading-bot-vps-final.tar.gz -O /root/trading-bot-vps-final.tar.gz
```

---

## الخطوة 2: تثبيت المتطلبات على VPS

```bash
# اتصل بـ VPS
ssh root@66.135.0.8

# تحديث النظام
apt update && apt upgrade -y

# تثبيت المتطلبات
apt install -y curl wget git unzip

# تثبيت Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

---

## الخطوة 3: فك ضغط وتثبيت البوت

```bash
# إنشاء مجلد البوت
mkdir -p /opt/trading-bot
cd /opt/trading-bot

# فك ضغط الملف
tar -xzf /root/trading-bot-vps-final.tar.gz

# تثبيت الحزم
bun install

# إعداد قاعدة البيانات
bun run db:push
```

---

## الخطوة 4: إنشاء مستخدم Admin

```bash
# تشغيل سكربت إنشاء Admin
bun run scripts/create-admin.ts

# أو يدوياً:
# Admin: admin@tradingbot.com
# Password: Admin@123456
```

---

## الخطوة 5: تشغيل IB Gateway

```bash
# تشغيل IB Gateway (إذا لم يكن يعمل)
cd /opt/ibgateway
xvfb-run java -jar ibgateway.jar &

# أو باستخدام VNC للدخول اليدوي
x11vnc -display :1 -forever -passwd yourpassword
# ثم اتصل بـ VNC على المنفذ 5900
```

---

## الخطوة 6: تشغيل البوت

```bash
# تشغيل البوت
cd /opt/trading-bot
bun run dev

# أو تشغيل في الخلفية
nohup bun run dev > bot.log 2>&1 &
```

---

## الخطوة 7: الاتصال بـ IB

1. افتح المتصفح: `http://66.135.0.8:3000`
2. سجل الدخول: `admin@tradingbot.com` / `Admin@123456`
3. اذهب إلى تبويب **"الاتصال"**
4. اختر **"Paper Trading"**
5. اضغط **"اتصال الآن"**

---

## تشغيل تلقائي (Systemd Service)

```bash
# إنشاء خدمة systemd
cat > /etc/systemd/system/trading-bot.service << 'EOF'
[Unit]
Description=Trading Bot Pro
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/trading-bot
ExecStart=/root/.bun/bin/bun run dev
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# تفعيل الخدمة
systemctl daemon-reload
systemctl enable trading-bot
systemctl start trading-bot

# التحقق من الحالة
systemctl status trading-bot
```

---

## المنافذ المطلوبة

```bash
# فتح المنافذ في Firewall
ufw allow 3000    # البوت
ufw allow 7497    # IB Paper Trading
ufw allow 7496    # IB Live Trading
ufw allow 5900    # VNC (اختياري)
```

---

## استكشاف الأخطاء

### البوت لا يعمل
```bash
# التحقق من السجلات
journalctl -u trading-bot -f

# أو
tail -f /opt/trading-bot/bot.log
```

### IB Gateway لا يتصل
```bash
# التحقق من المنفذ
ss -tlnp | grep 7497

# إعادة تشغيل IB Gateway
pkill -f ibgateway
cd /opt/ibgateway && xvfb-run java -jar ibgateway.jar &
```

### قاعدة البيانات
```bash
# إعادة إنشاء قاعدة البيانات
cd /opt/trading-bot
bun run db:push
```

---

## ملخص

| العنصر | القيمة |
|--------|--------|
| VPS IP | `66.135.0.8` |
| Bot URL | `http://66.135.0.8:3000` |
| Admin Email | `admin@tradingbot.com` |
| Admin Password | `Admin@123456` |
| IB Paper Port | `7497` |
| IB Live Port | `7496` |
