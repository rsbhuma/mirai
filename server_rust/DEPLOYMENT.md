# 🚀 Production Deployment Guide

This guide covers deploying the Community Coin Server to production environments including Docker, cloud platforms, and best practices for scalability and security.

## 📋 Pre-deployment Checklist

### ✅ Security
- [ ] Change all default passwords and secrets
- [ ] Set strong JWT secret (32+ characters)
- [ ] Configure CORS for your domain
- [ ] Enable HTTPS/TLS certificates
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable database encryption at rest

### ✅ Configuration
- [ ] Production environment variables set
- [ ] Database connection strings configured
- [ ] Redis cluster/sentinel setup
- [ ] Solana mainnet RPC endpoints
- [ ] Monitoring and logging configured
- [ ] Backup strategies in place

### ✅ Performance
- [ ] Database indexes optimized
- [ ] Connection pooling configured
- [ ] Redis caching strategy implemented
- [ ] Load balancing configured
- [ ] CDN setup for static assets

## 🐳 Docker Deployment

### Production Dockerfile

Create a multi-stage production Dockerfile:

```dockerfile
# Build stage
FROM rust:1.75-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm src/main.rs

# Copy source code
COPY src ./src
COPY migrations ./migrations

# Build the application
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary
COPY --from=builder /app/target/release/community_coin_server /app/server
COPY --from=builder /app/migrations /app/migrations

# Create non-root user
RUN useradd -r -s /bin/false appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

CMD ["./server"]
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/community_coin_db
      - REDIS_URL=redis://redis:6379
      - RUST_LOG=info
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=community_coin_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Production Environment File

```bash
# Create production .env
cat > .env.production << EOF
# Server Configuration
PORT=8080
ENVIRONMENT=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/community_coin_db

# Redis
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# Solana (Mainnet)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
COMMCOIN_PROGRAM_ID=${YOUR_PROGRAM_ID}

# Authentication
JWT_SECRET=${STRONG_JWT_SECRET}

# Supabase
SUPABASE_URL=${YOUR_SUPABASE_URL}
SUPABASE_ANON_KEY=${YOUR_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${YOUR_SUPABASE_SERVICE_KEY}
EOF
```

### Deploy with Docker

```bash
# Set environment variables
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)
export STRONG_JWT_SECRET=$(openssl rand -base64 64)

# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec app ./server migrate

# Check status
docker-compose ps
docker-compose logs -f app
```

## ☁️ Cloud Platform Deployments

### AWS Deployment

#### 1. ECS with Fargate

```yaml
# task-definition.json
{
  "family": "community-coin-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "community-coin-server",
      "image": "your-ecr-repo/community-coin-server:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/community-coin-server",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 2. RDS PostgreSQL Setup

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier community-coin-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password ${DB_PASSWORD} \
  --allocated-storage 100 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name community-coin-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted
```

#### 3. ElastiCache Redis Setup

```bash
# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id community-coin-redis \
  --description "Community Coin Redis Cluster" \
  --num-cache-clusters 2 \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --port 6379 \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-group-name community-coin-cache-subnet
```

### Google Cloud Platform (GCP)

#### 1. Cloud Run Deployment

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/community-coin-server', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/community-coin-server']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'community-coin-server'
      - '--image'
      - 'gcr.io/$PROJECT_ID/community-coin-server'
      - '--platform'
      - 'managed'
      - '--region'
      - 'us-central1'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'ENVIRONMENT=production'
```

#### 2. Cloud SQL PostgreSQL

```bash
# Create Cloud SQL instance
gcloud sql instances create community-coin-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-4096 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=100GB \
  --backup-start-time=03:00 \
  --enable-bin-log
```

### DigitalOcean Deployment

#### 1. App Platform

```yaml
# .do/app.yaml
name: community-coin-server
services:
- name: api
  source_dir: /
  github:
    repo: your-username/community-coin-server
    branch: main
  run_command: ./server
  environment_slug: rust
  instance_count: 2
  instance_size_slug: basic-xxs
  env:
  - key: ENVIRONMENT
    value: production
  - key: DATABASE_URL
    type: SECRET
  - key: REDIS_URL
    type: SECRET
databases:
- name: community-coin-db
  engine: PG
  version: "15"
  size: db-s-1vcpu-1gb
```

## 🔧 Infrastructure as Code

### Terraform Configuration

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "community-coin-vpc"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "community-coin-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier             = "community-coin-db"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  storage_encrypted      = true
  db_name               = "community_coin_db"
  username              = var.db_username
  password              = var.db_password
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  backup_retention_period = 7
  skip_final_snapshot    = false
}
```

## 🔒 Security Best Practices

### 1. Environment Variables

```bash
# Use strong secrets
export JWT_SECRET=$(openssl rand -base64 64)
export DB_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)

