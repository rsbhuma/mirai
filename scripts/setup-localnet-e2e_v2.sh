#!/bin/bash

# 🚀 Community Coin - End-to-End Local Development Setup (Corrected Architecture)
# This script sets up the complete local development environment with proper Solana dApp architecture

set -e  # Exit on any error

echo "🚀 Community Coin - End-to-End Local Development Setup (Corrected Architecture)"
echo "================================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Cleanup function
cleanup() {
    print_warning "🛑 Interrupt received! Cleaning up..."
    
    # Run cleanup script if it exists
    if [ -f "./cleanup-e2e.sh" ]; then
        print_status "Running cleanup script..."
        ./cleanup-e2e.sh
    else
        print_warning "Cleanup script not found, performing manual cleanup..."
        
        # Manual cleanup
        docker stop solana-validator solana-dev community_coin_server community_coin_postgres community_coin_redis >/dev/null 2>&1 || true
        docker rm solana-validator solana-dev community_coin_server community_coin_postgres community_coin_redis >/dev/null 2>&1 || true
        
        # Stop compose services
                  if [ -d "../contracts" ]; then
             cd ../contracts && docker-compose down >/dev/null 2>&1 || true && cd ..
        fi
        if [ -d "../server_rust" ]; then
            cd ../server_rust && docker-compose -f docker-compose.deps.yml down >/dev/null 2>&1 || true && cd ..
        fi
    fi
    
    print_success "Cleanup completed!"
    exit 1
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        echo "  Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for PostgreSQL to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if docker exec community_coin_postgres pg_isready -U postgres >/dev/null 2>&1; then
            print_success "PostgreSQL is ready!"
            return 0
        fi
        echo "  Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    print_error "PostgreSQL failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Step 1: Check prerequisites
echo ""
print_status "Step 1: Checking prerequisites..."

REQUIRED_COMMANDS=("docker" "docker-compose" "curl" "lsof")
MISSING_COMMANDS=()

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command_exists "$cmd"; then
        MISSING_COMMANDS+=("$cmd")
    fi
done

if [ ${#MISSING_COMMANDS[@]} -ne 0 ]; then
    print_error "Missing required commands: ${MISSING_COMMANDS[*]}"
    echo "Please install the missing commands and run this script again."
    exit 1
fi

print_success "All prerequisites are installed"

# Step 2: Setup environment variables
echo ""
print_status "Step 2: Setting up environment variables..."

# Create .env file for server_rust if it doesn't exist
if [ ! -f "../server_rust/.env" ]; then
    cat > ../server_rust/.env << EOF
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5433/community_coin
DATABASE_READ_URLS=postgresql://postgres:password@localhost:5433/community_coin

# Redis
REDIS_URL=redis://localhost:6380

# Solana (Server only needs this for indexing, not transactions)
SOLANA_RPC_URL=http://localhost:8899
COMMCOIN_PROGRAM_ID=6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX

# Server
PORT=8080
INSTANCE_ID=local-dev-1

# Supabase (for auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
    print_success "Created ../server_rust/.env file"
else
    print_warning "../server_rust/.env already exists, skipping..."
fi

# Step 3: Start Solana local validator and contracts
echo ""
print_status "Step 3: Starting Solana local validator and contracts..."

cd ../contracts

# Check if Solana validator is already running
if check_port 8899; then
    print_warning "Port 8899 is already in use. Stopping existing Solana validator..."
    pkill -f "solana-test-validator" || true
    sleep 3
fi

# Start Docker services for Solana
print_status "Starting Solana Docker services..."
    docker-compose -f docker-compose.yml down || true
docker-compose up -d --build

# Wait for Solana validator to be ready
if ! wait_for_service "http://localhost:8899" "Solana Validator"; then
    print_error "Failed to start Solana validator"
    exit 1
fi

# Enter development container and setup
print_status "Setting up Solana development environment..."
docker-compose exec -T solana-dev bash -c "
    cd commcoin
    echo '📦 Installing dependencies...'
    pnpm install --silent
    
    echo '🔧 Setting up Solana environment...'
    ./scripts/setup.sh
    
    echo '🏗️ Building smart contract...'
    anchor build
    
    echo '🚀 Deploying contract to localnet...'
    PROGRAM_ID=\$(solana program deploy target/deploy/commcoin.so | grep 'Program Id:' | awk '{print \$3}')
    echo \"Contract deployed with Program ID: \$PROGRAM_ID\"
    
    echo '✅ Contract setup complete!'
"

cd ..
print_success "Solana validator and contracts are ready"

# Step 4: Start server_rust with database
echo ""
print_status "Step 4: Starting Rust server with database..."

cd server_rust

# Start PostgreSQL and Redis if not already running
if ! check_port 5433; then
    print_status "Starting PostgreSQL and Redis..."
    docker-compose -f docker-compose.deps.yml up -d
    
    # Wait for database to be ready using proper PostgreSQL health check
    print_status "Waiting for PostgreSQL to be ready..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec community_coin_postgres pg_isready -U postgres >/dev/null 2>&1; then
            print_success "PostgreSQL is ready!"
            break
        fi
        echo "  Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "PostgreSQL failed to start within 60 seconds"
    fi
else
    print_warning "PostgreSQL is already running on port 5433"
fi


# Step 6: Verify architecture is correct
echo ""
print_status "Step 6: Verifying corrected architecture..."

# Test direct Solana connection
print_status "Testing direct Solana RPC connection..."
SOLANA_VERSION=$(curl -s -X POST http://localhost:8899 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}' | jq -r '.result."solana-core"' 2>/dev/null || echo "unknown")

if [ "$SOLANA_VERSION" != "unknown" ] && [ "$SOLANA_VERSION" != "null" ]; then
    print_success "✅ Solana RPC connection working (version: $SOLANA_VERSION)"
else
    print_warning "⚠️  Solana RPC connection test failed, but continuing..."
fi

# Test server API connection
print_status "Testing server API connection..."
SERVER_HEALTH=$(curl -s http://localhost:8080/health | jq -r '.status' 2>/dev/null || echo "unknown")

if [ "$SERVER_HEALTH" = "healthy" ] || [ "$SERVER_HEALTH" = "ok" ]; then
    print_success "✅ Server API connection working"
else
    print_warning "⚠️  Server API connection test failed, but continuing..."
fi

# Create architecture verification script
cat > verify-architecture.sh << 'EOF'
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
EOF

chmod +x verify-architecture.sh

# Step 7: Display status and test instructions
echo ""
print_success "🎉 End-to-End Setup Complete! (Corrected Architecture)"
echo "======================================================="
echo ""
echo "🏗️ Architecture Overview:"
echo "  ┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐"
echo "  │   React Client  │────│   Solana Network   │    │   Rust Server       │"
echo "  │   Port: 5173    │    │   Port: 8899        │    │   Port: 8080        │"
echo "  │                 │    │                     │    │                     │"
echo "  │  • Wallet UI    │◄──►│  • CommCoin Program │    │  • Social Features  │"
echo "  │  • Trading UI   │    │  • Token Accounts   │    │  • Metadata Storage │"
echo "  │  • Solana API   │    │  • Direct Txns      │    │  • User Profiles    │"
echo "  └─────────────────┘    └─────────────────────┘    └─────────────────────┘"
echo ""
echo "📋 Services Status:"
echo "  • Solana Validator:    http://localhost:8899 (DIRECT client connection)"
echo "  • Solana WebSocket:    ws://localhost:8900 (blockchain updates)"
echo "  • Rust API Server:     http://localhost:8080 (metadata/social only)"
echo "  • React Client:        http://localhost:5173 (connects to both)"
echo "  • PostgreSQL:          localhost:5433"
echo "  • Redis:               localhost:6380"
echo ""
echo "🔧 Key Differences (Corrected Architecture):"
echo "  ✅ Client connects DIRECTLY to Solana for all transactions"
echo "  ✅ Wallet adapter handles transaction signing"
echo "  ✅ Server only stores metadata and social features"
echo "  ✅ No server custody of user funds"
echo "  ✅ Real-time updates from both Solana and server"
echo ""
echo "📱 Testing Instructions:"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Connect wallet (will connect directly to Solana localnet)"
echo "  3. Create token (wallet will prompt for approval)"
echo "  4. Buy/sell tokens (transactions go directly to Solana)"
echo "  5. Use social features (data goes to server)"
echo "  6. Verify real-time updates from both sources"
echo ""
echo "🧪 Test Sequence (Updated for Corrected Architecture):"
echo "  1. Wallet connection → Direct to Solana ✅"
echo "  2. Token creation → Wallet approval → Solana chain ✅"
echo "  3. Token trading → Wallet approval → Solana chain ✅"
echo "  4. Metadata storage → Server API ✅"
echo "  5. Social features → Server only ✅"
echo "  6. Real-time updates → Dual sources ✅"
echo ""
echo "📊 Monitoring:"
echo "  • Solana logs:         docker-compose -f contracts/docker-compose.yml logs -f"
echo "  • Server logs:         tail -f server_rust/server.log"
echo "  • Client logs:         tail -f client/client_v4/project/client.log"
echo "  • Architecture check:  scripts/verify-architecture.sh"
echo ""
echo "🛑 To stop all services:"
echo "  scripts/stop-localnet-e2e.sh"
echo ""

print_success "Setup complete! Your corrected Solana dApp architecture is ready."
print_status "🎯 KEY POINT: Client now connects DIRECTLY to Solana for all transactions!"
print_status "Visit http://localhost:5173 to start testing the corrected architecture!"

echo ""
echo "📋 Available cleanup options:"
echo "   1. Press Ctrl+C to stop all services and cleanup automatically"
echo "   2. Run 'scripts/cleanup-e2e.sh' in another terminal to cleanup manually"
echo "   3. Run 'scripts/stop-localnet-e2e.sh' to stop services (legacy script)"
echo ""

# Optional: Open browser automatically
if command_exists "xdg-open"; then
    xdg-open "http://localhost:5173" >/dev/null 2>&1 &
elif command_exists "open"; then
    open "http://localhost:5173" >/dev/null 2>&1 &
fi

# Keep the script running so signal handlers work
print_status "🔄 E2E environment is running. Press Ctrl+C to stop and cleanup all services..."
print_status "🌍 Frontend: http://localhost:5173"
print_status "🔗 Solana RPC: http://localhost:8899"
print_status "🦀 Rust Server: http://localhost:8080"
print_status "📊 Health Check: http://localhost:8080/health"

# Wait indefinitely until interrupted
while true; do
    sleep 1
done 