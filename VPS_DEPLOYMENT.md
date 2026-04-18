# 🖥️ VPS Deployment Guide

## دليل نشر البوت على VPS الخاص بك (66.135.0.8)

---

## 📋 المتطلبات

1. **VPS** - IP: 66.135.0.8
2. **IB Gateway** - مثبت على VPS أو جهاز محلي
3. **Docker** (اختياري) - لتسهيل الإدارة
4. **Domain** (اختياري) - للوصول الآمن

---

## 🚀 الخطوة 1: تجهيز VPS

### 1. الاتصال بالسيرفر
```bash
ssh root@66.135.0.8
# أو
ssh user@66.135.0.8
```

### 2. تثبيت المتطلبات
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 20
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# تثبيت PM2 (لإدارة العمليات)
npm install -g pm2

# تثبيت Nginx (كـ reverse proxy)
sudo apt install nginx -y
```

---

## 📁 الخطوة 2: رفع البوت إلى VPS

### الطريقة الأولى: SCP
```bash
# من جهازك المحلي
scp trading-bot-backup-*.tar.gz user@66.135.0.8:/home/user/
```

### الطريقة الثانية: Git Clone
```bash
# على VPS
cd /opt
git clone https://github.com/YOUR_USERNAME/trading-bot.git
cd trading-bot
```

### استخراج الملفات
```bash
# على VPS
cd /home/user
tar -xzvf trading-bot-backup-*.tar.gz
mv my-project /opt/trading-bot
cd /opt/trading-bot
```

---

## ⚙️ الخطوة 3: إعداد البوت

### 1. تثبيت التبعيات
```bash
cd /opt/trading-bot
bun install
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة البيانات
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
NEXTAUTH_SECRET="your-super-secret-key-here-use-openssl-rand-hex-32"
NEXTAUTH_URL="http://66.135.0.8:3000"

# IB Gateway Settings
IB_HOST=127.0.0.1
IB_PORT=7497
IB_CLIENT_ID=1
ACCOUNT_TYPE=PAPER

# Telegram (اختياري)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# VPS Settings
VPS_HOST=66.135.0.8
VPS_SSH_PORT=22
VPS_BOT_PORT=3000
```

---

## 🔄 الخطوة 4: إعداد PM2

### 1. إنشاء ملف التكوين
```bash
nano ecosystem.config.js
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
# تشغيل مع PM2
pm2 start ecosystem.config.js

# حفظ الإعدادات
pm2 save

# تشغيل تلقائي عند إعادة التشغيل
pm2 startup
```

---

## 🌐 الخطوة 5: إعداد Nginx (Reverse Proxy)

### 1. إنشاء ملف التكوين
```bash
sudo nano /etc/nginx/sites-available/trading-bot
```

أضف:
```nginx
server {
    listen 80;
    server_name 66.135.0.8;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 2. تفعيل الموقع
```bash
sudo ln -s /etc/nginx/sites-available/trading-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔐 الخطوة 6: إعداد SSL (اختياري لكن موصى به)

### باستخدام Let's Encrypt
```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة (يجب أن يكون لديك domain)
sudo certbot --nginx -d yourdomain.com

# أو استخدام self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=66.135.0.8"
```

---

## 📊 الخطوة 7: إعداد IB Gateway على VPS

### 1. تثبيت IB Gateway
```bash
# تحميل IB Gateway
cd /opt
wget https://download2.interactivebrokers.com/installers/ibgateway/stable-standalone/ibgateway-stable-standalone-linux-x64.sh
chmod +x ibgateway-stable-standalone-linux-x64.sh
./ibgateway-stable-standalone-linux-x64.sh
```

### 2. تشغيل IB Gateway
```bash
# تثبيت xvfb للواجهة الرسومية
sudo apt install xvfb -y

# تشغيل IB Gateway
xvfb-run /opt/IBGateway/ibgateway &
```

### 3. إعداد IB Gateway للـ API
- افتح IB Gateway
- اذهب إلى Configure → Settings → API → Settings
- فعّل "Enable ActiveX and Socket Clients"
- أضف IP المسموح (127.0.0.1 أو 66.135.0.8)
- حدد Port: 7497 (Paper) أو 7496 (Live)

---

## 🔥 الخطوة 8: إعداد Firewall

```bash
# السماح بالمنافذ المطلوبة
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3000/tcp    # Bot
sudo ufw allow 7496/tcp    # IB Gateway Live
sudo ufw allow 7497/tcp    # IB Gateway Paper
sudo ufw allow 4001/tcp    # IB Gateway API

# تفعيل Firewall
sudo ufw enable
```

---

## 📱 الخطوة 9: ربط TradingView

### Webhook URL
```
http://66.135.0.8/api/webhook/tradingview
```

### أو مع Domain
```
https://yourdomain.com/api/webhook/tradingview
```

### Message Format
```json
{
  "symbol": "{{ticker}}",
  "action": "BUY",
  "direction": "CALL",
  "price": {{close}},
  "quantity": 1,
  "trailing_stop": 15,
  "secret": "YOUR_WEBHOOK_SECRET"
}
```

---

## 🧪 اختبار البوت

### 1. Health Check
```bash
curl http://66.135.0.8:3000/api/health
```

### 2. Webhook Test
```bash
curl -X POST http://66.135.0.8:3000/api/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "SPX",
    "action": "BUY",
    "direction": "CALL",
    "price": 5000,
    "secret": "YOUR_SECRET"
  }'
