#!/bin/bash

# Community Coin Server - Test Setup Script
# This script helps you test the production-ready server on your laptop

set -e

echo "🚀 Community Coin Server - Production Testing Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_status "✓ Docker is installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_status "✓ Docker Compose is installed"
    
    # Check Rust (optional for development)
    if command -v cargo &> /dev/null; then
        print_status "✓ Rust is installed"
        RUST_AVAILABLE=true
    else
        print_warning "Rust is not installed (optional for development mode)"
        RUST_AVAILABLE=false
    fi
    
    # Check available memory
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$TOTAL_MEM" -lt 8 ]; then
            print_warning "You have ${TOTAL_MEM}GB RAM. 8GB+ recommended for production testing."
        else
            print_status "✓ Sufficient memory: ${TOTAL_MEM}GB"
        fi
    fi
}

# Setup environment files
setup_environment() {
    print_header "Setting up Environment"
    
    # Create development .env if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating development .env file..."
        cat > .env << 'EOF'
# Development Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5433/community_coin_db
DATABASE_READ_URL=postgresql://postgres:password@localhost:5433/community_coin_db
REDIS_URL=redis://localhost:6380

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
RUST_LOG=debug

# Supabase Configuration (Optional - use dummy values for testing)
SUPABASE_URL=https://dummy-project.supabase.co
SUPABASE_ANON_KEY=dummy-anon-key
SUPABASE_SERVICE_ROLE_KEY=dummy-service-key

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
COMMCOIN_PROGRAM_ID=dummy-program-id

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only
EOF
        print_status "✓ Development .env created"
    else
        print_status "✓ Development .env already exists"
    fi
    
    # Create production .env if it doesn't exist
    if [ ! -f .env.prod ]; then
        print_status "Creating production .env.prod file..."
        cat > .env.prod << 'EOF'
# Production Configuration
POSTGRES_PASSWORD=secure_production_password_123
POSTGRES_REPLICATION_PASSWORD=secure_replication_password_123
GRAFANA_PASSWORD=admin123

# Supabase Configuration (Replace with your actual values)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-super-secret-jwt-key-256-bits-long-for-production

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
EOF
        print_status "✓ Production .env.prod created"
    else
        print_status "✓ Production .env.prod already exists"
    fi
}

# Development mode testing
test_development() {
    print_header "Testing Development Mode"
    
    print_status "Starting infrastructure services..."
    docker-compose up -d postgres redis
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "postgres.*Up"; then
        print_status "✓ PostgreSQL is running"
    else
        print_error "PostgreSQL failed to start"
        return 1
    fi
    
    if docker-compose ps | grep -q "redis.*Up"; then
        print_status "✓ Redis is running"
    else
        print_error "Redis failed to start"
        return 1
    fi
    
    # Test database connection
    print_status "Testing database connection..."
    if docker exec server_rust-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
        print_status "✓ Database connection successful"
    else
        print_error "Database connection failed"
        return 1
    fi
    
    # Test Redis connection
    print_status "Testing Redis connection..."
    if docker exec server_rust-redis-1 redis-cli ping | grep -q "PONG"; then
        print_status "✓ Redis connection successful"
    else
        print_error "Redis connection failed"
        return 1
    fi
    
    if [ "$RUST_AVAILABLE" = true ]; then
        print_status "Installing SQLx CLI (if not already installed)..."
        cargo install sqlx-cli --no-default-features --features postgres --quiet || true
        
        print_status "Running database migrations..."
        sqlx migrate run || print_warning "Migrations failed (this is expected if tables already exist)"
        
        print_status "Starting Rust server in background..."
        cargo run &
        SERVER_PID=$!
        
        print_status "Waiting for server to start..."
        sleep 15
        
        # Test health endpoint
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            print_status "✓ Development server is running and healthy!"
            echo -e "\n${GREEN}Development server endpoints:${NC}"
            echo "  🏥 Health: http://localhost:8080/health"
            echo "  📊 Metrics: http://localhost:8080/metrics"
            echo "  🔌 WebSocket: ws://localhost:8080/ws"
        else
            print_error "Server health check failed"
        fi
        
        # Kill the server
        kill $SERVER_PID 2>/dev/null || true
    else
        print_warning "Rust not available, skipping server startup test"
    fi
    
    print_status "Development mode test completed!"
}

