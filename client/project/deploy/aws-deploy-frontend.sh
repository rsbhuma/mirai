#!/bin/bash

# AWS React Frontend Deployment Script
# Cost-optimized CDN deployment that scales with userbase

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
AWS_REGION="us-west-2"

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
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    print_status "✓ AWS CLI is installed"
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    print_status "✓ Terraform is installed"
    
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
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    print_status "✓ AWS credentials are configured"
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_status "✓ AWS Account ID: $AWS_ACCOUNT_ID"
}

# Setup Terraform backend
setup_terraform_backend() {
    print_header "Setting up Terraform Backend"
    
    BUCKET_NAME="${PROJECT_NAME}-terraform-state-${AWS_ACCOUNT_ID}"
    
    # Check if S3 bucket exists
    if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
        print_status "✓ Terraform state bucket already exists: $BUCKET_NAME"
    else
        print_status "Creating Terraform state bucket: $BUCKET_NAME"
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$BUCKET_NAME" \
            --versioning-configuration Status=Enabled
        
        # Enable encryption
        aws s3api put-bucket-encryption \
            --bucket "$BUCKET_NAME" \
            --server-side-encryption-configuration '{
                "Rules": [{
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }]
            }'
        
        print_status "✓ Terraform state bucket created and configured"
    fi
    
    # Update main.tf with backend configuration
    sed -i.bak "s|# bucket = \"community-coin-frontend-terraform-state\"|bucket = \"$BUCKET_NAME\"|g" terraform/main.tf
    sed -i.bak "s|# key    = \"frontend/terraform.tfstate\"|key    = \"frontend/terraform.tfstate\"|g" terraform/main.tf
    sed -i.bak "s|# region = \"us-west-2\"|region = \"$AWS_REGION\"|g" terraform/main.tf
    
    print_status "✓ Terraform backend configuration updated"
}

# Initialize Terraform
init_terraform() {
    print_header "Initializing Terraform"
    
    cd terraform
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f terraform.tfvars ]; then
        print_status "Creating terraform.tfvars from example..."
        cp terraform.tfvars.example terraform.tfvars
        
        # Update with current values
        sed -i.bak "s|aws_region   = \"us-west-2\"|aws_region   = \"$AWS_REGION\"|g" terraform.tfvars
        sed -i.bak "s|environment  = \"production\"|environment  = \"$ENVIRONMENT\"|g" terraform.tfvars
        
        print_warning "Please review and customize terraform.tfvars before proceeding"
        read -p "Press Enter to continue after reviewing terraform.tfvars..."
    fi
    
    terraform init
    print_status "✓ Terraform initialized"
    
    cd ..
}

# Plan Terraform deployment
plan_terraform() {
    print_header "Planning Terraform Deployment"
    
    cd terraform
    terraform plan -out=tfplan
    print_status "✓ Terraform plan created"
    
    echo -e "\n${YELLOW}Estimated Monthly Costs:${NC}"
    echo "Minimal usage (0-1K users): ~$5-15/month"
    echo "Moderate usage (1K-100K users): ~$15-50/month"
    echo "High usage (100K+ users): ~$50-200/month"
    echo ""
    echo "The CDN infrastructure scales automatically with your userbase."
    echo "CloudFront charges only for actual data transfer and requests."
    
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    cd ..
}

