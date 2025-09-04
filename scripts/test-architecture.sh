#!/bin/bash

# 🧪 Community Coin - Architecture Testing Script
# This script verifies the corrected Solana dApp architecture

set -e

echo "🧪 Community Coin - Architecture Testing Script"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_test "$test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        print_pass "$test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        print_fail "$test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo ""
echo "🔍 Testing Architecture Components..."
echo ""

# Test 1: Solana Network Direct Connection
print_test "1. Testing Solana Network (Direct Client Connection)"
SOLANA_HEALTH=$(curl -s -X POST http://localhost:8899 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' 2>/dev/null)

if echo "$SOLANA_HEALTH" | grep -q "ok"; then
    print_pass "✅ Solana RPC is healthy and accessible"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ Solana RPC connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 2: Solana WebSocket Connection
print_test "2. Testing Solana WebSocket (Blockchain Updates)"
if timeout 5 bash -c "</dev/tcp/localhost/8900" >/dev/null 2>&1; then
    print_pass "✅ Solana WebSocket port is open"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ Solana WebSocket connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 3: Server API Connection (Metadata/Social)
print_test "3. Testing Server API (Metadata & Social Features)"
SERVER_HEALTH=$(curl -s http://localhost:8080/health 2>/dev/null)

if echo "$SERVER_HEALTH" | grep -q -E "(healthy|ok)"; then
    print_pass "✅ Server API is healthy"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ Server API connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 4: Server WebSocket Connection (Social Updates)
print_test "4. Testing Server WebSocket (Social Updates)"
if timeout 5 bash -c "</dev/tcp/localhost/8080" >/dev/null 2>&1; then
    print_pass "✅ Server WebSocket port is open"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ Server WebSocket connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 5: Client Application
print_test "5. Testing React Client Application"
CLIENT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null)

if [ "$CLIENT_RESPONSE" = "200" ]; then
    print_pass "✅ React client is serving correctly"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ React client connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🔧 Testing Architecture Separation..."
echo ""

# Test 6: Verify Solana Program Deployment
print_test "6. Testing CommCoin Program Deployment"
PROGRAM_INFO=$(curl -s -X POST http://localhost:8899 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX",{"encoding":"base64"}]}' 2>/dev/null)

if echo "$PROGRAM_INFO" | grep -q "value"; then
    print_pass "✅ CommCoin program is deployed on Solana"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_warn "⚠️  CommCoin program deployment check inconclusive"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 7: Database Connection (Server Only)
print_test "7. Testing Database Connection (Server Dependency)"
DB_HEALTH=$(curl -s http://localhost:8080/health/db 2>/dev/null)

if echo "$DB_HEALTH" | grep -q -E "(healthy|ok|connected)"; then
    print_pass "✅ Database connection is healthy"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ Database connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 8: Redis Connection (Server Only)
print_test "8. Testing Redis Connection (Server Dependency)"
REDIS_HEALTH=$(curl -s http://localhost:8080/health/redis 2>/dev/null)

if echo "$REDIS_HEALTH" | grep -q -E "(healthy|ok|connected)"; then
    print_pass "✅ Redis connection is healthy"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ Redis connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "📊 Testing API Endpoints..."
echo ""

# Test 9: Token API (Server Metadata)
print_test "9. Testing Token Metadata API"
TOKENS_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/tokens 2>/dev/null)

if [ "$TOKENS_API" = "200" ]; then
    print_pass "✅ Token metadata API is working"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ Token metadata API failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 10: Social API (Server Only)
print_test "10. Testing Social Features API"
SOCIAL_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/social/feed 2>/dev/null)

if [ "$SOCIAL_API" = "200" ] || [ "$SOCIAL_API" = "401" ]; then
    print_pass "✅ Social features API is responding"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_fail "❌ Social features API failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🔐 Testing Architecture Security..."
echo ""

# Test 11: Verify Client Environment Variables
print_test "11. Checking Client Environment (Direct Solana Connection)"
if [ -f "client/client_v4/project/.env.local" ]; then
    CLIENT_ENV=$(cat client/client_v4/project/.env.local)
    if echo "$CLIENT_ENV" | grep -q "VITE_SOLANA_RPC_URL=http://localhost:8899"; then
        print_pass "✅ Client configured for direct Solana connection"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "❌ Client not configured for direct Solana connection"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    print_fail "❌ Client environment file not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 12: Verify Server Environment Variables
print_test "12. Checking Server Environment (Metadata/Social Only)"
if [ -f "server_rust/.env" ]; then
    SERVER_ENV=$(cat server_rust/.env)
    if echo "$SERVER_ENV" | grep -q "DATABASE_URL" && echo "$SERVER_ENV" | grep -q "REDIS_URL"; then
        print_pass "✅ Server configured for metadata and social features"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_fail "❌ Server environment configuration incomplete"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    print_fail "❌ Server environment file not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🎯 Architecture Verification Summary"
echo "==================================="
echo ""

# Calculate percentages
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    FAIL_PERCENTAGE=$((FAILED_TESTS * 100 / TOTAL_TESTS))
else
    PASS_PERCENTAGE=0
    FAIL_PERCENTAGE=0
fi

echo "📊 Test Results:"
echo "  Total Tests:    $TOTAL_TESTS"
echo "  Passed:         $PASSED_TESTS ($PASS_PERCENTAGE%)"
echo "  Failed:         $FAILED_TESTS ($FAIL_PERCENTAGE%)"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    print_pass "🎉 ALL TESTS PASSED! Architecture is correctly configured."
    echo ""
    echo "✅ Your Solana dApp architecture is working correctly:"
    echo "   • Client connects directly to Solana for transactions"
    echo "   • Server handles metadata and social features only"
    echo "   • Proper separation of concerns maintained"
    echo "   • All services are healthy and communicating"
    echo ""
    echo "🚀 Ready for end-to-end testing!"
    exit 0
elif [ $PASSED_TESTS -gt $((TOTAL_TESTS * 70 / 100)) ]; then
    print_warn "⚠️  Most tests passed, but some issues detected."
    echo ""
    echo "🔧 Issues to address:"
    echo "   • Check failed tests above"
    echo "   • Verify all services are running"
    echo "   • Review logs for error details"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Fix failed components"
    echo "   2. Re-run this test script"
    echo "   3. Proceed with manual testing"
    exit 1
else
    print_fail "❌ Multiple critical issues detected!"
    echo ""
    echo "🚨 Critical problems:"
    echo "   • Architecture may not be correctly configured"
    echo "   • Multiple services are not responding"
    echo "   • Review setup script and logs"
    echo ""
    echo "🔧 Recommended actions:"
    echo "   1. Run ./setup-localnet-e2e.sh again"
    echo "   2. Check all service logs"
    echo "   3. Verify all dependencies are installed"
    echo "   4. Re-run this test script"
    exit 2
fi 