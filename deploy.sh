#!/bin/bash

# Ecommerce Backend Deployment Script
# Usage: ./deploy.sh [command]
# Commands: setup, deploy, logs, status, stop, restart, backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ecommerce-backend"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if .env.production exists
check_env() {
    if [ ! -f .env.production ]; then
        print_error ".env.production file not found!"
        print_warning "Please copy .env.production.example and configure it:"
        echo "  cp .env.production.example .env.production"
        echo "  nano .env.production"
        exit 1
    fi
}

# Setup command - first time setup
setup() {
    print_status "Setting up $APP_NAME..."

    # Create required directories
    mkdir -p nginx/ssl

    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        print_warning ".env.production not found. Creating from template..."
        if [ -f .env.production.example ]; then
            cp .env.production.example .env.production
        fi
        print_warning "Please edit .env.production with your settings!"
        print_warning "Generate secure secrets with: openssl rand -base64 64"
    fi

    print_status "Setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env.production with your settings"
    echo "  2. Run: ./deploy.sh deploy"
}

# Deploy command
deploy() {
    check_env
    print_status "Deploying $APP_NAME..."

    # Load environment variables
    export $(grep -v '^#' .env.production | xargs)

    # Build and start containers
    docker compose -f $DOCKER_COMPOSE_FILE --env-file .env.production up -d --build

    print_status "Waiting for services to be healthy..."
    sleep 10

    # Check status
    docker compose -f $DOCKER_COMPOSE_FILE ps

    print_status "Deployment complete!"
    echo ""
    echo "API is available at: http://$(hostname -I | awk '{print $1}')/api/v1"
}

# Logs command
logs() {
    docker compose -f $DOCKER_COMPOSE_FILE logs -f "$@"
}

# Status command
status() {
    echo "Container Status:"
    docker compose -f $DOCKER_COMPOSE_FILE ps
    echo ""
    echo "Resource Usage:"
    docker stats --no-stream ecommerce_api ecommerce_db ecommerce_nginx 2>/dev/null || true
}

# Stop command
stop() {
    print_status "Stopping $APP_NAME..."
    docker compose -f $DOCKER_COMPOSE_FILE down
    print_status "Stopped!"
}

# Restart command
restart() {
    print_status "Restarting $APP_NAME..."
    docker compose -f $DOCKER_COMPOSE_FILE restart
    print_status "Restarted!"
}

# Backup command
backup() {
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

    mkdir -p $BACKUP_DIR

    print_status "Creating database backup..."

    # Load environment variables
    export $(grep -v '^#' .env.production | xargs)

    docker exec ecommerce_db pg_dump -U $DB_USERNAME $DB_NAME > $BACKUP_FILE

    # Compress the backup
    gzip $BACKUP_FILE

    print_status "Backup created: ${BACKUP_FILE}.gz"
}

# Seed command - create super admin
seed() {
    print_status "Running database seed..."
    docker exec ecommerce_api node dist/database/seeds/create-super-admin.js || \
    docker exec ecommerce_api npm run seed:super-admin
    print_status "Seed complete!"
}

# Init command - create tables and seed
init() {
    print_status "Initializing database (creating tables and seeding)..."
    docker exec ecommerce_api node dist/database/scripts/init-db.js "$@"
    print_status "Database initialization complete!"
}

# Update command - pull latest and redeploy
update() {
    print_status "Updating $APP_NAME..."

    # Pull latest code (if using git)
    if [ -d .git ]; then
        git pull origin main
    fi

    # Rebuild and restart
    deploy
}

# Help command
help() {
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - First time setup (creates directories and config files)"
    echo "  deploy    - Build and deploy the application"
    echo "  logs      - View container logs (use: logs app, logs postgres, logs nginx)"
    echo "  status    - Show container status and resource usage"
    echo "  stop      - Stop all containers"
    echo "  restart   - Restart all containers"
    echo "  backup    - Create database backup"
    echo "  seed      - Run database seeds (create super admin)"
    echo "  init      - Initialize database (create tables + seed)"
    echo "  update    - Pull latest code and redeploy"
    echo "  help      - Show this help message"
}

# Main script
case "${1:-help}" in
    setup)
        setup
        ;;
    deploy)
        deploy
        ;;
    logs)
        shift
        logs "$@"
        ;;
    status)
        status
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    backup)
        backup
        ;;
    seed)
        seed
        ;;
    init)
        shift
        init "$@"
        ;;
    update)
        update
        ;;
    help|*)
        help
        ;;
esac
