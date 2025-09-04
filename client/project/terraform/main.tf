# AWS React Client - Auto-scaling Frontend Infrastructure
# Cost-optimized deployment that scales with userbase

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Remote state storage (uncomment after creating S3 bucket)
  # backend "s3" {
  #   bucket = "community-coin-frontend-terraform-state"
  #   key    = "frontend/terraform.tfstate"
  #   region = "us-west-2"
  # }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "community-coin-frontend"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Domain name for the frontend application"
  type        = string
  default     = "app.communitycoin.com"
}

variable "backend_api_url" {
  description = "Backend API URL"
  type        = string
  default     = "https://api.communitycoin.com"
}

variable "solana_network" {
  description = "Solana network endpoint"
  type        = string
  default     = "https://api.devnet.solana.com"
}

# Provider configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Provider for CloudFront (must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}

# Local values
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Random suffix for unique resource names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "deployment_bucket_name" {
  description = "S3 bucket name for deployments"
  value       = aws_s3_bucket.deployments.bucket
} 