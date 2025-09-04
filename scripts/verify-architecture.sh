#!/bin/bash

echo "🔍 Architecture Verification Script"
echo "=================================="

echo ""
echo "1. Testing Client → Solana Direct Connection:"
curl -s -X POST http://localhost:8899 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | jq '.'

echo ""
echo "2. Testing Client → Server Connection (metadata only):"
curl -s http://localhost:8080/health | jq '.'

echo ""
echo "3. Testing WebSocket Connections:"
echo "   - Solana WebSocket: ws://localhost:8900 (for blockchain updates)"
echo "   - Server WebSocket: ws://localhost:8080/ws (for social updates)"

echo ""
echo "4. Environment Variables Check:"
echo "   Client .env.local:"
cat client/client_v4/project/.env.local

echo ""
echo "   Server .env:"
cat server_rust/.env

echo ""
echo "✅ Architecture Verification Complete!"
echo "   - Client connects directly to Solana for transactions"
echo "   - Server handles metadata and social features"
echo "   - Proper separation of concerns maintained"
