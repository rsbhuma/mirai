#!/bin/bash

# AWS Deployment Script for Community Coin Server
# Automated deployment with cost optimization

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
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    print_status "✓ Docker is installed"
    
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
    sed -i.bak "s|# bucket = \"community-coin-terraform-state\"|bucket = \"$BUCKET_NAME\"|g" terraform/main.tf
    sed -i.bak "s|# key    = \"infrastructure/terraform.tfstate\"|key    = \"infrastructure/terraform.tfstate\"|g" terraform/main.tf
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
    echo "Minimal usage (0-100 users): ~$100-125/month"
    echo "Moderate usage (1K-10K users): ~$250-670/month"
    echo "High usage (50K+ users): ~$1000-3400/month"
    echo ""
    echo "The infrastructure will start minimal and auto-scale with your userbase."
    
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
    ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url)
    LOAD_BALANCER_DNS=$(terraform output -raw load_balancer_dns_name)
    
    cd ..
    
    print_status "✓ ECR Repository: $ECR_REPOSITORY_URL"
    print_status "✓ Load Balancer: $LOAD_BALANCER_DNS"
}

# Build and push Docker image
build_and_push_image() {
    print_header "Building and Pushing Docker Image"
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build image
    print_status "Building Docker image..."
    docker build -f Dockerfile.prod -t "$PROJECT_NAME:latest" .
    
    # Tag image
    docker tag "$PROJECT_NAME:latest" "$ECR_REPOSITORY_URL:latest"
    
    # Push image
    print_status "Pushing Docker image to ECR..."
    docker push "$ECR_REPOSITORY_URL:latest"
    
    print_status "✓ Docker image pushed successfully"
}

# Update ECS service
update_ecs_service() {
    print_header "Updating ECS Service"
    
    cd terraform
    ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name)
    cd ..
    
    # Force new deployment
    aws ecs update-service \
        --cluster "$ECS_CLUSTER_NAME" \
        --service "$ECS_SERVICE_NAME" \
        --force-new-deployment \
        --region "$AWS_REGION"
    
    print_status "✓ ECS service update initiated"
    
    # Wait for deployment to complete
    print_status "Waiting for deployment to complete..."
    aws ecs wait services-stable \
        --cluster "$ECS_CLUSTER_NAME" \
        --services "$ECS_SERVICE_NAME" \
        --region "$AWS_REGION"
    
    print_status "✓ Deployment completed successfully"
}

# Setup monitoring and alerts
setup_monitoring() {
    print_header "Setting up Monitoring and Alerts"
    
    # Create CloudWatch dashboard
    cat > cloudwatch-dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "$ECS_SERVICE_NAME", "ClusterName", "$ECS_CLUSTER_NAME" ],
                    [ ".", "MemoryUtilization", ".", ".", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "$AWS_REGION",
                "title": "ECS Service Metrics"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "$LOAD_BALANCER_DNS" ],
                    [ ".", "TargetResponseTime", ".", "." ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "$AWS_REGION",
                "title": "Load Balancer Metrics"
            }
        }
    ]
}
EOF
    
    aws cloudwatch put-dashboard \
        --dashboard-name "$PROJECT_NAME-$ENVIRONMENT" \
        --dashboard-body file://cloudwatch-dashboard.json \
        --region "$AWS_REGION"
    
    rm cloudwatch-dashboard.json
    
    print_status "✓ CloudWatch dashboard created"
}

# Display deployment summary
display_summary() {
    print_header "Deployment Summary"
    
    cd terraform
    LOAD_BALANCER_DNS=$(terraform output -raw load_balancer_dns_name)
    ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url)
    ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name)
    cd ..
    
    echo -e "${GREEN}🎉 Deployment Successful!${NC}"
    echo ""
    echo -e "${BLUE}Application Endpoints:${NC}"
    echo "  🌐 API URL: http://$LOAD_BALANCER_DNS"
    echo "  🏥 Health Check: http://$LOAD_BALANCER_DNS/health"
    echo ""
    echo -e "${BLUE}AWS Resources:${NC}"
    echo "  📦 ECR Repository: $ECR_REPOSITORY_URL"
    echo "  🚀 ECS Cluster: $ECS_CLUSTER_NAME"
    echo "  ⚙️  ECS Service: $ECS_SERVICE_NAME"
    echo ""
    echo -e "${BLUE}Monitoring:${NC}"
    echo "  📊 CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=$PROJECT_NAME-$ENVIRONMENT"
    echo "  📈 ECS Console: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER_NAME/services"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Set up your domain to point to: $LOAD_BALANCER_DNS"
    echo "  2. Configure SSL certificate in ALB for HTTPS"
    echo "  3. Set up CI/CD pipeline for automated deployments"
    echo "  4. Configure monitoring alerts and notifications"
    echo ""
    echo -e "${GREEN}💰 Cost Optimization Active:${NC}"
    echo "  ✓ Fargate Spot instances (80% cost savings)"
    echo "  ✓ Aurora Serverless v2 (scales to 0.5 ACU when idle)"
    echo "  ✓ ElastiCache scheduled scaling"
    echo "  ✓ Single NAT Gateway architecture"
    echo "  ✓ Short log retention periods"
}

# Cleanup function
cleanup() {
    print_header "Cleanup Options"
    
    echo "To destroy the infrastructure later:"
    echo "  cd terraform && terraform destroy"
    echo ""
    echo "To update the application:"
    echo "  ./deploy/aws-deploy.sh --update-only"
}

# Main deployment flow
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 Community Coin Server                        ║"
    echo "║                AWS Auto-Scaling Deployment                   ║"
    echo "║              Cost-Optimized for Any Scale                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check for update-only flag
    if [[ "$1" == "--update-only" ]]; then
        print_header "Update-Only Mode"
        check_prerequisites
        build_and_push_image
        update_ecs_service
        display_summary
        return
    fi
    
    # Full deployment
    check_prerequisites
    setup_terraform_backend
    init_terraform
    plan_terraform
    apply_terraform
    build_and_push_image
    update_ecs_service
    setup_monitoring
    display_summary
    cleanup
    
    print_status "🚀 Deployment completed successfully!"
}

# Run main function
main "$@" 