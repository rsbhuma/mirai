#!/bin/bash

echo "🚀 Starting Solana Development Environment..."

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Navigate to contracts directory
cd "$(dirname "$0")"

echo "📦 Building development environment..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🔧 To enter the development environment:"
    echo "   docker-compose exec solana-dev bash"
    echo ""
    echo "📋 Quick commands inside the container:"
    echo "   cd commcoin                              # Navigate to project"
    echo "   ./scripts/setup.sh                      # Setup Solana environment"
    echo "   pnpm install                             # Install dependencies"
    echo "   anchor build                             # Build smart contract"
    echo "   anchor test --skip-local-validator       # Run tests"
    echo ""
    echo "🌐 Services available:"
    echo "   - Solana RPC: http://localhost:8899"
    echo "   - Solana WebSocket: ws://localhost:8900"
    echo "   - Solana Faucet: http://localhost:9900"
    echo ""
    echo "🛑 To stop the environment:"
    echo "   docker-compose down"
else
    echo "❌ Failed to start services. Check logs with:"
    echo "   docker-compose logs"
    exit 1
fi 