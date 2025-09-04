#!/bin/bash

# GCP Frontend Deployment Script for Community Coin Client
# Cost-optimized CDN deployment using Google Cloud services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="community-coin-frontend"
ENVIRONMENT="production"
GCP_REGION="us-central1"

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
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    print_status "✓ Node.js is installed ($(node --version))"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install it first."
        exit 1
    fi
    print_status "✓ npm is installed ($(npm --version))"
    
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
        "storage-api.googleapis.com"
        "compute.googleapis.com"
        "cloudbuild.googleapis.com"
        "dns.googleapis.com"
    )
    
    for api in "${REQUIRED_APIS[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable $api --project=$GCP_PROJECT_ID
    done
    
    print_status "✓ All required APIs enabled"
}

# Create Cloud Storage bucket
create_storage_bucket() {
    print_header "Creating Cloud Storage Bucket"
    
    BUCKET_NAME="${PROJECT_NAME}-static-${GCP_PROJECT_ID}"
    
    # Check if bucket already exists
    if gsutil ls -b gs://$BUCKET_NAME &>/dev/null; then
        print_status "✓ Storage bucket already exists: $BUCKET_NAME"
    else
        print_status "Creating Cloud Storage bucket..."
        gsutil mb -p $GCP_PROJECT_ID -c STANDARD -l $GCP_REGION gs://$BUCKET_NAME
        
        # Enable website configuration
        gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
        
        # Make bucket publicly readable
        gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
        
        print_status "✓ Storage bucket created and configured"
    fi
    
    echo $BUCKET_NAME > .bucket_name
}

# Build React application
build_react_app() {
    print_header "Building React Application"
    
    # Install dependencies
    print_status "Installing npm dependencies..."
    npm ci
    
    # Create production environment file
    print_status "Creating production environment configuration..."
    cat > .env.production << EOF
VITE_API_URL=https://api.communitycoin.com
VITE_SOLANA_NETWORK=https://api.devnet.solana.com
VITE_APP_NAME=Community Coin
VITE_APP_VERSION=$(date +%Y%m%d-%H%M%S)
EOF
    
    # Build the application
    print_status "Building React application with Vite..."
    npm run build
    
    # Verify build
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not found"
        exit 1
    fi
    
    print_status "✓ React application built successfully"
    print_status "Build size: $(du -sh dist | cut -f1)"
}

# Deploy to Cloud Storage
deploy_to_storage() {
    print_header "Deploying to Cloud Storage"
    
    BUCKET_NAME=$(cat .bucket_name)
    
    # Upload static assets with long cache headers
    print_status "Uploading static assets..."
    gsutil -m rsync -r -d dist/ gs://$BUCKET_NAME/
    
    # Set cache headers for different file types
    print_status "Setting cache headers..."
    
    # Long cache for static assets (1 year)
    gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" \
        gs://$BUCKET_NAME/assets/**
    
    # Short cache for HTML files (5 minutes)
    gsutil -m setmeta -h "Cache-Control:public, max-age=300, must-revalidate" \
        gs://$BUCKET_NAME/*.html
    
    # Set correct content types
    gsutil -m setmeta -h "Content-Type:text/html; charset=utf-8" \
        gs://$BUCKET_NAME/*.html
    
    print_status "✓ Files uploaded to Cloud Storage"
}

