# RDS Aurora Serverless v2 Configuration
# Database that scales automatically with usage

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store database password in Systems Manager
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/${var.environment}/db-password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = local.common_tags
}

# Aurora Serverless v2 Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier     = "${local.name_prefix}-aurora-cluster"
  engine                 = "aurora-postgresql"
  engine_mode           = "provisioned"  # Required for Aurora Serverless v2
  engine_version        = "15.4"
  database_name         = "community_coin_db"
  master_username       = "postgres"
  master_password       = random_password.db_password.result
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  # Cost optimization settings
  backup_retention_period = 7    # Reduced backup retention
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = 16   # Maximum 16 ACUs (Aurora Capacity Units)
    min_capacity = 0.5  # Minimum 0.5 ACU - very cost effective for low traffic
  }
  
  # Security settings
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn
  
  # Deletion protection (disable for testing)
  deletion_protection = false
  skip_final_snapshot = true  # Set to false in production
  
  # Enable logging
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-cluster"
  })
}

# Aurora Serverless v2 Instance (Writer)
resource "aws_rds_cluster_instance" "writer" {
  identifier         = "${local.name_prefix}-aurora-writer"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"  # Serverless v2 instance class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  
  # Performance insights for monitoring
  performance_insights_enabled = true
  performance_insights_retention_period = 7  # 7 days (free tier)
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-writer"
  })
}

# Aurora Serverless v2 Instance (Reader) - Optional for read scaling
resource "aws_rds_cluster_instance" "reader" {
  count = var.environment == "production" ? 1 : 0  # Only in production
  
  identifier         = "${local.name_prefix}-aurora-reader-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  
  # Performance insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-reader-${count.index}"
  })
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7  # Reduced for cost optimization

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Log Group for Aurora logs
resource "aws_cloudwatch_log_group" "aurora" {
  name              = "/aws/rds/cluster/${aws_rds_cluster.main.cluster_identifier}/postgresql"
  retention_in_days = 7  # Cost optimization

  tags = local.common_tags
}

# Alternative: Traditional RDS with auto-scaling (fallback option)
# Uncomment if Aurora Serverless v2 is not available in your region

# resource "aws_db_instance" "main" {
#   identifier = "${local.name_prefix}-postgres"
#   
#   # Engine configuration
#   engine         = "postgres"
#   engine_version = "15.4"
#   instance_class = var.db_instance_class  # Start with db.t4g.micro
#   
#   # Database configuration
#   db_name  = "community_coin_db"
#   username = "postgres"
#   password = random_password.db_password.result
#   
#   # Storage configuration (with auto-scaling)
#   allocated_storage     = 20   # Start small
#   max_allocated_storage = 1000 # Can grow to 1TB
#   storage_type         = "gp3" # Latest generation
#   storage_encrypted    = true
#   kms_key_id          = aws_kms_key.rds.arn
#   
#   # Network configuration
#   db_subnet_group_name   = aws_db_subnet_group.main.name
#   vpc_security_group_ids = [aws_security_group.rds.id]
#   publicly_accessible    = false
#   
#   # Backup configuration
#   backup_retention_period = 7
#   backup_window          = "03:00-04:00"
#   maintenance_window     = "sun:04:00-sun:05:00"
#   
#   # Monitoring
#   monitoring_interval = 60
#   monitoring_role_arn = aws_iam_role.rds_monitoring.arn
#   
#   # Performance Insights
#   performance_insights_enabled = true
#   performance_insights_retention_period = 7
#   
#   # Deletion protection
#   deletion_protection = false
#   skip_final_snapshot = true
#   
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-postgres"
#   })
# }

# CloudWatch Alarms for Aurora monitoring
resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "${local.name_prefix}-aurora-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors aurora cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "${local.name_prefix}-aurora-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors aurora connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = local.common_tags
}

# Outputs
output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "aurora_cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "database_username" {
  description = "Database username"
  value       = aws_rds_cluster.main.master_username
  sensitive   = true
}

# For traditional RDS (if using fallback)
# output "rds_endpoint" {
#   description = "RDS instance endpoint"
#   value       = aws_db_instance.main.endpoint
# }
# 
# output "rds_port" {
#   description = "RDS instance port"
#   value       = aws_db_instance.main.port
# } 