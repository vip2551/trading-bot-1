#!/bin/bash

# ============================================
# Trading Bot VPS Setup Script
# تشغيل هذا السكربت على VPS
# ============================================

echo "🚀 Starting Trading Bot VPS Setup..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
apt update && apt upgrade -y
apt install -y curl wget unzip git

# 2. Install Bun (fastest JavaScript runtime)
echo "🔧 Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# 3. Install Node.js (backup)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Create bot directory
echo "📁 Creating bot directory..."
mkdir -p /opt/trading-bot
cd /opt/trading-bot

# 5. Download bot files
echo "⬇️ Downloading bot files..."
# You need to upload the bot files first or download from your server
# wget https://your-server.com/trading-bot-vps-final.tar.gz
# tar -xzf trading-bot-vps-final.tar.gz

# 6. Install bot dependencies
echo "📦 Installing bot dependencies..."
bun install

# 7. Setup database
echo "🗄️ Setting up database..."
bun run db:push

# 8. Create admin user
echo "👤 Creating admin user..."
bun run scripts/create-admin.ts

# 9. Create systemd service for the bot
echo "🔧 Creating systemd service..."
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

# 10. Enable and start the bot
systemctl daemon-reload
systemctl enable trading-bot
systemctl start trading-bot

# 11. Open firewall port
echo "🔥 Configuring firewall..."
ufw allow 3000
ufw allow 7497
ufw allow 4001
ufw allow 4002

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start IB Gateway on this VPS"
echo "2. Login to IB Gateway with your credentials"
echo "3. Open bot at: http://$(curl -s ifconfig.me):3000"
echo "4. Go to 'Connection' tab"
echo "5. Select 'Paper Trading' mode"
echo "6. Click 'Connect Now' button"
echo ""
