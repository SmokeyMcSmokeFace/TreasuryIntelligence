#!/bin/bash
# deploy.sh — run on the EC2 server to deploy latest from GitHub
# Usage: cd /var/www/treasury && bash deploy.sh

set -e

APP_DIR="/var/www/treasury"
APP_NAME="treasury-platform"

echo "==> Deploying Treasury Intelligence Platform"
echo "    $(date)"

cd "$APP_DIR"

# Ensure .env.local exists (never pulled from git)
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found. Copy .env.example to .env.local and fill in values."
  exit 1
fi

echo "--> Pulling latest code..."
git pull origin main

echo "--> Installing dependencies..."
npm ci

echo "--> Building..."
npm run build

echo "--> Ensuring data directory exists..."
mkdir -p data

echo "--> Restarting app via PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  pm2 start ecosystem.config.js
fi

pm2 save

echo "==> Deploy complete."
pm2 status "$APP_NAME"
