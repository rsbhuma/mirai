# AWS Auto-Scaling Deployment Guide

## 🚀 **Cost-Optimized AWS Deployment for Community Coin Server**

This guide will help you deploy a **production-ready, auto-scaling** Community Coin server on AWS that **scales costs directly with your userbase**.

### 💰 **Cost Structure Overview**

| User Scale | Monthly Cost | Infrastructure |
|------------|--------------|----------------|
| **0-100 users** | **$100-125** | 1 Fargate task, 0.5 ACU Aurora, micro Redis |
| **1K-10K users** | **$250-670** | 3-10 Fargate tasks, 2-8 ACU Aurora, scaled Redis |
| **50K+ users** | **$1K-3.4K** | 20-50 Fargate tasks, 8-16 ACU Aurora, cluster Redis |

### 🏗️ **Architecture Components**

#### **Serverless & Auto-Scaling Services:**
- **ECS Fargate**: Serverless containers (80% Fargate Spot for cost savings)
- **Aurora Serverless v2**: Database scales from 0.5 to 16 ACUs automatically
- **ElastiCache**: Redis with auto-scaling and scheduled scaling for off-peak hours
- **Application Load Balancer**: Distributes traffic with health checks
- **Auto Scaling**: CPU, memory, and request-based scaling policies

#### **Cost Optimizations Built-In:**
- ✅ **Single NAT Gateway** (saves ~$45/month per additional AZ)
- ✅ **Fargate Spot instances** (80% cost reduction)
- ✅ **Aurora Serverless v2** (scales to 0.5 ACU when idle)
- ✅ **Scheduled Redis scaling** (scale down during off-peak hours)
- ✅ **Short log retention** (7 days vs 30+ days)
- ✅ **S3 lifecycle policies** (automatic artifact cleanup)
- ✅ **ECR image cleanup** (keep only last 10 images)

## 📋 **Prerequisites**

### **Required Tools:**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installations
aws --version
terraform --version
docker --version
```

### **AWS Account Setup:**
```bash
# Configure AWS credentials
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region (e.g., us-west-2)
# - Default output format (json)

# Verify access
aws sts get-caller-identity
```

### **Required AWS Permissions:**
Your AWS user/role needs these services:
- EC2, VPC, Security Groups
- ECS, ECR, Application Load Balancer
- RDS (Aurora), ElastiCache
- IAM, Systems Manager, KMS
- CloudWatch, SNS
- S3, CodePipeline, CodeBuild

## 🚀 **Quick Deployment (Automated)**

### **Option 1: One-Click Deployment**
```bash
# Clone and navigate to the project
git clone <your-repo>
cd community_coin_server/server_rust

# Run automated deployment
./deploy/aws-deploy.sh
```

The script will:
1. ✅ Check all prerequisites
2. ✅ Set up Terraform remote state
3. ✅ Deploy infrastructure with Terraform
4. ✅ Build and push Docker image to ECR
5. ✅ Deploy application to ECS
6. ✅ Set up monitoring dashboards
7. ✅ Display access URLs and next steps

### **Option 2: Manual Step-by-Step**

#### **Step 1: Infrastructure Deployment**
```bash
cd terraform

# Copy and customize variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

#### **Step 2: Application Deployment**
```bash
# Get ECR repository URL from Terraform output
ECR_REPO=$(terraform output -raw ecr_repository_url)

# Build and push Docker image
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $ECR_REPO
docker build -f Dockerfile.prod -t community-coin:latest .
docker tag community-coin:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# Update ECS service
aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service $(terraform output -raw ecs_service_name) \
  --force-new-deployment
```

## 📊 **Monitoring & Observability**

### **Built-in Monitoring:**
- **CloudWatch Dashboards**: ECS, RDS, ElastiCache, ALB metrics
- **Auto-scaling Alarms**: CPU, memory, request count thresholds
- **Health Checks**: Application, database, Redis health endpoints
- **Cost Monitoring**: AWS Cost Explorer integration

