#!/bin/bash

# Private Datacenter Deployment Script for Community Coin Server
# Self-hosted deployment using Docker Compose with auto-scaling

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
DOMAIN_NAME="api.communitycoin.local"

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
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_status "✓ Docker Compose is installed ($(docker-compose --version))"
    
    # Check system resources
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 8 ]; then
        print_warning "You have ${TOTAL_MEM}GB RAM. 8GB+ recommended for production."
    else
        print_status "✓ Sufficient memory: ${TOTAL_MEM}GB"
    fi
    
    # Check disk space
    DISK_SPACE=$(df -h / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$DISK_SPACE" -lt 50 ]; then
        print_warning "You have ${DISK_SPACE}GB free disk space. 50GB+ recommended."
    else
        print_status "✓ Sufficient disk space: ${DISK_SPACE}GB"
    fi
    
    # Check if running as root or with docker group
    if ! docker ps &>/dev/null; then
        print_error "Cannot run Docker commands. Please add user to docker group or run as root."
        exit 1
    fi
    print_status "✓ Docker permissions are configured"
}

# Setup environment
setup_environment() {
    print_header "Setting up Environment"
    
    # Create directory structure
    mkdir -p data/{postgres,redis,prometheus,grafana,logs}
    mkdir -p config/{nginx,prometheus,grafana}
    mkdir -p ssl
    
    # Set proper permissions
    chmod 755 data/postgres data/redis
    chmod 777 data/logs
    
    print_status "✓ Directory structure created"
    
    # Generate SSL certificates (self-signed for private use)
    if [ ! -f ssl/server.crt ]; then
        print_status "Generating self-signed SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/server.key \
            -out ssl/server.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN_NAME"
        
        print_status "✓ SSL certificates generated"
    fi
}

# Create production Docker Compose file
create_docker_compose() {
    print_header "Creating Production Docker Compose Configuration"
    
    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # Load Balancer (Nginx)
  nginx:
    image: nginx:alpine
    container_name: community-coin-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - ./data/logs/nginx:/var/log/nginx
    depends_on:
      - app-1
      - app-2
    restart: unless-stopped
    networks:
      - app-network

  # Application Instances (for load balancing)
  app-1:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: community-coin-app-1
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/community_coin_db
      - REDIS_URL=redis://redis:6379
      - RUST_LOG=info
      - SERVER_PORT=8080
      - INSTANCE_ID=app-1
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  app-2:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: community-coin-app-2
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/community_coin_db
      - REDIS_URL=redis://redis:6379
      - RUST_LOG=info
      - SERVER_PORT=8080
      - INSTANCE_ID=app-2
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  # Database
  postgres:
    image: postgres:15-alpine
    container_name: community-coin-postgres
    environment:
      - POSTGRES_DB=community_coin_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./config/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - app-network
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: community-coin-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - ./data/redis:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Monitoring - Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: community-coin-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./data/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    networks:
      - app-network

  # Monitoring - Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: community-coin-grafana
    ports:
      - "3000:3000"
    volumes:
      - ./data/grafana:/var/lib/grafana
      - ./config/grafana/grafana.ini:/etc/grafana/grafana.ini
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
    restart: unless-stopped
    networks:
      - app-network

  # Log Management - ELK Stack (Optional)
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    container_name: community-coin-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - ./data/elasticsearch:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    restart: unless-stopped
    networks:
      - app-network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    container_name: community-coin-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    restart: unless-stopped
    networks:
      - app-network

  # Auto-scaling Service (Custom)
  autoscaler:
    build:
      context: ./autoscaler
      dockerfile: Dockerfile
    container_name: community-coin-autoscaler
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
      - COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - .:/app
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
  elasticsearch_data:
EOF

    print_status "✓ Docker Compose configuration created"
}

