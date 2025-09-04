#!/bin/bash

# Docker Swarm Deployment Script for Community Coin Server
# Alternative to Kubernetes for simpler container orchestration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="community-coin"
ENVIRONMENT="production"
STACK_NAME="community-coin-stack"

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
    print_status "✓ Docker is installed ($(docker --version))"
    
    # Check if Docker daemon is running
    if ! docker ps &>/dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    print_status "✓ Docker daemon is running"
    
    # Check system resources
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 4 ]; then
        print_warning "You have ${TOTAL_MEM}GB RAM. 4GB+ recommended for Swarm."
    else
        print_status "✓ Sufficient memory: ${TOTAL_MEM}GB"
    fi
}

# Initialize Docker Swarm
init_swarm() {
    print_header "Initializing Docker Swarm"
    
    # Check if already in swarm mode
    if docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
        print_status "✓ Docker Swarm is already initialized"
        return
    fi
    
    # Initialize swarm
    print_status "Initializing Docker Swarm..."
    MANAGER_IP=$(hostname -I | awk '{print $1}')
    docker swarm init --advertise-addr $MANAGER_IP
    
    print_status "✓ Docker Swarm initialized"
    print_status "Manager IP: $MANAGER_IP"
    
    # Display join command for workers (if needed)
    echo ""
    print_status "To add worker nodes, run this command on other machines:"
    docker swarm join-token worker
}

# Create overlay networks
create_networks() {
    print_header "Creating Overlay Networks"
    
    # Create application network
    if ! docker network ls | grep -q "${PROJECT_NAME}-network"; then
        print_status "Creating overlay network..."
        docker network create \
            --driver overlay \
            --attachable \
            ${PROJECT_NAME}-network
        print_status "✓ Overlay network created: ${PROJECT_NAME}-network"
    else
        print_status "✓ Overlay network already exists"
    fi
}

# Create Docker secrets
create_secrets() {
    print_header "Creating Docker Secrets"
    
    # Generate passwords
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # Create secrets
    echo -n "$POSTGRES_PASSWORD" | docker secret create postgres_password - 2>/dev/null || true
    echo -n "$REDIS_PASSWORD" | docker secret create redis_password - 2>/dev/null || true
    
    print_status "✓ Docker secrets created"
}

# Create Docker Compose file for Swarm
create_swarm_compose() {
    print_header "Creating Swarm Stack Configuration"
    
    cat > docker-compose.swarm.yml << 'EOF'
version: '3.8'

services:
  # Application Service
  app:
    image: community-coin-server:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        constraints:
          - node.role == worker
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    environment:
      - DATABASE_URL=postgresql://postgres:@postgres:5432/community_coin_db
      - REDIS_URL=redis://redis:6379
      - RUST_LOG=info
      - SERVER_PORT=8080
    secrets:
      - postgres_password
      - redis_password
    networks:
      - community-coin-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      placement:
        constraints:
          - node.role == manager
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf
    networks:
      - community-coin-network
    depends_on:
      - app

  # Database
  postgres:
    image: postgres:15-alpine
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    environment:
      - POSTGRES_DB=community_coin_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
    secrets:
      - postgres_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - community-coin-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    command: redis-server --requirepass-file /run/secrets/redis_password --appendonly yes
    secrets:
      - redis_password
    volumes:
      - redis_data:/data
    networks:
      - community-coin-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Monitoring - Prometheus
  prometheus:
    image: prom/prometheus:latest
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    ports:
      - "9090:9090"
    configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml
    volumes:
      - prometheus_data:/prometheus
    networks:
      - community-coin-network
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'

  # Monitoring - Grafana
  grafana:
    image: grafana/grafana:latest
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - community-coin-network

  # Visualizer (Swarm cluster visualization)
  visualizer:
    image: dockersamples/visualizer:stable
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - community-coin-network

networks:
  community-coin-network:
    driver: overlay
    external: true

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

secrets:
  postgres_password:
    external: true
  redis_password:
    external: true

configs:
  nginx_config:
    external: true
  prometheus_config:
    external: true
EOF

    print_status "✓ Swarm stack configuration created"
}

# Create Nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app_servers {
        server app:8080;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://app_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        location /health {
            proxy_pass http://app_servers;
            access_log off;
        }
    }
}
EOF

    # Create Docker config
    docker config create nginx_config nginx.conf 2>/dev/null || true
    rm nginx.conf
    
    print_status "✓ Nginx configuration created"
}

