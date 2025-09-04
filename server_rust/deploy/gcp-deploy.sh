#!/bin/bash

# GCP Deployment Script for Community Coin Server
# Auto-scaling deployment using Google Cloud services

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
GCP_REGION="us-central1"
GCP_ZONE="us-central1-a"

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
    
    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed. Please install it first."
        echo "Install: curl https://sdk.cloud.google.com | bash"
        exit 1
    fi
    print_status "✓ Google Cloud CLI is installed"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install it first."
        exit 1
    fi
    print_status "✓ kubectl is installed"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    print_status "✓ Docker is installed"
    
    # Check GCP authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "GCP not authenticated. Run 'gcloud auth login' first."
        exit 1
    fi
    print_status "✓ GCP authentication is configured"
    
    # Get GCP project ID
    GCP_PROJECT_ID=$(gcloud config get-value project)
    if [ -z "$GCP_PROJECT_ID" ]; then
        print_error "No GCP project set. Run 'gcloud config set project PROJECT_ID' first."
        exit 1
    fi
    print_status "✓ GCP Project ID: $GCP_PROJECT_ID"
}

# Enable required APIs
enable_apis() {
    print_header "Enabling Required GCP APIs"
    
    REQUIRED_APIS=(
        "container.googleapis.com"
        "cloudsql.googleapis.com"
        "redis.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "compute.googleapis.com"
        "cloudbuild.googleapis.com"
        "artifactregistry.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
    )
    
    for api in "${REQUIRED_APIS[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable $api --project=$GCP_PROJECT_ID
    done
    
    print_status "✓ All required APIs enabled"
}

# Create GKE cluster with auto-scaling
create_gke_cluster() {
    print_header "Creating GKE Auto-scaling Cluster"
    
    CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
    
    # Check if cluster already exists
    if gcloud container clusters describe $CLUSTER_NAME --zone=$GCP_ZONE --project=$GCP_PROJECT_ID &>/dev/null; then
        print_status "✓ GKE cluster already exists: $CLUSTER_NAME"
        return
    fi
    
    print_status "Creating GKE cluster with auto-scaling..."
    gcloud container clusters create $CLUSTER_NAME \
        --zone=$GCP_ZONE \
        --project=$GCP_PROJECT_ID \
        --machine-type=e2-small \
        --num-nodes=1 \
        --min-nodes=1 \
        --max-nodes=100 \
        --enable-autoscaling \
        --enable-autorepair \
        --enable-autoupgrade \
        --disk-size=20GB \
        --disk-type=pd-standard \
        --preemptible \
        --enable-network-policy \
        --enable-ip-alias \
        --no-enable-basic-auth \
        --no-issue-client-certificate
    
    # Get cluster credentials
    gcloud container clusters get-credentials $CLUSTER_NAME --zone=$GCP_ZONE --project=$GCP_PROJECT_ID
    
    print_status "✓ GKE cluster created and configured"
}

# Create Cloud SQL PostgreSQL instance
create_cloud_sql() {
    print_header "Creating Cloud SQL PostgreSQL Instance"
    
    SQL_INSTANCE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-postgres"
    
    # Check if instance already exists
    if gcloud sql instances describe $SQL_INSTANCE_NAME --project=$GCP_PROJECT_ID &>/dev/null; then
        print_status "✓ Cloud SQL instance already exists: $SQL_INSTANCE_NAME"
        return
    fi
    
    print_status "Creating Cloud SQL PostgreSQL instance..."
    gcloud sql instances create $SQL_INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT_ID \
        --storage-type=SSD \
        --storage-size=20GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=04 \
        --enable-bin-log \
        --deletion-protection
    
    # Create database
    gcloud sql databases create community_coin_db \
        --instance=$SQL_INSTANCE_NAME \
        --project=$GCP_PROJECT_ID
    
    # Create database user
    DB_PASSWORD=$(openssl rand -base64 32)
    gcloud sql users create appuser \
        --instance=$SQL_INSTANCE_NAME \
        --password=$DB_PASSWORD \
        --project=$GCP_PROJECT_ID
    
    # Store password in Secret Manager
    echo -n $DB_PASSWORD | gcloud secrets create db-password --data-file=- --project=$GCP_PROJECT_ID
    
    print_status "✓ Cloud SQL instance created and configured"
}

# Create Redis instance
create_redis() {
    print_header "Creating Redis Instance"
    
    REDIS_INSTANCE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-redis"
    
    # Check if instance already exists
    if gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$GCP_REGION --project=$GCP_PROJECT_ID &>/dev/null; then
        print_status "✓ Redis instance already exists: $REDIS_INSTANCE_NAME"
        return
    fi
    
    print_status "Creating Redis instance..."
    gcloud redis instances create $REDIS_INSTANCE_NAME \
        --size=1 \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT_ID \
        --redis-version=redis_7_0 \
        --tier=basic \
        --enable-auth
    
    print_status "✓ Redis instance created"
}

# Build and push Docker image
build_and_push_image() {
    print_header "Building and Pushing Docker Image"
    
    # Create Artifact Registry repository
    REPO_NAME="${PROJECT_NAME}-repo"
    
    if ! gcloud artifacts repositories describe $REPO_NAME --location=$GCP_REGION --project=$GCP_PROJECT_ID &>/dev/null; then
        print_status "Creating Artifact Registry repository..."
        gcloud artifacts repositories create $REPO_NAME \
            --repository-format=docker \
            --location=$GCP_REGION \
            --project=$GCP_PROJECT_ID
    fi
    
    # Configure Docker authentication
    gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev
    
    # Build and tag image
    IMAGE_URI="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO_NAME}/community-coin-server:latest"
    
    print_status "Building Docker image..."
    docker build -f Dockerfile.prod -t $IMAGE_URI .
    
    print_status "Pushing Docker image to Artifact Registry..."
    docker push $IMAGE_URI
    
    print_status "✓ Docker image built and pushed: $IMAGE_URI"
}

