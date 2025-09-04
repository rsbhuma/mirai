#!/bin/bash

# Community Coin Server Startup Script
# This script helps debug server startup issues

echo "🚀 Starting Community Coin Server..."
echo "📋 Current directory: $(pwd)"
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ Found .env file"
    echo "📄 Environment variables:"
    grep -E "^(PORT|DATABASE_URL|REDIS_URL|SOLANA_RPC_URL|ENVIRONMENT)" .env | head -10
    echo ""
else
    echo "⚠️  No .env file found. Using default environment variables."
    echo "💡 You can copy env.example to .env and configure it:"
    echo "   cp env.example .env"
    echo ""
fi

# Check if database is accessible (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
    echo "🗄️  Testing database connection..."
    # Extract host and port from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
        if nc -z $DB_HOST $DB_PORT 2>/dev/null; then
            echo "✅ Database connection test: SUCCESS"
        else
            echo "❌ Database connection test: FAILED"
            echo "   Host: $DB_HOST, Port: $DB_PORT"
        fi
    fi
    echo ""
fi

# Check if Redis is accessible (if REDIS_URL is set)
if [ -n "$REDIS_URL" ]; then
    echo "🔴 Testing Redis connection..."
    REDIS_HOST=$(echo $REDIS_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    REDIS_PORT=$(echo $REDIS_URL | sed -n 's/.*:\([0-9]*\)$/\1/p')
    
    if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
        if nc -z $REDIS_HOST $REDIS_PORT 2>/dev/null; then
            echo "✅ Redis connection test: SUCCESS"
        else
            echo "❌ Redis connection test: FAILED"
            echo "   Host: $REDIS_HOST, Port: $REDIS_PORT"
        fi
    fi
    echo ""
fi

echo "🔧 Starting server with verbose logging..."
echo "📝 Press Ctrl+C to stop the server"
echo ""

# Set log level to debug for more verbose output
export RUST_LOG=debug

# Run the server with error output
cargo run --bin community_coin_server 2>&1

echo ""
echo "🏁 Server stopped" 