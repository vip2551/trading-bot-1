# 🚀 Trading Bot Pro - دليل النشر

## المتطلبات

- Ubuntu 20.04+ أو类似的 Linux distribution
- Bun Runtime
- PostgreSQL 13+
- (اختياري) IB Gateway للتداول الحقيقي

---

## 📦 خطوات النشر على Vultr

### 1. تثبيت المتطلبات

```bash
# تثبيت Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# تثبيت PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# تثبيت Git
sudo apt install git -y
```

### 2. إعداد قاعدة البيانات

```bash
# إنشاء قاعدة البيانات
sudo -u postgres psql -c "CREATE DATABASE trading_bot;"
sudo -u postgres psql -c "CREATE USER trading_user WITH PASSWORD 'كلمة_مرور_قوية';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE trading_bot TO trading_user;"
```

### 3. تحميل المشروع

```bash
cd /root
git clone https://github.com/vip2551/trading-bot-1.git trading-bot-pro-main
cd trading-bot-pro-main
```

### 4. إعداد البيئة

```bash
# نسخ ملف البيئة
cp .env.example .env

# تعديل الملف
nano .env
```

**أضف:**
```
DATABASE_URL="postgresql://trading_user:كلمة_مرور_قوية@localhost:5432/trading_bot"
NEXTAUTH_SECRET="مفتاح_سري_طويل_جداً"
NEXTAUTH_URL="http://عنوان_السيرفر:3000"
```

### 5. تثبيت وتشغيل

```bash
# تثبيت الحزم
bun install

# تشغيل البوت
bash start-server.sh
```

---

## 🔄 إعداد التشغيل التلقائي (Systemd)

```bash
# نسخ ملف الخدمة
sudo cp trading-bot.service /etc/systemd/system/

# تفعيل الخدمة
sudo systemctl daemon-reload
sudo systemctl enable trading-bot
sudo systemctl start trading-bot

# التحقق من الحالة
sudo systemctl status trading-bot
```

### أوامر التحكم

```bash
# إيقاف
sudo systemctl stop trading-bot

# إعادة التشغيل
sudo systemctl restart trading-bot

# عرض السجلات
sudo journalctl -u trading-bot -f
```

---

## ⚠️ ملاحظات مهمة

### اتصال IB
- ابقِ IB Gateway مفتوحاً للتداول الحقيقي
- تأكد من إعدادات API في TWS/Gateway

### قاعدة البيانات
- تأكد من DATABASE_URL صحيح في .env
- استخدم كلمة مرور قوية

### الأمان
- غيّر NEXTAUTH_SECRET إلى قيمة عشوائية
- لا تشارك ملف .env

---

## 🔧 استكشاف الأخطاء

### البوت لا يعمل
```bash
# تحقق من السجلات
sudo journalctl -u trading-bot -n 50

# تحقق من المنفذ
sudo netstat -tlnp | grep 3000

# تحقق من قاعدة البيانات
sudo -u postgres psql -c "\l"
```

### مشكلة في Prisma
```bash
cd /root/trading-bot-pro-main
bunx prisma generate
bunx prisma db push
```

---

## 📞 الدعم

- GitHub: https://github.com/vip2551/trading-bot-1
