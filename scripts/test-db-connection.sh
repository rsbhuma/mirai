#!/bin/bash

# Test script to verify database connection

echo "🧪 Testing database connection..."

# Check if PostgreSQL container is running
if ! docker ps | grep -q community_coin_postgres; then
    echo "❌ PostgreSQL container is not running"
    exit 1
fi

# Test PostgreSQL connection
if docker exec community_coin_postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Test database exists
if docker exec community_coin_postgres psql -U postgres -d community_coin_db -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database 'community_coin_db' is accessible"
else
    echo "❌ Database 'community_coin_db' is not accessible"
    exit 1
fi

# Test server connection
echo "🔄 Testing server connection..."
cd server_rust

# Build if needed
if [ ! -f target/release/server_rust ]; then
    echo "🔨 Building server..."
    cargo build --release
fi

# Start server in background
DATABASE_URL="postgresql://postgres:password@localhost:5433/community_coin_db" ./target/release/server_rust &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
if curl -s http://localhost:8080/health | grep -q "healthy"; then
    echo "✅ Server is healthy"
    kill $SERVER_PID 2>/dev/null
    echo "🎉 All tests passed!"
else
    echo "❌ Server health check failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi 