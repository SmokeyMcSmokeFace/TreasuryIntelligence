#!/bin/bash
# setup-ec2.sh — ONE-TIME setup script for the EC2 server
# Run once as a user with sudo access.
# Tested on Amazon Linux 2023 and Ubuntu 22.04.

set -e

REPO_URL="https://github.com/SmokeyMcSmokeFace/TreasuryIntelligence.git"
APP_DIR="/var/www/treasury"
NODE_VERSION="20"

echo "==> Treasury Intelligence Platform — EC2 Setup"

# ── Node.js ─────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "--> Installing Node.js $NODE_VERSION via nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
  nvm alias default "$NODE_VERSION"
else
  echo "--> Node.js $(node --version) already installed."
fi

# ── PM2 ──────────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "--> Installing PM2..."
  npm install -g pm2
  pm2 startup | tail -1 | bash   # enable PM2 on reboot
fi

# ── App directory ────────────────────────────────────────────────────────────
echo "--> Creating $APP_DIR..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"

# ── Clone repo ───────────────────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "--> Repo already cloned, pulling latest..."
  cd "$APP_DIR" && git pull origin main
else
  echo "--> Cloning repo..."
  git clone "$REPO_URL" "$APP_DIR"
fi

# ── Environment file ─────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env.local" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env.local"
  echo ""
  echo "*** ACTION REQUIRED: Edit $APP_DIR/.env.local and set your values ***"
  echo "    nano $APP_DIR/.env.local"
  echo ""
fi

# ── PM2 log directory ────────────────────────────────────────────────────────
sudo mkdir -p /var/log/pm2
sudo chown "$USER":"$USER" /var/log/pm2

# ── Apache modules ───────────────────────────────────────────────────────────
echo "--> Enabling Apache proxy modules..."
if command -v a2enmod &>/dev/null; then
  # Ubuntu / Debian
  sudo a2enmod proxy proxy_http headers
  VHOST_DIR="/etc/apache2/sites-available"
  VHOST_ENABLE_CMD="sudo a2ensite treasury.tokydoky.com.conf && sudo systemctl reload apache2"
elif [ -d /etc/httpd ]; then
  # Amazon Linux / RHEL — proxy modules usually loaded by default
  VHOST_DIR="/etc/httpd/conf.d"
  VHOST_ENABLE_CMD="sudo systemctl reload httpd"
fi

# ── Apache vhost ─────────────────────────────────────────────────────────────
VHOST_FILE="$VHOST_DIR/treasury.tokydoky.com.conf"
if [ ! -f "$VHOST_FILE" ]; then
  echo "--> Installing Apache vhost..."
  sudo cp "$APP_DIR/apache/treasury.tokydoky.com.conf" "$VHOST_FILE"
  eval "$VHOST_ENABLE_CMD"
else
  echo "--> Apache vhost already exists, skipping."
fi

# ── First deploy ─────────────────────────────────────────────────────────────
echo "--> Running first deploy..."
cd "$APP_DIR"
bash deploy.sh

echo ""
echo "==> Setup complete!"
echo "    Site: http://treasury.tokydoky.com"
echo "    Logs: pm2 logs treasury-platform"
echo "    Status: pm2 status"
