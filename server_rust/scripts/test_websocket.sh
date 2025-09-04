#!/bin/bash

# Test script for WebSocket functionality
# This script tests the WebSocket connection and message handling

set -e

# Configuration
SERVER_URL="localhost:8080"
WEBSOCKET_URL="ws://${SERVER_URL}/ws"
HTTP_URL="http://${SERVER_URL}"

echo "🧪 Testing WebSocket functionality..."

# Test 1: Check if server is running
echo "📡 Testing server health..."
if curl -f -s "${HTTP_URL}/health" > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running"
    exit 1
fi

# Test 2: Check WebSocket connections endpoint
echo "🔌 Testing WebSocket connections endpoint..."
if curl -f -s "${HTTP_URL}/api/ws/connections" > /dev/null; then
    echo "✅ WebSocket connections endpoint is accessible"
else
    echo "❌ WebSocket connections endpoint is not accessible"
    exit 1
fi

# Test 3: Test WebSocket connection (if wscat is available)
if command -v wscat &> /dev/null; then
    echo "🔗 Testing WebSocket connection..."
    
    # Start wscat in background
    wscat -c "${WEBSOCKET_URL}?user_id=test-user&subscriptions=test-topic" &
    WS_PID=$!
    
    # Wait a moment for connection
    sleep 2
    
    # Check if wscat is still running (connection successful)
    if kill -0 $WS_PID 2>/dev/null; then
        echo "✅ WebSocket connection successful"
        
        # Send a test message
        echo '{"type": "ping"}' | wscat -c "${WEBSOCKET_URL}" &
        
        # Clean up
        kill $WS_PID 2>/dev/null || true
    else
        echo "❌ WebSocket connection failed"
        exit 1
    fi
else
    echo "⚠️  wscat not found, skipping WebSocket connection test"
    echo "   Install wscat with: npm install -g wscat"
fi

# Test 4: Test broadcast message endpoint
echo "📢 Testing broadcast message endpoint..."
BROADCAST_RESPONSE=$(curl -s -X POST "${HTTP_URL}/api/ws/broadcast" \
    -H "Content-Type: application/json" \
    -d '{
        "message_type": "notification",
        "data": {
            "user_id": "test-user",
            "title": "Test Notification",
            "message": "This is a test notification",
            "notification_type": "test"
        },
        "target": "all"
    }')

if echo "$BROADCAST_RESPONSE" | grep -q "success"; then
    echo "✅ Broadcast message endpoint working"
else
    echo "❌ Broadcast message endpoint failed"
    echo "Response: $BROADCAST_RESPONSE"
    exit 1
fi

# Test 5: Check connection statistics
echo "📊 Testing connection statistics..."
STATS_RESPONSE=$(curl -s "${HTTP_URL}/api/ws/connections")

if echo "$STATS_RESPONSE" | grep -q "total_connections"; then
    echo "✅ Connection statistics endpoint working"
    echo "Stats: $STATS_RESPONSE"
else
    echo "❌ Connection statistics endpoint failed"
    echo "Response: $STATS_RESPONSE"
    exit 1
fi

echo ""
echo "🎉 All WebSocket tests passed!"
echo ""
echo "📋 Test Summary:"
echo "  ✅ Server health check"
echo "  ✅ WebSocket connections endpoint"
echo "  ✅ WebSocket connection (if wscat available)"
echo "  ✅ Broadcast message endpoint"
echo "  ✅ Connection statistics"
echo ""
echo "🚀 WebSocket system is ready for use!" 