### **Access Monitoring:**
```bash
# CloudWatch Dashboard
https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=community-coin-production

# ECS Service Monitoring
https://console.aws.amazon.com/ecs/home?region=us-west-2#/clusters/community-coin-production-cluster/services

# Cost and Billing
https://console.aws.amazon.com/billing/home#/
```

## 🔄 **CI/CD Pipeline Setup**

### **Automated Deployments:**
The infrastructure includes a complete CI/CD pipeline:

```bash
# Pipeline components deployed:
# - CodePipeline: Orchestrates the deployment
# - CodeBuild: Builds Docker images
# - ECR: Stores container images
# - ECS: Deploys applications

# To trigger deployments:
# 1. Upload source code to S3 bucket (shown in output)
# 2. Pipeline automatically builds and deploys
# 3. Zero-downtime rolling deployments
```

### **Manual Deployment Updates:**
```bash
# Update application only (after infrastructure is deployed)
./deploy/aws-deploy.sh --update-only
```

## 💡 **Scaling Configuration**

### **Auto-Scaling Policies:**
```yaml
# ECS Service Auto-Scaling:
Min Capacity: 1 task
Max Capacity: 100 tasks
CPU Target: 70%
Memory Target: 80%
Request Target: 1000 requests/target

# Aurora Serverless v2:
Min Capacity: 0.5 ACU ($0.06/hour)
Max Capacity: 16 ACUs ($1.92/hour)
Auto-pause: No (for production)

# ElastiCache Redis:
Min Nodes: 2 (for HA)
Max Nodes: 6
Scheduled Scaling: Scale down at night
```

### **Cost Optimization Schedules:**
```bash
# Redis scales down during low-traffic hours:
# 2 AM UTC: Scale to 1 replica (cost savings)
# 8 AM UTC: Scale back to 2 replicas (performance)

# You can customize these in terraform/elasticache.tf
```

## 🔒 **Security Features**

### **Built-in Security:**
- ✅ **VPC with private subnets** for application isolation
- ✅ **Security groups** with least-privilege access
- ✅ **Encryption at rest** for RDS and ElastiCache
- ✅ **Encryption in transit** for all communications
- ✅ **Secrets management** via AWS Systems Manager
- ✅ **IAM roles** with minimal required permissions
- ✅ **Container security** with non-root users

### **Security Best Practices:**
```bash
# Enable GuardDuty for threat detection
aws guardduty create-detector --enable

# Set up AWS Config for compliance monitoring
aws configservice put-configuration-recorder --configuration-recorder name=default,roleARN=arn:aws:iam::ACCOUNT:role/aws-config-role

# Enable CloudTrail for audit logging
aws cloudtrail create-trail --name community-coin-audit --s3-bucket-name your-audit-bucket
```

## 📈 **Performance Optimization**

### **Built-in Optimizations:**
- **Connection pooling**: Optimized database connections
- **Redis caching**: Multi-layer caching with cache warming
- **Load balancing**: Request distribution across instances
- **Health checks**: Automatic unhealthy instance replacement
- **Resource limits**: Prevent resource exhaustion

### **Performance Monitoring:**
```bash
# Key metrics to watch:
# - Response time (target: <100ms p95)
# - Error rate (target: <1%)
# - CPU utilization (target: <70%)
# - Memory utilization (target: <80%)
# - Database connections (monitor for leaks)
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **High Costs:**
```bash
# Check auto-scaling settings
aws application-autoscaling describe-scalable-targets --service-namespace ecs

# Review CloudWatch metrics for over-scaling
aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization

# Consider using more Fargate Spot instances
# Edit terraform/ecs.tf capacity_provider_strategy
```

#### **Performance Issues:**
```bash
# Check ECS service health
aws ecs describe-services --cluster CLUSTER_NAME --services SERVICE_NAME

# Monitor database performance
aws rds describe-db-clusters --db-cluster-identifier CLUSTER_ID

# Check Redis performance
aws elasticache describe-replication-groups --replication-group-id REDIS_ID
```

#### **Deployment Failures:**
```bash
# Check ECS service events
aws ecs describe-services --cluster CLUSTER_NAME --services SERVICE_NAME