```

---

## 📋 أوامر PM2 المفيدة

```bash
# عرض الحالة
pm2 status

# عرض السجلات
pm2 logs trading-bot

# إعادة التشغيل
pm2 restart trading-bot

# إيقاف البوت
pm2 stop trading-bot

# حذف البوت
pm2 delete trading-bot

# مراقبة الموارد
pm2 monit
```

---

## 🔄 تحديث البوت

```bash
cd /opt/trading-bot

# سحب التحديثات
git pull

# أو رفع ملف جديد
# scp trading-bot-new.tar.gz user@66.135.0.8:/opt/

# تثبيت التبعيات الجديدة
bun install

# تحديث قاعدة البيانات
bun run db:push

# إعادة التشغيل
pm2 restart trading-bot
```

---

## 📊 مراقبة الأداء

### 1. تثبيت مراقب
```bash
pm2 install pm2-logrotate
```

### 2. إعداد التنبيهات
```bash
# إعداد البريد الإلكتروني للتنبيهات
pm2 set pm2:email your-email@example.com
```

---

## ⚠️ ملاحظات مهمة

### 1. الأمان
- ✅ غيّر كلمة مرور SSH الافتراضية
- ✅ استخدم SSH Keys بدلاً من كلمة المرور
- ✅ فعّل Firewall
- ✅ استخدم HTTPS في الإنتاج
- ✅ احتفظ بنسخ احتياطية منتظمة

### 2. IB Gateway
- ✅ تأكد من تشغيل IB Gateway قبل البوت
- ✅ استخدم Paper Trading للتجربة
- ✅ راقب السجلات للتأكد من الاتصال

### 3. قاعدة البيانات
- ✅ النسخ الاحتياطي اليومي
- ✅ مراقبة حجم الملف

---

## ✅ قائمة التحقق

- [ ] VPS مُعد ويمكن الوصول إليه
- [ ] البوت مرفوع على VPS
- [ ] التبعيات مثبتة
- [ ] قاعدة البيانات جاهزة
- [ ] المتغيرات البيئية مُعدة
- [ ] PM2 يعمل
- [ ] Nginx مُعد
- [ ] IB Gateway يعمل
- [ ] Firewall مُعد
- [ ] TradingView مربوط
- [ ] اختبار Webhook ناجح

---

## 🆘 استكشاف الأخطاء

### البوت لا يعمل
```bash
# تحقق من السجلات
pm2 logs trading-bot

# تحقق من المنفذ
lsof -i :3000

# تحقق من العمليات
ps aux | grep bun
```

### مشكلة الاتصال بـ IB
```bash
# تحقق من IB Gateway
ps aux | grep ibgateway

# تحقق من المنفذ
lsof -i :7497
```

### مشكلة Nginx
```bash
# تحقق من التكوين
sudo nginx -t

# تحقق من السجلات
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 الدعم

للمساعدة، راجع:
- سجلات البوت: `pm2 logs trading-bot`
- سجلات النظام: `journalctl -u pm2-root`
- حالة النظام: `pm2 monit`
