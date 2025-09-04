#!/bin/bash

# 🧹 Community Coin - E2E Environment Cleanup Script
# This script stops all Docker containers and cleans up resources

set -e

echo "🧹 Community Coin - E2E Environment Cleanup"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to stop and remove containers
stop_container() {
    local container_name=$1
    if docker ps -q -f name="$container_name" | grep -q .; then
        print_status "Stopping container: $container_name"
        docker stop "$container_name" >/dev/null 2>&1 || true
        docker rm "$container_name" >/dev/null 2>&1 || true
        print_success "Stopped and removed: $container_name"
    else
        print_warning "Container not found or already stopped: $container_name"
    fi
}

# Function to stop containers by image pattern
stop_containers_by_image() {
    local image_pattern=$1
    local containers=$(docker ps -q --filter ancestor="$image_pattern" 2>/dev/null || true)
    if [ -n "$containers" ]; then
        print_status "Stopping containers with image pattern: $image_pattern"
        echo "$containers" | xargs docker stop >/dev/null 2>&1 || true
        echo "$containers" | xargs docker rm >/dev/null 2>&1 || true
        print_success "Stopped containers with pattern: $image_pattern"
    fi
}

# Function to stop Docker Compose services
stop_compose_services() {
    local compose_file=$1
    local project_name=$2
    
    if [ -f "$compose_file" ]; then
        print_status "Stopping Docker Compose services from: $compose_file"
        if [ -n "$project_name" ]; then
            docker-compose -f "$compose_file" -p "$project_name" down -v --remove-orphans >/dev/null 2>&1 || true
        else
            docker-compose -f "$compose_file" down -v --remove-orphans >/dev/null 2>&1 || true
        fi
        print_success "Stopped Docker Compose services"
    fi
}

print_status "🛑 Stopping all Community Coin related Docker containers..."

# Stop specific containers by name
CONTAINER_NAMES=(
    "solana-validator"
    "solana-dev" 
    "community_coin_server"
    "community_coin_postgres"
    "community_coin_redis"
    "community_coin_prometheus"
    "community_coin_grafana"
)

for container in "${CONTAINER_NAMES[@]}"; do
    stop_container "$container"
done

# Stop containers by image patterns
IMAGE_PATTERNS=(
    "server_rust"
    "contracts-solana-dev"
    "solanalabs/solana"
    "postgres:15-alpine"
    "redis:7-alpine"
    "prom/prometheus"
    "grafana/grafana"
)

for pattern in "${IMAGE_PATTERNS[@]}"; do
    stop_containers_by_image "$pattern"
done

# Stop Docker Compose services
print_status "🐳 Stopping Docker Compose services..."

# Stop contracts compose services
if [ -d "contracts" ]; then
    cd contracts
    stop_compose_services "docker-compose.yml" "contracts"
    cd ..
fi

# Stop server compose services  
if [ -d "server_rust" ]; then
    cd server_rust
    stop_compose_services "docker-compose.yml" "server_rust"
    stop_compose_services "docker-compose.prod.yml" "server_rust"
    cd ..
fi

# Clean up any orphaned containers
print_status "🧽 Cleaning up orphaned containers..."
docker container prune -f >/dev/null 2>&1 || true

# Clean up unused networks
print_status "🌐 Cleaning up unused networks..."
docker network prune -f >/dev/null 2>&1 || true

# Clean up unused volumes (optional - commented out to preserve data)
# print_status "💾 Cleaning up unused volumes..."
# docker volume prune -f >/dev/null 2>&1 || true

# Show remaining containers
print_status "📋 Remaining Docker containers:"
if docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep -v "NAMES" | grep -q .; then
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
else
    print_success "No containers are currently running"
fi

# Kill any background processes that might be running
print_status "🔪 Killing background processes..."
pkill -f "solana-test-validator" >/dev/null 2>&1 || true
pkill -f "server_rust" >/dev/null 2>&1 || true
pkill -f "anchor" >/dev/null 2>&1 || true

print_success "✅ Cleanup completed!"
print_status "💡 If you want to clean up Docker images as well, run:"
print_status "   docker image prune -a"
print_status "💡 If you want to clean up volumes (⚠️  will delete data), run:"
print_status "   docker volume prune -f"

echo ""
echo "🎉 Environment cleanup complete! You can now run setup-localnet-e2e.sh again." 