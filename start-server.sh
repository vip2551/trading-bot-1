#!/bin/bash

# Trading Bot Pro - Production Start Script
# Usage: ./start-server.sh

cd /root/trading-bot-pro-main

echo "🚀 Starting Trading Bot Pro..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Please create .env with your configuration"
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
bunx prisma generate

# Build for production
echo "🔨 Building for production..."
bun run build

# Start production server
echo "🚀 Starting production server on 0.0.0.0:3000..."
export HOSTNAME=0.0.0.0
exec bun run start
