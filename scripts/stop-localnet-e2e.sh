#!/bin/bash

echo "🛑 Stopping Community Coin Local Development Environment..."

# Stop React client
if [ -f client/client_v4/project/client.pid ]; then
    CLIENT_PID=$(cat client/client_v4/project/client.pid)
    if kill -0 $CLIENT_PID 2>/dev/null; then
        echo "Stopping React client (PID: $CLIENT_PID)..."
        kill $CLIENT_PID
    fi
    rm -f client/client_v4/project/client.pid
fi

# Stop Rust server
if [ -f server_rust/server.pid ]; then
    SERVER_PID=$(cat server_rust/server.pid)
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "Stopping Rust server (PID: $SERVER_PID)..."
        kill $SERVER_PID
    fi
    rm -f server_rust/server.pid
fi

# Stop Docker services
echo "Stopping Docker services..."
cd server_rust
docker-compose -f docker-compose.deps.yml down
cd ../contracts
docker-compose down
cd ..

echo "✅ All services stopped"