# Deploy to GKE
deploy_to_gke() {
    print_header "Deploying to GKE"
    
    # Create Kubernetes manifests
    create_k8s_manifests
    
    # Apply manifests
    print_status "Applying Kubernetes manifests..."
    kubectl apply -f k8s/
    
    # Wait for deployment
    print_status "Waiting for deployment to be ready..."
    kubectl rollout status deployment/community-coin-server
    
    # Get external IP
    print_status "Getting external IP address..."
    EXTERNAL_IP=""
    while [ -z $EXTERNAL_IP ]; do
        echo "Waiting for external IP..."
        EXTERNAL_IP=$(kubectl get svc community-coin-service --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}")
        [ -z "$EXTERNAL_IP" ] && sleep 10
    done
    
    print_status "✓ Application deployed successfully"
    print_status "✓ External IP: $EXTERNAL_IP"
}

# Create Kubernetes manifests
create_k8s_manifests() {
    print_status "Creating Kubernetes manifests..."
    
    mkdir -p k8s
    
    # Deployment manifest
    cat > k8s/deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: community-coin-server
  labels:
    app: community-coin-server
spec:
  replicas: 1
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
        image: ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO_NAME}/community-coin-server:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
        - name: RUST_LOG
          value: "info"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: community-coin-service
spec:
  selector:
    app: community-coin-server
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: community-coin-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: community-coin-server
  minReplicas: 1
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF
    
    # Create secrets
    SQL_CONNECTION_NAME=$(gcloud sql instances describe ${PROJECT_NAME}-${ENVIRONMENT}-postgres --project=$GCP_PROJECT_ID --format="value(connectionName)")
    REDIS_HOST=$(gcloud redis instances describe ${PROJECT_NAME}-${ENVIRONMENT}-redis --region=$GCP_REGION --project=$GCP_PROJECT_ID --format="value(host)")
    
    kubectl create secret generic app-secrets \
        --from-literal=database-url="postgresql://appuser:$(gcloud secrets versions access latest --secret=db-password --project=$GCP_PROJECT_ID)@$SQL_CONNECTION_NAME/community_coin_db" \
        --from-literal=redis-url="redis://$REDIS_HOST:6379" \
        --dry-run=client -o yaml > k8s/secrets.yaml
    
    print_status "✓ Kubernetes manifests created"
}

# Setup monitoring
setup_monitoring() {
    print_header "Setting up Monitoring"
    
    # Enable Google Cloud Monitoring
    print_status "Configuring Cloud Monitoring..."
    
    # Create uptime check
    cat > uptime-check.json << EOF
{
  "displayName": "Community Coin Server Uptime",
  "httpCheck": {
    "path": "/health",
    "port": 80
  },
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "project_id": "$GCP_PROJECT_ID",
      "host": "$EXTERNAL_IP"
    }
  },
  "checkIntervalSeconds": 60,
  "timeout": "10s"
}
EOF
    
    gcloud alpha monitoring uptime create-config uptime-check.json --project=$GCP_PROJECT_ID
    rm uptime-check.json
    
    print_status "✓ Monitoring configured"
}

# Display deployment summary
display_summary() {
    print_header "Deployment Summary"
    
    echo -e "${GREEN}🎉 GCP Deployment Successful!${NC}"
    echo ""
    echo -e "${BLUE}Application Endpoints:${NC}"
    echo "  🌐 API URL: http://$EXTERNAL_IP"
    echo "  🏥 Health Check: http://$EXTERNAL_IP/health"
    echo ""
    echo -e "${BLUE}GCP Resources:${NC}"
    echo "  🚀 GKE Cluster: ${PROJECT_NAME}-${ENVIRONMENT}-cluster"
    echo "  🗄️  Cloud SQL: ${PROJECT_NAME}-${ENVIRONMENT}-postgres"
    echo "  ⚡ Redis: ${PROJECT_NAME}-${ENVIRONMENT}-redis"
    echo "  📦 Artifact Registry: $REPO_NAME"
    echo ""
    echo -e "${BLUE}Monitoring:${NC}"
    echo "  📊 Cloud Console: https://console.cloud.google.com/kubernetes/workload?project=$GCP_PROJECT_ID"
    echo "  📈 Monitoring: https://console.cloud.google.com/monitoring?project=$GCP_PROJECT_ID"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Set up custom domain with Cloud DNS"
    echo "  2. Configure SSL certificate with managed certificates"
    echo "  3. Set up Cloud Build for CI/CD"
    echo "  4. Configure alerting policies"
    echo ""
    echo -e "${GREEN}💰 Cost Optimization Active:${NC}"
    echo "  ✓ Preemptible nodes (up to 80% cost savings)"
    echo "  ✓ Auto-scaling from 1 to 100 nodes"
    echo "  ✓ f1-micro Cloud SQL instance"
    echo "  ✓ Basic tier Redis"
    echo "  ✓ Regional persistent disks"
}

# Main deployment flow
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 Community Coin Server                        ║"
    echo "║                GCP Auto-Scaling Deployment                   ║"
    echo "║              Cost-Optimized for Any Scale                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    enable_apis
    create_gke_cluster
    create_cloud_sql
    create_redis
    build_and_push_image
    deploy_to_gke
    setup_monitoring
    display_summary
    
    print_status "🚀 GCP deployment completed successfully!"
}

# Run main function
main "$@" 