# Apply Terraform deployment
apply_terraform() {
    print_header "Applying Terraform Deployment"
    
    cd terraform
    terraform apply tfplan
    print_status "✓ Infrastructure deployed successfully"
    
    # Get outputs
    CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
    STATIC_BUCKET=$(terraform output -raw s3_bucket_name)
    DEPLOYMENT_BUCKET=$(terraform output -raw deployment_bucket_name)
    CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
    
    cd ..
    
    print_status "✓ CloudFront URL: $CLOUDFRONT_URL"
    print_status "✓ Static Bucket: $STATIC_BUCKET"
    print_status "✓ Deployment Bucket: $DEPLOYMENT_BUCKET"
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

# Deploy to S3 and CloudFront
deploy_to_aws() {
    print_header "Deploying to AWS"
    
    cd terraform
    STATIC_BUCKET=$(terraform output -raw s3_bucket_name)
    CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
    cd ..
    
    # Upload static assets with long cache headers
    print_status "Uploading static assets to S3..."
    aws s3 sync dist/assets/ s3://$STATIC_BUCKET/assets/ \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --metadata-directive REPLACE
    
    # Upload HTML and other files with short cache headers
    print_status "Uploading HTML files to S3..."
    aws s3 sync dist/ s3://$STATIC_BUCKET/ \
        --exclude "assets/*" \
        --delete \
        --cache-control "public, max-age=300, must-revalidate" \
        --metadata-directive REPLACE
    
    # Set correct content type for index.html
    aws s3 cp s3://$STATIC_BUCKET/index.html s3://$STATIC_BUCKET/index.html \
        --content-type "text/html; charset=utf-8" \
        --cache-control "public, max-age=300, must-revalidate" \
        --metadata-directive REPLACE
    
    # Create CloudFront invalidation
    print_status "Creating CloudFront invalidation..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_status "✓ CloudFront invalidation created: $INVALIDATION_ID"
    
    # Wait for invalidation to complete (optional)
    print_status "Waiting for CloudFront invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --id $INVALIDATION_ID
    
    print_status "✓ Deployment completed successfully"
}

# Setup monitoring
setup_monitoring() {
    print_header "Setting up Monitoring"
    
    cd terraform
    CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
    cd ..
    
    # Create CloudWatch dashboard
    cat > cloudwatch-dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/CloudFront", "Requests", "DistributionId", "$CLOUDFRONT_DISTRIBUTION_ID" ],
                    [ ".", "BytesDownloaded", ".", "." ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "CloudFront Traffic"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/CloudFront", "4xxErrorRate", "DistributionId", "$CLOUDFRONT_DISTRIBUTION_ID" ],
                    [ ".", "5xxErrorRate", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1",
                "title": "CloudFront Error Rates"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/CloudFront", "CacheHitRate", "DistributionId", "$CLOUDFRONT_DISTRIBUTION_ID" ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1",
                "title": "Cache Hit Rate"
            }
        }
    ]
}
EOF
    
    aws cloudwatch put-dashboard \
        --dashboard-name "$PROJECT_NAME-$ENVIRONMENT" \
        --dashboard-body file://cloudwatch-dashboard.json \
        --region us-east-1
    
    rm cloudwatch-dashboard.json
    
    print_status "✓ CloudWatch dashboard created"
}

# Display deployment summary
display_summary() {
    print_header "Deployment Summary"
    
    cd terraform
    CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
    STATIC_BUCKET=$(terraform output -raw s3_bucket_name)
    DEPLOYMENT_BUCKET=$(terraform output -raw deployment_bucket_name)
    CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
    cd ..
    
    echo -e "${GREEN}🎉 Frontend Deployment Successful!${NC}"
    echo ""
    echo -e "${BLUE}Application URLs:${NC}"
    echo "  🌐 Frontend URL: $CLOUDFRONT_URL"
    echo "  🏥 Health Check: $CLOUDFRONT_URL (should show your React app)"
    echo ""
    echo -e "${BLUE}AWS Resources:${NC}"
    echo "  📦 S3 Static Bucket: $STATIC_BUCKET"
    echo "  🚀 S3 Deployment Bucket: $DEPLOYMENT_BUCKET"
    echo "  🌍 CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    echo ""
    echo -e "${BLUE}Monitoring:${NC}"
    echo "  📊 CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$PROJECT_NAME-$ENVIRONMENT"
    echo "  🌍 CloudFront Console: https://console.aws.amazon.com/cloudfront/home#distribution-settings:$CLOUDFRONT_DISTRIBUTION_ID"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Set up your custom domain with Route53 and SSL certificate"
    echo "  2. Configure CI/CD pipeline for automated deployments"
    echo "  3. Test the application with your backend API"
    echo "  4. Set up monitoring alerts and notifications"
    echo ""
    echo -e "${GREEN}💰 Cost Optimization Active:${NC}"
    echo "  ✓ CloudFront PriceClass_100 (US, Canada, Europe only)"
    echo "  ✓ Aggressive caching for static assets (1 year TTL)"
    echo "  ✓ Short caching for HTML (5 minutes TTL)"
    echo "  ✓ S3 lifecycle policies for automatic cleanup"
    echo "  ✓ Compressed content delivery"
}

# Cleanup function
cleanup() {
    print_header "Cleanup Options"
    
    echo "To destroy the infrastructure later:"
    echo "  cd terraform && terraform destroy"
    echo ""
    echo "To update the application:"
    echo "  ./deploy/aws-deploy-frontend.sh --update-only"
}

# Main deployment flow
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                Community Coin Frontend                       ║"
    echo "║              AWS CDN Auto-Scaling Deployment                ║"
    echo "║            Cost-Optimized Global Distribution               ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check for update-only flag
    if [[ "$1" == "--update-only" ]]; then
        print_header "Update-Only Mode"
        check_prerequisites
        build_react_app
        deploy_to_aws
        display_summary
        return
    fi
    
    # Full deployment
    check_prerequisites
    setup_terraform_backend
    init_terraform
    plan_terraform
    apply_terraform
    build_react_app
    deploy_to_aws
    setup_monitoring
    display_summary
    cleanup
    
    print_status "🚀 Frontend deployment completed successfully!"
}

# Run main function
main "$@" 