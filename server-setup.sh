#!/bin/bash

# Server Setup Script for Ubuntu VPS
# Run this script on your VPS to install required dependencies
# Usage: curl -sSL https://raw.githubusercontent.com/your-repo/server-setup.sh | bash
# Or: bash server-setup.sh

set -e

echo "========================================"
echo "  Ecommerce Backend - Server Setup"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Update system
echo "Updating system packages..."
apt-get update && apt-get upgrade -y
print_status "System updated"

# Install essential packages
echo "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    htop \
    ufw \
    fail2ban \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release
print_status "Essential packages installed"

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    print_status "Docker installed"
else
    print_status "Docker already installed"
fi

# Install Docker Compose (plugin)
echo "Checking Docker Compose..."
if docker compose version &> /dev/null; then
    print_status "Docker Compose plugin available"
else
    echo "Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin
    print_status "Docker Compose plugin installed"
fi

# Configure firewall
echo "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
print_status "Firewall configured (SSH, HTTP, HTTPS allowed)"

# Configure fail2ban
echo "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban
print_status "Fail2ban configured"

# Create application directory
APP_DIR="/opt/ecommerce-backend"
echo "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/nginx/ssl
mkdir -p $APP_DIR/backups
print_status "Application directory created"

# Set permissions
chown -R $USER:$USER $APP_DIR

echo ""
echo "========================================"
echo "  Server Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Copy your project files to: $APP_DIR"
echo "     scp -r ./* root@YOUR_SERVER_IP:$APP_DIR/"
echo ""
echo "  2. SSH into your server:"
echo "     ssh root@YOUR_SERVER_IP"
echo ""
echo "  3. Navigate to the app directory:"
echo "     cd $APP_DIR"
echo ""
echo "  4. Configure environment:"
echo "     nano .env.production"
echo ""
echo "  5. Deploy:"
echo "     ./deploy.sh deploy"
echo ""
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"
echo ""