# Create Prometheus configuration
create_prometheus_config() {
    print_status "Creating Prometheus configuration..."
    
    cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'community-coin-app'
    static_configs:
      - targets: ['app:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

    # Create Docker config
    docker config create prometheus_config prometheus.yml 2>/dev/null || true
    rm prometheus.yml
    
    print_status "✓ Prometheus configuration created"
}

# Build application image
build_application() {
    print_header "Building Application Image"
    
    # Build the Rust application
    print_status "Building Docker image..."
    docker build -f Dockerfile.prod -t community-coin-server:latest .
    
    print_status "✓ Application image built"
}

# Deploy the stack
deploy_stack() {
    print_header "Deploying Swarm Stack"
    
    # Deploy the stack
    print_status "Deploying services to swarm..."
    docker stack deploy -c docker-compose.swarm.yml $STACK_NAME
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service status
    print_status "Service status:"
    docker stack services $STACK_NAME
    
    print_status "✓ Stack deployed successfully"
}

# Setup auto-scaling (basic)
setup_autoscaling() {
    print_header "Setting up Auto-scaling"
    
    # Create simple scaling script
    cat > autoscale.sh << 'EOF'
#!/bin/bash

# Simple Docker Swarm autoscaler
STACK_NAME="community-coin-stack"
SERVICE_NAME="${STACK_NAME}_app"
MIN_REPLICAS=2
MAX_REPLICAS=10

while true; do
    # Get current replica count
    CURRENT_REPLICAS=$(docker service inspect --format='{{.Spec.Mode.Replicated.Replicas}}' $SERVICE_NAME)
    
    # Get average CPU usage (simplified)
    CPU_USAGE=$(docker stats --no-stream --format "{{.CPUPerc}}" | grep -v "CPU%" | head -1 | sed 's/%//')
    CPU_USAGE=${CPU_USAGE%.*}  # Remove decimal part
    
    echo "Current replicas: $CURRENT_REPLICAS, CPU usage: $CPU_USAGE%"
    
    # Scale up if CPU > 70%
    if [ "$CPU_USAGE" -gt 70 ] && [ "$CURRENT_REPLICAS" -lt "$MAX_REPLICAS" ]; then
        NEW_REPLICAS=$((CURRENT_REPLICAS + 1))
        echo "Scaling up to $NEW_REPLICAS replicas"
        docker service scale $SERVICE_NAME=$NEW_REPLICAS
    fi
    
    # Scale down if CPU < 30%
    if [ "$CPU_USAGE" -lt 30 ] && [ "$CURRENT_REPLICAS" -gt "$MIN_REPLICAS" ]; then
        NEW_REPLICAS=$((CURRENT_REPLICAS - 1))
        echo "Scaling down to $NEW_REPLICAS replicas"
        docker service scale $SERVICE_NAME=$NEW_REPLICAS
    fi
    
    sleep 60  # Check every minute
done
EOF

    chmod +x autoscale.sh
    
    print_status "✓ Auto-scaling script created: ./autoscale.sh"
    print_status "Run './autoscale.sh &' to start auto-scaling in background"
}

# Display deployment summary
display_summary() {
    print_header "Deployment Summary"
    
    # Get manager IP
    MANAGER_IP=$(docker node ls --format "{{.Hostname}} {{.ManagerStatus}}" | grep "Leader" | awk '{print $1}')
    
    echo -e "${GREEN}🎉 Docker Swarm Deployment Successful!${NC}"
    echo ""
    echo -e "${BLUE}Application Endpoints:${NC}"
    echo "  🌐 API URL: http://$MANAGER_IP"
    echo "  🏥 Health Check: http://$MANAGER_IP/health"
    echo ""
    echo -e "${BLUE}Monitoring & Management:${NC}"
    echo "  📊 Grafana: http://$MANAGER_IP:3000 (admin/admin123)"
    echo "  📈 Prometheus: http://$MANAGER_IP:9090"
    echo "  👁️  Visualizer: http://$MANAGER_IP:8080"
    echo ""
    echo -e "${BLUE}Swarm Services:${NC}"
    docker stack services $STACK_NAME
    echo ""
    echo -e "${YELLOW}Management Commands:${NC}"
    echo "  📊 View services: docker stack services $STACK_NAME"
    echo "  📋 View logs: docker service logs ${STACK_NAME}_app"
    echo "  🔄 Scale app: docker service scale ${STACK_NAME}_app=5"
    echo "  ⬇️  Remove stack: docker stack rm $STACK_NAME"
    echo "  🚀 Auto-scale: ./autoscale.sh &"
    echo ""
    echo -e "${GREEN}💰 Swarm Benefits:${NC}"
    echo "  ✅ Simpler than Kubernetes"
    echo "  ✅ Built into Docker"
    echo "  ✅ Automatic load balancing"
    echo "  ✅ Rolling updates"
    echo "  ✅ Service discovery"
    echo "  ✅ Multi-node scaling"
}

# Main deployment flow
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 Community Coin Server                        ║"
    echo "║              Docker Swarm Auto-Scaling                      ║"
    echo "║            Kubernetes Alternative Deployment                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    init_swarm
    create_networks
    create_secrets
    create_swarm_compose
    create_nginx_config
    create_prometheus_config
    build_application
    deploy_stack
    setup_autoscaling
    display_summary
    
    print_status "🚀 Docker Swarm deployment completed successfully!"
}

# Run main function
main "$@" 