# Store in secure secret management
aws secretsmanager create-secret \
  --name "community-coin/jwt-secret" \
  --secret-string "${JWT_SECRET}"
```

### 2. Network Security

```bash
# Firewall rules (UFW example)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://app:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 📊 Monitoring & Observability

### 1. Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'community-coin-server'
    static_configs:
      - targets: ['app:8080']
    metrics_path: '/metrics'
```

### 2. Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Community Coin Server",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### 3. Logging with ELK Stack

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Run tests
        run: cargo test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: community-coin-server
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster community-coin-cluster \
            --service community-coin-service \
            --force-new-deployment
```

## 📈 Scaling Strategies

### 1. Horizontal Scaling

```yaml
# kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: community-coin-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: community-coin-server
  template:
    metadata:
      labels:
        app: community-coin-server
    spec:
      containers:
      - name: server
        image: community-coin-server:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: community-coin-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: community-coin-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 2. Database Scaling

```bash
# PostgreSQL Read Replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier community-coin-db-replica \
  --source-db-instance-identifier community-coin-db \
  --db-instance-class db.t3.medium
```

### 3. Redis Clustering

```bash
# Redis Cluster Mode
aws elasticache create-replication-group \
  --replication-group-id community-coin-redis-cluster \
  --num-node-groups 3 \
  --replicas-per-node-group 1 \
  --cache-node-type cache.r6g.large
```

## 🔧 Maintenance & Operations

### 1. Database Backups

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/community_coin_db_${TIMESTAMP}.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://your-backup-bucket/database/

# Clean old local backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### 2. Health Monitoring

```bash
#!/bin/bash
# health-check.sh
HEALTH_URL="https://your-domain.com/health"
SLACK_WEBHOOK="your-slack-webhook-url"

if ! curl -f $HEALTH_URL > /dev/null 2>&1; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 Community Coin Server is DOWN!"}' \
        $SLACK_WEBHOOK
fi
```

### 3. Log Rotation

```bash
# /etc/logrotate.d/community-coin-server
/var/log/community-coin-server/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 appuser appuser
    postrotate
        systemctl reload community-coin-server
    endscript
}
```

## 🚨 Disaster Recovery

### 1. Backup Strategy

- **Database**: Daily automated backups with 30-day retention
- **Redis**: AOF persistence with daily snapshots
- **Application**: Container images stored in registry
- **Configuration**: Infrastructure as Code in version control

### 2. Recovery Procedures

```bash
# Database Recovery
pg_restore -d community_coin_db backup_file.sql

# Redis Recovery
redis-cli --rdb dump.rdb

# Application Recovery
docker-compose up -d
```

### 3. Failover Strategy

- **Multi-AZ deployment** for high availability
- **Load balancer health checks** for automatic failover
- **Database read replicas** for read scaling
- **Cross-region backups** for disaster recovery

---

## 📞 Support

For deployment support:
- Check the [main README](README.md) for development setup
- Create an issue for deployment-specific problems
- Review logs and monitoring dashboards first

**Remember**: Always test deployments in a staging environment first! 🚀 