# Setup Cloud CDN
setup_cloud_cdn() {
    print_header "Setting up Cloud CDN"
    
    BUCKET_NAME=$(cat .bucket_name)
    BACKEND_BUCKET_NAME="${PROJECT_NAME}-backend"
    LOAD_BALANCER_NAME="${PROJECT_NAME}-lb"
    
    # Create backend bucket
    if ! gcloud compute backend-buckets describe $BACKEND_BUCKET_NAME --global &>/dev/null; then
        print_status "Creating backend bucket..."
        gcloud compute backend-buckets create $BACKEND_BUCKET_NAME \
            --gcs-bucket-name=$BUCKET_NAME \
            --enable-cdn \
            --global
    fi
    
    # Create URL map
    if ! gcloud compute url-maps describe $LOAD_BALANCER_NAME --global &>/dev/null; then
        print_status "Creating URL map..."
        gcloud compute url-maps create $LOAD_BALANCER_NAME \
            --default-backend-bucket=$BACKEND_BUCKET_NAME \
            --global
    fi
    
    # Create HTTPS proxy
    if ! gcloud compute target-https-proxies describe ${LOAD_BALANCER_NAME}-https-proxy --global &>/dev/null; then
        print_status "Creating HTTPS proxy..."
        
        # Create SSL certificate (self-managed)
        if ! gcloud compute ssl-certificates describe ${PROJECT_NAME}-ssl-cert --global &>/dev/null; then
            print_status "Creating managed SSL certificate..."
            gcloud compute ssl-certificates create ${PROJECT_NAME}-ssl-cert \
                --domains=app.communitycoin.com \
                --global
        fi
        
        gcloud compute target-https-proxies create ${LOAD_BALANCER_NAME}-https-proxy \
            --url-map=$LOAD_BALANCER_NAME \
            --ssl-certificates=${PROJECT_NAME}-ssl-cert \
            --global
    fi
    
    # Create global forwarding rule
    if ! gcloud compute forwarding-rules describe ${LOAD_BALANCER_NAME}-https --global &>/dev/null; then
        print_status "Creating forwarding rule..."
        gcloud compute forwarding-rules create ${LOAD_BALANCER_NAME}-https \
            --target-https-proxy=${LOAD_BALANCER_NAME}-https-proxy \
            --global \
            --ports=443
    fi
    
    # Get the external IP
    EXTERNAL_IP=$(gcloud compute forwarding-rules describe ${LOAD_BALANCER_NAME}-https --global --format="value(IPAddress)")
    
    print_status "✓ Cloud CDN configured"
    print_status "✓ External IP: $EXTERNAL_IP"
    
    echo $EXTERNAL_IP > .external_ip
}

# Setup monitoring
setup_monitoring() {
    print_header "Setting up Monitoring"
    
    BUCKET_NAME=$(cat .bucket_name)
    
    # Create uptime check
    cat > uptime-check.json << EOF
{
  "displayName": "Community Coin Frontend Uptime",
  "httpCheck": {
    "path": "/",
    "port": 443,
    "useSsl": true
  },
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "project_id": "$GCP_PROJECT_ID",
      "host": "$(cat .external_ip)"
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
    
    BUCKET_NAME=$(cat .bucket_name)
    EXTERNAL_IP=$(cat .external_ip)
    
    echo -e "${GREEN}🎉 GCP Frontend Deployment Successful!${NC}"
    echo ""
    echo -e "${BLUE}Application Endpoints:${NC}"
    echo "  🌐 HTTPS URL: https://$EXTERNAL_IP"
    echo "  🌍 Storage URL: https://storage.googleapis.com/$BUCKET_NAME/index.html"
    echo ""
    echo -e "${BLUE}GCP Resources:${NC}"
    echo "  📦 Storage Bucket: $BUCKET_NAME"
    echo "  🌍 Load Balancer: ${PROJECT_NAME}-lb"
    echo "  🔒 SSL Certificate: ${PROJECT_NAME}-ssl-cert"
    echo "  📡 External IP: $EXTERNAL_IP"
    echo ""
    echo -e "${BLUE}Monitoring:${NC}"
    echo "  📊 Cloud Console: https://console.cloud.google.com/storage/browser/$BUCKET_NAME?project=$GCP_PROJECT_ID"
    echo "  🌍 Load Balancer: https://console.cloud.google.com/net-services/loadbalancing/list/loadBalancers?project=$GCP_PROJECT_ID"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Point your domain to IP: $EXTERNAL_IP"
    echo "  2. Update SSL certificate with your domain"
    echo "  3. Set up Cloud Build for CI/CD"
    echo "  4. Configure monitoring alerts"
    echo ""
    echo -e "${GREEN}💰 Cost Optimization Active:${NC}"
    echo "  ✅ Cloud Storage Standard class"
    echo "  ✅ Cloud CDN for global distribution"
    echo "  ✅ Aggressive caching headers"
    echo "  ✅ Compressed content delivery"
    
    # Cleanup temp files
    rm -f .bucket_name .external_ip
}

# Main deployment flow
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                Community Coin Frontend                       ║"
    echo "║                GCP CDN Auto-Scaling Deployment              ║"
    echo "║              Cost-Optimized Global Distribution             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    enable_apis
    create_storage_bucket
    build_react_app
    deploy_to_storage
    setup_cloud_cdn
    setup_monitoring
    display_summary
    
    print_status "🚀 GCP frontend deployment completed successfully!"
}

# Run main function
main "$@" 