# View application logs
aws logs tail /ecs/community-coin-production --follow

# Check CodeBuild logs
aws logs describe-log-groups --log-group-name-prefix /aws/codebuild/
```

## 💰 **Cost Management**

### **Cost Monitoring:**
```bash
# Set up billing alerts
aws budgets create-budget --account-id ACCOUNT_ID --budget file://budget.json

# Monitor costs by service
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost --group-by Type=DIMENSION,Key=SERVICE
```

### **Cost Optimization Tips:**
1. **Use Fargate Spot** for 80% cost savings (already configured)
2. **Aurora Serverless v2** scales to 0.5 ACU when idle (already configured)
3. **Schedule Redis scaling** for off-peak hours (already configured)
4. **Monitor and adjust** auto-scaling thresholds based on actual usage
5. **Use Reserved Instances** for predictable workloads (after 6+ months)
6. **Clean up unused resources** regularly

### **Expected Cost Breakdown:**

#### **Minimal Usage (0-100 users):**
```
ECS Fargate (1 task, mostly Spot): $15-30/month
Aurora Serverless (0.5-1 ACU): $7-15/month
ElastiCache (t4g.micro): $10-15/month
Application Load Balancer: $20/month
NAT Gateway: $45/month
Data Transfer & Other: $5-10/month
TOTAL: ~$100-125/month
```

#### **Moderate Usage (1K-10K users):**
```
ECS Fargate (3-10 tasks): $100-300/month
Aurora Serverless (2-8 ACUs): $50-200/month
ElastiCache (scaled): $30-100/month
Application Load Balancer: $25/month
NAT Gateway: $45/month
Data Transfer & Other: $20-50/month
TOTAL: ~$250-670/month
```

#### **High Usage (50K+ users):**
```
ECS Fargate (20-50 tasks): $500-2000/month
Aurora Serverless (8-16 ACUs): $200-800/month
ElastiCache (cluster mode): $200-500/month
Application Load Balancer: $50/month
NAT Gateway: $45/month
Data Transfer & Other: $50-100/month
TOTAL: ~$1000-3400/month
```

## 🔄 **Maintenance & Updates**

### **Regular Maintenance:**
```bash
# Update application (zero-downtime)
./deploy/aws-deploy.sh --update-only

# Update infrastructure
cd terraform && terraform plan && terraform apply

# Update dependencies
# - Monitor AWS service updates
# - Update Terraform providers
# - Update container base images
```

### **Backup & Recovery:**
```bash
# Aurora automatic backups (7 days retention)
# ElastiCache snapshots (3 days retention)
# Application logs in CloudWatch (7 days retention)

# Manual backup
aws rds create-db-cluster-snapshot --db-cluster-identifier CLUSTER_ID --db-cluster-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

## 🆘 **Support & Next Steps**

### **After Deployment:**
1. **Set up domain**: Point your domain to the ALB DNS name
2. **Configure SSL**: Add SSL certificate to the Application Load Balancer
3. **Set up alerts**: Configure SNS notifications for critical alerts
4. **Monitor costs**: Set up billing alerts and review monthly
5. **Scale testing**: Test auto-scaling with load testing tools

### **Getting Help:**
- **AWS Documentation**: https://docs.aws.amazon.com/
- **Terraform Documentation**: https://registry.terraform.io/providers/hashicorp/aws/
- **Community Support**: GitHub Issues, AWS Forums
- **Professional Support**: AWS Support Plans

---

## 🎉 **You're Ready for Production!**

Your Community Coin server is now deployed with:
- ✅ **Auto-scaling infrastructure** that grows with your users
- ✅ **Cost optimization** that starts at ~$100/month
- ✅ **High availability** across multiple availability zones
- ✅ **Comprehensive monitoring** and alerting
- ✅ **Security best practices** built-in
- ✅ **CI/CD pipeline** for automated deployments

**🚀 Scale from 0 to millions of users with confidence!** 