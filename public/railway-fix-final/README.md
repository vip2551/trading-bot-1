# 🔧 Railway Fix - الملفات المطلوبة

## 📁 الملفات المعدلة:

1. **prisma/schema.prisma** - تم تغيير sqlite إلى postgresql
2. **nixpacks.toml** - إضافة phase.migrate لإنشاء الجداول
3. **start-railway.sh** - تحسين إنشاء الجداول
4. **src/app/api/setup-db/route.ts** - API جديد لإنشاء الجداول يدوياً

---

## 🚀 خطوات التثبيت:

### 1️⃣ انسخ الملفات إلى مشروعك:
- انسخ محتوى `prisma/schema.prisma` إلى `C:\Users\MOHAMMED\trading-bot-pro\prisma\schema.prisma`
- انسخ محتوى `nixpacks.toml` إلى `C:\Users\MOHAMMED\trading-bot-pro\nixpacks.toml`
- انسخ محتوى `start-railway.sh` إلى `C:\Users\MOHAMMED\trading-bot-pro\start-railway.sh`
- انسخ محتوى `src/app/api/setup-db/route.ts` إلى `C:\Users\MOHAMMED\trading-bot-pro\src\app\api\setup-db\route.ts`

### 2️⃣ ارفع التغييرات:
```bash
cd C:\Users\MOHAMMED\trading-bot-pro
git add .
git commit -m "Fix Railway PostgreSQL setup"
git push origin main --force
```

### 3️⃣ بعد 3 دقائق افتح:
```
https://web-production-63fa6.up.railway.app/api/setup-db
```

### 4️⃣ أرسل POST لإنشاء الجداول:
من المتصفح Console:
```javascript
fetch('/api/setup-db', {method: 'POST'}).then(r => r.json()).then(console.log)
```

### 5️⃣ أنشئ حساب الأدمن:
```javascript
fetch('/api/admin/init', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'admin@tradingbot.com',
    password: 'Admin@123456',
    setupKey: 'trading-bot-admin-2024'
  })
}).then(r => r.json()).then(console.log)
```

---

## ✅ بيانات الدخول:
- البريد: admin@tradingbot.com
- كلمة المرور: Admin@123456
