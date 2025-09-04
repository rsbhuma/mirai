#!/bin/bash

# Quick cleanup script - stops all Community Coin Docker containers
echo "🧹 Quick cleanup - stopping all containers..."

# Stop all containers with Community Coin related names
docker stop $(docker ps -q --filter name=solana) 2>/dev/null || true
docker stop $(docker ps -q --filter name=community_coin) 2>/dev/null || true
docker stop $(docker ps -q --filter ancestor=server_rust) 2>/dev/null || true
docker stop $(docker ps -q --filter ancestor=contracts-solana-dev) 2>/dev/null || true

# Remove stopped containers
docker container prune -f >/dev/null 2>&1 || true

echo "✅ Quick cleanup done!"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" 