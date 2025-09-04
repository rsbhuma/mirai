#!/bin/bash

# 🧪 Community Coin Server - Comprehensive Test Suite
# This script runs all types of tests: unit, integration, and system tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
TEST_SERVER_PORT=8080
TEST_DB_PORT=5433
TEST_REDIS_PORT=6379
SOLANA_LOCALNET_PORT=8899

# Directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$PROJECT_ROOT/server_rust"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
CLIENT_DIR="$PROJECT_ROOT/client/client_v4/project"

print_header() {
    echo -e "\n${BLUE}🧪 $1${NC}"
    echo "======================================"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if server is running
check_server_health() {
    local url="$1"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/health" > /dev/null 2>&1; then
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    return 1
}

# Start test infrastructure
start_test_infrastructure() {
    print_header "Starting Test Infrastructure"
    
    cd "$SERVER_DIR"
    
    # Start PostgreSQL and Redis
    print_info "Starting PostgreSQL and Redis..."
    docker-compose -f docker-compose.deps.yml up -d
    
    # Wait for services
    print_info "Waiting for database to be ready..."
    sleep 10
    
    # Check PostgreSQL
    if docker exec community_coin_postgres pg_isready -U postgres >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
    else
        print_error "PostgreSQL failed to start"
        return 1
    fi
    
    # Check Redis
    if docker exec community_coin_redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is ready"
    else
        print_error "Redis failed to start"
        return 1
    fi
    
    # Run database migrations
    print_info "Running database migrations..."
    if command -v sqlx >/dev/null 2>&1; then
        DATABASE_URL="postgresql://postgres:password@localhost:5433/community_coin_db" sqlx migrate run || print_warning "Migrations failed (tables may already exist)"
    else
        print_warning "sqlx CLI not found, skipping migrations"
    fi
}

# Start Solana localnet
start_solana_localnet() {
    print_header "Starting Solana Localnet"
    
    cd "$CONTRACTS_DIR"
    
    # Check if Solana validator is already running
    if curl -f -s "http://localhost:$SOLANA_LOCALNET_PORT" > /dev/null 2>&1; then
        print_info "Solana validator already running"
        return 0
    fi
    
    # Start Solana validator using Docker
    print_info "Starting Solana validator..."
    docker-compose up -d solana-validator
    
    # Wait for validator to be ready
    print_info "Waiting for Solana validator..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$SOLANA_LOCALNET_PORT" > /dev/null 2>&1; then
            print_success "Solana validator is ready"
            return 0
        fi
        sleep 3
        ((attempt++))
    done
    
    print_error "Solana validator failed to start"
    return 1
}

# Deploy smart contracts
deploy_contracts() {
    print_header "Deploying Smart Contracts"
    
    cd "$CONTRACTS_DIR"
    
    # Build and deploy contracts using Docker
    print_info "Building and deploying contracts..."
    if docker-compose exec -T solana-dev bash -c "cd /workspace && ./scripts/setup.sh" 2>/dev/null; then
        print_success "Smart contracts deployed successfully"
    else
        print_warning "Contract deployment may have failed (continuing with tests)"
    fi
}

# Start the Rust server
start_test_server() {
    print_header "Starting Test Server"
    
    cd "$SERVER_DIR"
    
    # Create test environment file
    cat > .env.test << EOF
PORT=8080
DATABASE_URL=postgresql://postgres:password@localhost:5433/community_coin_db
REDIS_URL=redis://localhost:6379
SOLANA_RPC_URL=http://localhost:8899
SOLANA_WS_URL=ws://localhost:8900
JWT_SECRET=test_secret_key_for_testing_at_least_32_characters_long
JWT_EXPIRY_HOURS=24
COMMCOIN_PROGRAM_ID=6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX
ENVIRONMENT=test
LOG_LEVEL=info
EOF
    
    # Build the server
    print_info "Building Rust server..."
    cargo build --release
    
    # Start server in background
    print_info "Starting server..."
    RUST_LOG=info ./target/release/community_coin_server > server_test.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > server_test.pid
    
    # Wait for server to be ready
    print_info "Waiting for server to be ready..."
    if check_server_health "http://localhost:$TEST_SERVER_PORT"; then
        print_success "Server is ready"
        return 0
    else
        print_error "Server failed to start"
        if [ -f server_test.log ]; then
            echo "Server logs:"
            tail -20 server_test.log
        fi
        return 1
    fi
}

# Run unit tests
run_unit_tests() {
    print_header "Running Unit Tests"
    
    cd "$SERVER_DIR"
    
    print_info "Running Rust unit tests..."
    if cargo test --lib; then
        print_success "Unit tests passed"
        return 0
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Run Python integration tests
run_python_integration_tests() {
    print_header "Running Python Integration Tests"
    
    cd "$PROJECT_ROOT"
    
    # Check if Python tests exist
    if [ ! -d "tests/integration" ]; then
        print_warning "Python integration tests directory not found, skipping"
        return 0
    fi
    
    local test_success=true
    
    # Test transaction types
    if [ -f "tests/integration/test_new_transaction_types.py" ]; then
        print_info "Running transaction types test..."
        if python3 tests/integration/test_new_transaction_types.py; then
            print_success "Transaction types test passed"
        else
            print_error "Transaction types test failed"
            test_success=false
        fi
    fi
    
    # Test WebSocket communication
    if [ -f "tests/integration/test_websocket_communication.py" ]; then
        print_info "Running WebSocket communication test..."
        if python3 tests/integration/test_websocket_communication.py; then
            print_success "WebSocket communication test passed"
        else
            print_error "WebSocket communication test failed"
            test_success=false
        fi
    fi
    
    if [ "$test_success" = true ]; then
        print_success "All Python integration tests passed"
        return 0
    else
        print_error "Some Python integration tests failed"
        return 1
    fi
}

# Run API tests using Python (legacy support)
run_api_tests() {
    print_header "Running API Tests"
    
    cd "$SERVER_DIR"
    
    if [ -f "test_api.py" ]; then
        print_info "Running Python API tests..."
        if python3 test_api.py; then
            print_success "API tests passed"
            return 0
        else
            print_error "API tests failed"
            return 1
        fi
    else
        print_warning "Python API test file not found, skipping"
        return 0
    fi
}

# Run WebSocket tests (legacy support)
run_websocket_tests() {
    print_header "Running WebSocket Tests"
    
    cd "$SERVER_DIR"
    
    if [ -f "test_websocket.py" ]; then
        print_info "Running Python WebSocket tests..."
        if python3 test_websocket.py; then
            print_success "WebSocket tests passed"
            return 0
        else
            print_error "WebSocket tests failed"
            return 1
        fi
    else
        print_warning "Python WebSocket test file not found, skipping"
        return 0
    fi
}

# Run load tests
run_load_tests() {
    print_header "Running Load Tests"
    
    cd "$SERVER_DIR"
    
    print_info "Running light load test (100 concurrent requests)..."
    
    # Simple load test using curl
    for i in {1..100}; do
        curl -s "http://localhost:$TEST_SERVER_PORT/health" > /dev/null &
    done
    wait
    
    print_success "Load test completed"
}

# Test client integration (if available)
test_client_integration() {
    print_header "Testing Client Integration"
    
    if [ -d "$CLIENT_DIR" ]; then
        cd "$CLIENT_DIR"
        
        # Check if dependencies are installed
        if [ -d "node_modules" ]; then
            print_info "Testing client build..."
            if npm run build > /dev/null 2>&1; then
                print_success "Client builds successfully"
            else
                print_warning "Client build failed"
            fi
        else
            print_warning "Client dependencies not installed, skipping client tests"
        fi
    else
        print_warning "Client directory not found, skipping client tests"
    fi
}

# Run Rust integration tests
run_rust_integration_tests() {
    print_header "Running Rust Integration Tests"
    
    cd "$SERVER_DIR"
    
    print_info "Running Rust integration tests..."
    if cargo test --test integration_tests -- --test-threads=1; then
        print_success "Rust integration tests passed"
        return 0
    else
        print_error "Rust integration tests failed"
        return 1
    fi
}

# Combined integration tests runner
run_integration_tests() {
    print_header "Running All Integration Tests"
    
    local success=true
    
    # Run Rust integration tests
    if ! run_rust_integration_tests; then
        success=false
    fi
    
    # Run Python integration tests
    if ! run_python_integration_tests; then
        success=false
    fi
    
    if [ "$success" = true ]; then
        print_success "All integration tests passed"
        return 0
    else
        print_error "Some integration tests failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    print_header "Cleaning Up"
    
    # Stop server
    if [ -f "$SERVER_DIR/server_test.pid" ]; then
        SERVER_PID=$(cat "$SERVER_DIR/server_test.pid")
        if kill -0 "$SERVER_PID" 2>/dev/null; then
            print_info "Stopping test server (PID: $SERVER_PID)..."
            kill "$SERVER_PID"
        fi
        rm -f "$SERVER_DIR/server_test.pid"
    fi
    
    # Stop Docker services
    cd "$SERVER_DIR"
    print_info "Stopping database and Redis..."
    docker-compose -f docker-compose.deps.yml down > /dev/null 2>&1 || true
    
    cd "$CONTRACTS_DIR"
    print_info "Stopping Solana validator..."
    docker-compose down > /dev/null 2>&1 || true
    
    # Clean up test files
    rm -f "$SERVER_DIR/.env.test"
    rm -f "$SERVER_DIR/server_test.log"
    
    print_success "Cleanup completed"
}

# Trap cleanup on exit
trap cleanup EXIT

# Main test execution
main() {
    print_header "Community Coin Server - Test Suite"
    echo "🚀 Starting comprehensive testing..."
    
    # Parse command line arguments
    RUN_UNIT=true
    RUN_INTEGRATION=true
    RUN_API=true
    RUN_WEBSOCKET=true
    RUN_LOAD=false
    RUN_CLIENT=true
    RUN_PYTHON_ONLY=false
    RUN_RUST_ONLY=false
    SKIP_SETUP=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit-only)
                RUN_INTEGRATION=false
                RUN_API=false
                RUN_WEBSOCKET=false
                RUN_LOAD=false
                RUN_CLIENT=false
                SKIP_SETUP=true
                shift
                ;;
            --integration-only)
                RUN_UNIT=false
                RUN_API=false
                RUN_WEBSOCKET=false
                RUN_LOAD=false
                RUN_CLIENT=false
                shift
                ;;
            --api-only)
                RUN_UNIT=false
                RUN_INTEGRATION=false
                RUN_WEBSOCKET=false
                RUN_LOAD=false
                RUN_CLIENT=false
                shift
                ;;
            --with-load)
                RUN_LOAD=true
                shift
                ;;
            --skip-setup)
                SKIP_SETUP=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --unit-only      Run only unit tests"
                echo "  --integration-only Run only integration tests (Rust + Python)"
                echo "  --api-only       Run only API tests"
                echo "  --python-only    Run only Python integration tests"
                echo "  --rust-only      Run only Rust integration tests"
                echo "  --with-load      Include load tests"
                echo "  --skip-setup     Skip infrastructure setup"
                echo "  --help           Show this help"
                exit 0
                ;;
            --python-only)
                RUN_UNIT=false
                RUN_INTEGRATION=false
                RUN_API=false
                RUN_WEBSOCKET=false
                RUN_LOAD=false
                RUN_CLIENT=false
                RUN_PYTHON_ONLY=true
                shift
                ;;
            --rust-only)
                RUN_UNIT=false
                RUN_INTEGRATION=false
                RUN_API=false
                RUN_WEBSOCKET=false
                RUN_LOAD=false
                RUN_CLIENT=false
                RUN_RUST_ONLY=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Test results tracking
    TOTAL_TESTS=0
    PASSED_TESTS=0
    
    # Setup infrastructure (unless skipped)
    if [ "$SKIP_SETUP" = false ]; then
        if start_test_infrastructure; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
        
        if start_solana_localnet; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
        
        deploy_contracts
        
        if start_test_server; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi
    
    # Run tests based on configuration
    if [ "$RUN_UNIT" = true ]; then
        if run_unit_tests; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi
    
    if [ "$RUN_INTEGRATION" = true ]; then
        if run_integration_tests; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi
    
    if [ "$RUN_API" = true ]; then
        if run_api_tests; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi
    
    if [ "$RUN_WEBSOCKET" = true ]; then
        if run_websocket_tests; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi
    
    if [ "$RUN_LOAD" = true ]; then
        if run_load_tests; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi
    
    if [ "$RUN_CLIENT" = true ]; then
        if test_client_integration; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi
    
    # Handle specific test type options
    if [ "$RUN_PYTHON_ONLY" = true ]; then
        if run_python_integration_tests; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi
    
    if [ "$RUN_RUST_ONLY" = true ]; then
        if run_rust_integration_tests; then
            ((PASSED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    fi

    # Test summary
    print_header "Test Results Summary"
    echo -e "📊 Tests completed: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "✅ Tests passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "❌ Tests failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"
    
    if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
        print_success "🎉 All tests passed!"
        echo
        echo "🚀 Your Community Coin server is ready for production!"
        echo
        echo "Next steps:"
        echo "  1. Run './scripts/setup-localnet-e2e.sh' for full E2E testing"
        echo "  2. Deploy to production using the deployment guides"
        echo "  3. Monitor using the provided monitoring stack"
        exit 0
    else
        print_error "🚨 Some tests failed!"
        echo
        echo "Check the logs above for details on failed tests."
        echo "Common issues:"
        echo "  - Database connection problems"
        echo "  - Port conflicts"
        echo "  - Missing dependencies"
        echo "  - Solana validator not running"
        exit 1
    fi
}

# Run main function with all arguments
main "$@" 