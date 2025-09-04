#!/bin/bash

# Community Coin Server Environment Setup Script

echo "🔧 Setting up Community Coin Server environment..."

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file already exists"
    echo "📄 Current environment variables:"
    grep -E "^(PORT|DATABASE_URL|REDIS_URL|SOLANA_RPC_URL|ENVIRONMENT)" .env
else
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your actual configuration:"
    echo "   - DATABASE_URL: Your PostgreSQL connection string"
    echo "   - REDIS_URL: Your Redis connection string"
    echo "   - SOLANA_RPC_URL: Your Solana RPC endpoint"
    echo "   - COMMCOIN_PROGRAM_ID: Your program ID"
    echo ""
fi

echo ""
echo "🔍 Quick environment check:"
echo "   📁 Current directory: $(pwd)"
echo "   🐕 Rust version: $(rustc --version 2>/dev/null || echo 'Rust not found')"
echo "   📦 Cargo version: $(cargo --version 2>/dev/null || echo 'Cargo not found')"
echo ""

echo "💡 Next steps:"
echo "   1. Edit .env file with your configuration"
echo "   2. Start PostgreSQL and Redis services"
echo "   3. Run: ./start_server.sh"
echo ""

echo "🚀 Ready to start the server!" 