# Production mode testing
test_production() {
    print_header "Testing Production Mode (Full Stack)"
    
    print_warning "This will start the full production stack with monitoring."
    print_warning "It requires significant resources (4GB+ RAM, 4+ CPU cores)."
    
    read -p "Continue with production testing? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Skipping production testing."
        return 0
    fi
    
    print_status "Starting production stack..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    print_status "Waiting for services to start (this may take 2-3 minutes)..."
    sleep 30
    
    # Check critical services
    services=("load-balancer" "app-1" "postgres-primary" "redis-cluster" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps | grep -q "${service}.*Up"; then
            print_status "✓ ${service} is running"
        else
            print_warning "⚠ ${service} may not be ready yet"
        fi
    done
    
    print_status "Waiting additional time for full initialization..."
    sleep 60
    
    # Test endpoints
    print_status "Testing production endpoints..."
    
    # Test load balancer health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_status "✓ Load balancer and application are healthy!"
    else
        print_warning "⚠ Load balancer health check failed (may still be starting)"
    fi
    
    # Test Grafana
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "✓ Grafana is accessible"
    else
        print_warning "⚠ Grafana not ready yet"
    fi
    
    # Test Prometheus
    if curl -f http://localhost:9090 > /dev/null 2>&1; then
        print_status "✓ Prometheus is accessible"
    else
        print_warning "⚠ Prometheus not ready yet"
    fi
    
    echo -e "\n${GREEN}Production stack endpoints:${NC}"
    echo "  🚀 Application: http://localhost"
    echo "  🏥 Health Check: http://localhost/health"
    echo "  📊 Grafana: http://localhost:3000 (admin/admin123)"
    echo "  📈 Prometheus: http://localhost:9090"
    echo "  🔍 Kibana: http://localhost:5601"
    echo "  📊 HAProxy Stats: http://localhost:8404"
    echo "  🔍 Jaeger: http://localhost:16686"
    
    print_status "Production mode test completed!"
}

# Load testing
run_load_test() {
    print_header "Running Load Tests"
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required for load testing"
        return 1
    fi
    
    print_status "Running basic load test..."
    
    # Simple concurrent requests test
    print_status "Testing with 50 concurrent requests..."
    
    for i in {1..50}; do
        curl -s http://localhost/health > /dev/null &
    done
    wait
    
    print_status "✓ Basic load test completed"
    
    # WebSocket test
    if command -v node &> /dev/null; then
        print_status "Testing WebSocket connections..."
        
        cat > websocket-test.js << 'EOF'
const WebSocket = require('ws');

console.log('Testing WebSocket connections...');
const connections = [];

for (let i = 0; i < 10; i++) {
    try {
        const ws = new WebSocket('ws://localhost/ws');
        connections.push(ws);
        
        ws.on('open', () => {
            console.log(`Connection ${i + 1} opened`);
            ws.send(JSON.stringify({
                type: 'subscribe',
                channel: 'market_data'
            }));
        });
        
        ws.on('error', (error) => {
            console.log(`Connection ${i + 1} error:`, error.message);
        });
    } catch (error) {
        console.log(`Failed to create connection ${i + 1}:`, error.message);
    }
}

setTimeout(() => {
    connections.forEach((ws, i) => {
        try {
            ws.close();
            console.log(`Connection ${i + 1} closed`);
        } catch (error) {
            console.log(`Error closing connection ${i + 1}:`, error.message);
        }
    });
    console.log('WebSocket test completed');
    process.exit(0);
}, 5000);
EOF
        
        node websocket-test.js || print_warning "WebSocket test failed (this is expected if WebSocket server is not running)"
        rm -f websocket-test.js
    else
        print_warning "Node.js not available, skipping WebSocket test"
    fi
}

# Cleanup function
cleanup() {
    print_header "Cleanup Options"
    
    echo "Choose cleanup option:"
    echo "1) Stop development services only"
    echo "2) Stop production services only"
    echo "3) Stop all services"
    echo "4) Stop all services and remove volumes (full cleanup)"
    echo "5) Skip cleanup"
    
    read -p "Enter choice (1-5): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            print_status "Stopping development services..."
            docker-compose down
            ;;
        2)
            print_status "Stopping production services..."
            docker-compose -f docker-compose.prod.yml down
            ;;
        3)
            print_status "Stopping all services..."
            docker-compose down
            docker-compose -f docker-compose.prod.yml down
            ;;
        4)
            print_status "Stopping all services and removing volumes..."
            docker-compose down -v
            docker-compose -f docker-compose.prod.yml down -v
            ;;
        5)
            print_status "Skipping cleanup"
            ;;
        *)
            print_warning "Invalid choice, skipping cleanup"
            ;;
    esac
}

# Main menu
main_menu() {
    echo -e "\n${BLUE}Choose testing mode:${NC}"
    echo "1) Quick development test (lightweight)"
    echo "2) Full production test (resource intensive)"
    echo "3) Load testing"
    echo "4) All tests"
    echo "5) Cleanup only"
    echo "6) Exit"
    
    read -p "Enter choice (1-6): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            test_development
            ;;
        2)
            test_production
            ;;
        3)
            run_load_test
            ;;
        4)
            test_development
            test_production
            run_load_test
            ;;
        5)
            cleanup
            exit 0
            ;;
        6)
            print_status "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            main_menu
            ;;
    esac
}

# Main execution
main() {
    check_prerequisites
    setup_environment
    main_menu
    
    echo -e "\n${GREEN}Testing completed!${NC}"
    echo -e "\nTo clean up services later, run: ${YELLOW}./test-setup.sh${NC} and choose cleanup option"
    
    # Offer cleanup
    echo
    read -p "Would you like to clean up services now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
}

# Run main function
main "$@" 