# Create Nginx configuration
create_nginx_config() {
    print_status "Creating Nginx load balancer configuration..."
    
    cat > config/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app_servers {
        server app-1:8080 max_fails=3 fail_timeout=30s;
        server app-2:8080 max_fails=3 fail_timeout=30s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/ssl/certs/server.crt;
        ssl_certificate_key /etc/ssl/certs/server.key;

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket endpoints
        location /ws/ {
            proxy_pass http://app_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://app_servers;
            proxy_set_header Host $host;
            access_log off;
        }

        # Metrics (restrict access)
        location /metrics {
            allow 10.0.0.0/8;
            allow 172.16.0.0/12;
            allow 192.168.0.0/16;
            deny all;
            proxy_pass http://app_servers;
        }

        # Static files (if serving frontend)
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

    print_status "✓ Nginx configuration created"
}

# Create PostgreSQL configuration
create_postgres_config() {
    print_status "Creating PostgreSQL configuration..."
    
    cat > config/postgres/postgresql.conf << 'EOF'
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 200
listen_addresses = '*'

# Write-ahead logging
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Checkpoints
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

# Query planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Background writer
bgwriter_delay = 200ms
bgwriter_lru_maxpages = 100
bgwriter_lru_multiplier = 2.0
EOF

    print_status "✓ PostgreSQL configuration created"
}

# Create Prometheus configuration
create_prometheus_config() {
    print_status "Creating Prometheus configuration..."
    
    cat > config/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'community-coin-app'
    static_configs:
      - targets: ['app-1:8080', 'app-2:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
EOF

    print_status "✓ Prometheus configuration created"
}

# Create autoscaler
create_autoscaler() {
    print_status "Creating autoscaler service..."
    
    mkdir -p autoscaler
    
    cat > autoscaler/Dockerfile << 'EOF'
FROM python:3.11-alpine

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY autoscaler.py .

CMD ["python", "autoscaler.py"]
EOF

    cat > autoscaler/requirements.txt << 'EOF'
docker==6.1.3
psutil==5.9.5
requests==2.31.0
EOF

    cat > autoscaler/autoscaler.py << 'EOF'
#!/usr/bin/env python3
"""
Simple Docker Compose autoscaler for Community Coin Server
Monitors CPU and memory usage and scales app instances
"""

import docker
import time
import os
import requests
import psutil
from typing import List, Dict

class AutoScaler:
    def __init__(self):
        self.client = docker.from_env()
        self.project_name = os.getenv('COMPOSE_PROJECT_NAME', 'community-coin')
        self.min_instances = 2
        self.max_instances = 10
        self.scale_up_threshold = 70  # CPU %
        self.scale_down_threshold = 30  # CPU %
        self.check_interval = 60  # seconds
        
    def get_app_containers(self) -> List[docker.models.containers.Container]:
        """Get all running app containers"""
        containers = []
        for container in self.client.containers.list():
            if 'community-coin-app' in container.name:
                containers.append(container)
        return containers
    
    def get_system_metrics(self) -> Dict[str, float]:
        """Get system CPU and memory metrics"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        
        return {
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_available_gb': memory.available / (1024**3)
        }
    
    def get_app_metrics(self, containers: List) -> Dict[str, float]:
        """Get application-specific metrics"""
        total_cpu = 0
        total_memory = 0
        healthy_containers = 0
        
        for container in containers:
            try:
                # Check health
                health_url = f"http://{container.name}:8080/health"
                response = requests.get(health_url, timeout=5)
                if response.status_code == 200:
                    healthy_containers += 1
                
                # Get container stats
                stats = container.stats(stream=False)
                
                # Calculate CPU percentage
                cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                           stats['precpu_stats']['cpu_usage']['total_usage']
                system_delta = stats['cpu_stats']['system_cpu_usage'] - \
                              stats['precpu_stats']['system_cpu_usage']
                
                if system_delta > 0:
                    cpu_percent = (cpu_delta / system_delta) * 100
                    total_cpu += cpu_percent
                
                # Calculate memory percentage
                memory_usage = stats['memory_stats']['usage']
                memory_limit = stats['memory_stats']['limit']
                memory_percent = (memory_usage / memory_limit) * 100
                total_memory += memory_percent
                
            except Exception as e:
                print(f"Error getting metrics for {container.name}: {e}")
        
        if healthy_containers > 0:
            return {
                'avg_cpu_percent': total_cpu / healthy_containers,
                'avg_memory_percent': total_memory / healthy_containers,
                'healthy_containers': healthy_containers
            }
        
        return {'avg_cpu_percent': 0, 'avg_memory_percent': 0, 'healthy_containers': 0}
    
    def scale_up(self, current_count: int) -> bool:
        """Scale up by adding a new app instance"""
        if current_count >= self.max_instances:
            print(f"Already at maximum instances ({self.max_instances})")
            return False
        
        new_instance_num = current_count + 1
        container_name = f"community-coin-app-{new_instance_num}"
        
        try:
            # Run new container
            self.client.containers.run(
                image=f"{self.project_name}_app-1",  # Use same image as app-1
                name=container_name,
                environment={
                    'DATABASE_URL': os.getenv('DATABASE_URL'),
                    'REDIS_URL': os.getenv('REDIS_URL'),
                    'RUST_LOG': 'info',
                    'SERVER_PORT': '8080',
                    'INSTANCE_ID': f'app-{new_instance_num}'
                },
                network=f"{self.project_name}_app-network",
                detach=True,
                restart_policy={"Name": "unless-stopped"}
            )
            
            print(f"Scaled up: Created {container_name}")
            return True
            
        except Exception as e:
            print(f"Error scaling up: {e}")
            return False
    
    def scale_down(self, containers: List, current_count: int) -> bool:
        """Scale down by removing the newest app instance"""
        if current_count <= self.min_instances:
            print(f"Already at minimum instances ({self.min_instances})")
            return False
        
        # Find the highest numbered container
        highest_num = 0
        target_container = None
        
        for container in containers:
            try:
                num = int(container.name.split('-')[-1])
                if num > highest_num:
                    highest_num = num
                    target_container = container
            except:
                continue
        
        if target_container:
            try:
                target_container.stop()
                target_container.remove()
                print(f"Scaled down: Removed {target_container.name}")
                return True
            except Exception as e:
                print(f"Error scaling down: {e}")
                return False
        
        return False
    
    def run(self):
        """Main autoscaler loop"""
        print("Starting Community Coin Autoscaler...")
        
        while True:
            try:
                containers = self.get_app_containers()
                current_count = len(containers)
                
                if current_count == 0:
                    print("No app containers found, skipping...")
                    time.sleep(self.check_interval)
                    continue
                
                system_metrics = self.get_system_metrics()
                app_metrics = self.get_app_metrics(containers)
                
                print(f"Instances: {current_count}, "
                      f"System CPU: {system_metrics['cpu_percent']:.1f}%, "
                      f"App CPU: {app_metrics['avg_cpu_percent']:.1f}%, "
                      f"Memory: {system_metrics['memory_percent']:.1f}%")
                
                # Scaling decisions
                avg_cpu = app_metrics['avg_cpu_percent']
                
                if avg_cpu > self.scale_up_threshold and system_metrics['memory_available_gb'] > 1:
                    print(f"High CPU usage ({avg_cpu:.1f}%), scaling up...")
                    self.scale_up(current_count)
                    
                elif avg_cpu < self.scale_down_threshold and current_count > self.min_instances:
                    print(f"Low CPU usage ({avg_cpu:.1f}%), scaling down...")
                    self.scale_down(containers, current_count)
                
            except Exception as e:
                print(f"Error in autoscaler loop: {e}")
            
            time.sleep(self.check_interval)

if __name__ == "__main__":
    autoscaler = AutoScaler()
    autoscaler.run()
EOF

    print_status "✓ Autoscaler service created"
}

# Create environment file
create_env_file() {
    print_status "Creating environment file..."
    
    if [ ! -f .env.prod ]; then
        cat > .env.prod << EOF
# Production Environment Variables
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
GRAFANA_ADMIN_PASSWORD=admin123

# Project configuration
COMPOSE_PROJECT_NAME=community-coin
DOMAIN_NAME=$DOMAIN_NAME
EOF
        print_status "✓ Environment file created"
    else
        print_status "✓ Environment file already exists"
    fi
}

# Deploy the application
deploy_application() {
    print_header "Deploying Application"
    
    # Build the application
    print_status "Building application Docker image..."
    docker build -f Dockerfile.prod -t community-coin-server:latest .
    
    # Start services
    print_status "Starting services with Docker Compose..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
    
    print_status "✓ Application deployed successfully"
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    services=("postgres" "redis" "app-1" "app-2" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps | grep -q "$service.*Up"; then
            print_status "✓ $service is running"
        else
            print_warning "⚠ $service is not running properly"
        fi
    done
}

# Setup monitoring dashboards
setup_monitoring() {
    print_header "Setting up Monitoring"
    
    # Wait for Grafana to be ready
    print_status "Waiting for Grafana to be ready..."
    sleep 20
    
    # Import Grafana dashboards (placeholder)
    print_status "Grafana is available at: http://localhost:3000"
    print_status "Default credentials: admin / admin123"
    print_status "Prometheus is available at: http://localhost:9090"
    print_status "Kibana is available at: http://localhost:5601"
    
    print_status "✓ Monitoring setup completed"
}

# Display deployment summary
display_summary() {
    print_header "Deployment Summary"
    
    echo -e "${GREEN}🎉 Private Datacenter Deployment Successful!${NC}"
    echo ""
    echo -e "${BLUE}Application Endpoints:${NC}"
    echo "  🌐 HTTPS API: https://$DOMAIN_NAME"
    echo "  🔓 HTTP API: http://localhost"
    echo "  🏥 Health Check: https://$DOMAIN_NAME/health"
    echo ""
    echo -e "${BLUE}Monitoring & Management:${NC}"
    echo "  📊 Grafana: http://localhost:3000 (admin/admin123)"
    echo "  📈 Prometheus: http://localhost:9090"
    echo "  📋 Kibana: http://localhost:5601"
    echo "  🗄️  PostgreSQL: localhost:5432"
    echo "  ⚡ Redis: localhost:6379"
    echo ""
    echo -e "${BLUE}Docker Services:${NC}"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo -e "${YELLOW}Management Commands:${NC}"
    echo "  📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  🔄 Restart: docker-compose -f docker-compose.prod.yml restart"
    echo "  ⬇️  Scale down: docker-compose -f docker-compose.prod.yml down"
    echo "  📈 Scale app: docker-compose -f docker-compose.prod.yml up -d --scale app-1=3"
    echo ""
    echo -e "${GREEN}💰 Cost Benefits:${NC}"
    echo "  ✅ No cloud provider costs"
    echo "  ✅ Full control over hardware"
    echo "  ✅ Automatic scaling within hardware limits"
    echo "  ✅ Comprehensive monitoring included"
    echo "  ✅ SSL/TLS encryption enabled"
}

# Main deployment flow
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 Community Coin Server                        ║"
    echo "║              Private Datacenter Deployment                   ║"
    echo "║            Self-Hosted Auto-Scaling Solution                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    setup_environment
    create_docker_compose
    create_nginx_config
    create_postgres_config
    create_prometheus_config
    create_autoscaler
    create_env_file
    deploy_application
    setup_monitoring
    display_summary
    
    print_status "🚀 Private datacenter deployment completed successfully!"
}

# Run main function
main "$@" 