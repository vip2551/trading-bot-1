# 🤖 Trading Bot Pro

بوت تداول ذكي متكامل مع دعم منصات متعددة.

## ✨ المميزات

- 📊 **لوحة تحكم شاملة** - مراقبة الصفقات والإحصائيات
- 🔗 **تكامل متعدد المنصات** - Binance, Coinbase, Exness
- 🎯 **اختيار الاسترايك التلقائي** - أوضاع متعددة (OFFSET, DELTA, PRICE)
- 🤖 **تداول تلقائي** - مع ذكاء اصطناعي
- 📱 **إشعارات Telegram** - تنبيهات فورية
- 📈 **تحليل السوق** - RSI, MACD, Bollinger, EMA, ADX
- 🔐 **نظام مصادقة** - تسجيل دخول وبطاقات اشتراك
- 💾 **نسخ احتياطي** - تصدير واستيراد البيانات

## 🚀 التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/trading-bot-pro.git
cd trading-bot-pro

# تثبيت التبعيات
bun install

# إعداد قاعدة البيانات
bun run db:push

# تشغيل الخادم
bun run dev
```

## ⚙️ الإعداد

1. انسخ ملف البيئة:
```bash
cp .env.example .env
```

2. أضف مفاتيح API الخاصة بك:
```env
# Binance
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret

# Coinbase
COINBASE_API_KEY=your_key
COINBASE_API_SECRET=your_secret
COINBASE_PASSPHRASE=your_passphrase

# Telegram
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

## 📂 هيكل المشروع

```
src/
├── app/              # صفحات Next.js
├── components/       # مكونات React
├── lib/              # خدمات التكامل
│   ├── binance-service.ts
│   ├── coinbase-service.ts
│   └── exness-service.ts
prisma/               # قاعدة البيانات
mini-services/        # خدمات WebSocket
```

## 🛠️ التقنيات

- **Frontend:** Next.js 16, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** Prisma, SQLite
- **Integrations:** Binance, Coinbase, Exness APIs

## 📝 الترخيص

MIT License
