# 🖥️ Vultr VPS Deployment Guide

## دليل نشر البوت على Vultr VPS

---

## 📋 المتطلبات

1. **حساب Vultr** - [vultr.com](https://www.vultr.com)
2. **رصيد في الحساب** - يبدأ من $5/شهر
3. **IB Gateway** - مثبت على VPS أو جهاز محلي
4. **Domain** (اختياري) - للوصول الآمن

---

## 🚀 الخطوة 1: إنشاء VPS على Vultr

### 1. الدخول إلى Vultr
```
1. اذهب إلى vultr.com
2. سجل الدخول لحسابك
3. اضغط "+" أو "Deploy New Instance"
```

### 2. اختيار الخادم
```
Server Type: Cloud Compute
Location: اختر الأقرب لك
         - New Jersey (للاتصال بـ IB Gateway في أمريكا)
         - Miami
         - Seattle
```

### 3. اختيار النظام
```
OS: Ubuntu 22.04 x64 (موصى به)
   أو Ubuntu 24.04 x64
```

### 4. اختيار المواصفات
```
Plan: $6/month - 1 vCPU, 1GB RAM
     (كافي للبوت و IB Gateway)

أو: $12/month - 1 vCPU, 2GB RAM
     (أفضل للأداء)
```

### 5. إعدادات إضافية
```
Hostname: trading-bot
Label: Trading Bot Server
```

### 6. النشر
```
اضغط "Deploy Now"
انتظر 2-3 دقائق حتى يصبح status = Running
```

---

## 🔑 الخطوة 2: الاتصال بالـ VPS

### 1. الحصول على معلومات الاتصال
```
Vultr Dashboard → Servers → اضغط على السيرفر
ستجد:
- IP Address: مثلاً 66.135.0.8
- Username: root
- Password: (اضغط على أيقونة العين لرؤيتها)
```

### 2. الاتصال عبر SSH
```bash
# من Terminal أو CMD
ssh root@YOUR_VPS_IP

# مثال:
ssh root@66.135.0.8

# أدخل كلمة المرور
```

---

## ⚙️ الخطوة 3: تجهيز VPS

### 1. تحديث النظام
```bash
apt update && apt upgrade -y
```

### 2. تثبيت المتطلبات
```bash
# تثبيت Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# تثبيت Node.js (بديل)
# curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
# apt install -y nodejs

# تثبيت PM2
npm install -g pm2

# تثبيت Nginx
apt install -y nginx

# تثبيت أدوات مفيدة
apt install -y git curl wget nano htop
```

### 3. تثبيت IB Gateway (للتداول الحقيقي)
```bash
# تثبيت Java
apt install -y openjdk-11-jre-headless

# تثبيت xvfb للواجهة الرسومية
apt install -y xvfb

# تحميل IB Gateway
cd /opt
wget https://download2.interactivebrokers.com/installers/ibgateway/stable-standalone/ibgateway-stable-standalone-linux-x64.sh
chmod +x ibgateway-stable-standalone-linux-x64.sh

# تثبيت IB Gateway
./ibgateway-stable-standalone-linux-x64.sh -q

# إنشاء ملف إعداد IB Gateway
mkdir -p ~/Jts
```

---

## 📁 الخطوة 4: رفع البوت

### الطريقة الأولى: SCP
```bash
# من جهازك المحلي
scp /path/to/trading-bot-backup-*.tar.gz root@YOUR_VPS_IP:/root/
```

### الطريقة الثانية: Git Clone
```bash
# على VPS
cd /opt
git clone https://github.com/YOUR_USERNAME/trading-bot.git
```

### استخراج وتجهيز
```bash
# على VPS
cd /root
tar -xzvf trading-bot-backup-*.tar.gz
mv my-project /opt/trading-bot
cd /opt/trading-bot
```

---

## 🔧 الخطوة 5: إعداد البوت

### 1. تثبيت التبعيات
```bash
cd /opt/trading-bot
bun install
```

### 2. إنشاء قاعدة البيانات
```bash
bun run db:push
```

### 3. إعداد المتغيرات البيئية
```bash
nano .env
```

أضف:
```env
# Database
DATABASE_URL="file:./db/production.db"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-change-this"
NEXTAUTH_URL="http://YOUR_VPS_IP:3000"

# IB Gateway
IB_HOST=127.0.0.1
IB_PORT=7497
IB_CLIENT_ID=1
ACCOUNT_TYPE=PAPER

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### 4. توليد مفتاح سري
```bash
openssl rand -hex 32
# انسخ النتيجة وضعها في NEXTAUTH_SECRET
```

---

## 🔄 الخطوة 6: إعداد PM2

### 1. إنشاء ملف التكوين
```bash
nano /opt/trading-bot/ecosystem.config.js
```

أضف:
```javascript
module.exports = {
  apps: [{
    name: 'trading-bot',
    script: 'bun',
    args: 'run start',
    cwd: '/opt/trading-bot',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 2. تشغيل البوت
```bash
cd /opt/trading-bot
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 الخطوة 7: إعداد Nginx

### 1. إنشاء التكوين
```bash
nano /etc/nginx/sites-available/trading-bot
```

أضف:
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. تفعيل الموقع
```bash
ln -s /etc/nginx/sites-available/trading-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 🔥 الخطوة 8: إعداد Firewall

```bash
# السماح بالمنافذ المطلوبة
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # Bot (اختياري إذا استخدمت Nginx)
ufw allow 7496/tcp    # IB Gateway Live
ufw allow 7497/tcp    # IB Gateway Paper

# تفعيل Firewall
ufw enable
```

---

## 🚀 الخطوة 9: تشغيل IB Gateway

### 1. تشغيل IB Gateway
```bash
# تشغيل في الخلفية
xvfb-run /opt/IBGateway/ibgateway &

# أو باستخدام PM2
pm2 start /opt/IBGateway/ibgateway --name ibgateway
```

### 2. إعداد IB Gateway
```
1. افتح IB Gateway على جهازك المحلي أولاً
2. اذهب إلى Configure → Settings → API → Settings
3. فعّل "Enable ActiveX and Socket Clients"
4. أضف IP الـ VPS في Trusted IPs
5. حدد المنفذ: 7497 (Paper) أو 7496 (Live)
```

---

## 📊 الخطوة 10: التحقق من العمل

### 1. فتح البوت في المتصفح
```
http://YOUR_VPS_IP:3000
أو
http://YOUR_VPS_IP (إذا استخدمت Nginx)
```

### 2. Health Check
```bash
curl http://localhost:3000/api/health
```

### 3. مراقبة السجلات
```bash
pm2 logs trading-bot
pm2 monit
```

---

## 🔄 أوامر PM2 المفيدة

```bash
pm2 status              # عرض الحالة
pm2 logs trading-bot    # عرض السجلات
pm2 restart trading-bot # إعادة التشغيل
pm2 stop trading-bot    # إيقاف
pm2 start trading-bot   # تشغيل
pm2 monit               # مراقبة الموارد
pm2 save                # حفظ الإعدادات
```

---

## 💰 تكلفة Vultr

| الخطة | السعر | المواصفات |
|-------|-------|-----------|
| $6/شهر | $0.009/ساعة | 1 vCPU, 1GB RAM, 25GB SSD |
| $12/شهر | $0.018/ساعة | 1 vCPU, 2GB RAM, 55GB SSD |
| $24/شهر | $0.036/ساعة | 2 vCPU, 4GB RAM, 80GB SSD |

**ملاحظة:** الخطة $6/شهر كافية للبوت و IB Gateway

---

## 📱 ربط TradingView

### Webhook URL
```
http://YOUR_VPS_IP/api/webhook/tradingview
```

### Message Format
```json
{
  "symbol": "{{ticker}}",
  "action": "BUY",
  "direction": "CALL",
  "price": {{close}},
  "quantity": 1,
  "secret": "YOUR_WEBHOOK_SECRET"
}
```

---

## 🔄 تحديث البوت

```bash
cd /opt/trading-bot

# من Git
git pull

# من ملف جديد
# scp trading-bot-new.tar.gz root@YOUR_VPS_IP:/opt/

bun install
bun run db:push
pm2 restart trading-bot
```

---

## 🆘 استكشاف الأخطاء

### البوت لا يعمل
```bash
pm2 logs trading-bot
pm2 restart trading-bot
```

### مشكلة الاتصال
```bash
# تحقق من المنافذ
netstat -tulpn | grep LISTEN

# تحقق من Firewall
ufw status
```

### مشكلة الذاكرة
```bash
# إضافة Swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## ✅ قائمة التحقق

- [ ] إنشاء VPS على Vultr
- [ ] الاتصال بـ SSH
- [ ] تحديث النظام
- [ ] تثبيت Bun و PM2 و Nginx
- [ ] رفع البوت
- [ ] تثبيت التبعيات
- [ ] إعداد .env
- [ ] تشغيل قاعدة البيانات
- [ ] تشغيل البوت بـ PM2
- [ ] إعداد Nginx
- [ ] إعداد Firewall
- [ ] تشغيل IB Gateway (اختياري)
- [ ] اختبار Webhook
