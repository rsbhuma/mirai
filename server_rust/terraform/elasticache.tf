# ElastiCache Redis Configuration
# Cost-optimized Redis with auto-scaling capabilities

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name_prefix}-cache-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = local.common_tags
}

# ElastiCache Parameter Group for Redis 7.x
resource "aws_elasticache_parameter_group" "main" {
  family = "redis7.x"
  name   = "${local.name_prefix}-redis-params"
  
  # Optimize for cost and performance
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"  # Evict least recently used keys
  }
  
  parameter {
    name  = "timeout"
    value = "300"  # 5 minute timeout
  }
  
  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  tags = local.common_tags
}

# ElastiCache Replication Group (Redis Cluster)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = "${local.name_prefix}-redis"
  description                  = "Redis cluster for Community Coin"
  
  # Node configuration - Start small for cost optimization
  node_type                    = "cache.t4g.micro"  # Cheapest option with good performance
  port                         = 6379
  parameter_group_name         = aws_elasticache_parameter_group.main.name
  
  # Cluster configuration
  num_cache_clusters           = 2  # Start with 2 nodes for HA
  
  # Auto-scaling configuration (for cluster mode disabled)
  automatic_failover_enabled   = true
  multi_az_enabled            = true
  
  # Network configuration
  subnet_group_name           = aws_elasticache_subnet_group.main.name
  security_group_ids          = [aws_security_group.redis.id]
  
  # Backup configuration (cost optimized)
  snapshot_retention_limit    = 3    # Keep 3 days of snapshots
  snapshot_window            = "03:00-05:00"
  maintenance_window         = "sun:05:00-sun:07:00"
  
  # Security
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  auth_token                 = random_password.redis_auth_token.result
  
  # Logging (cost optimized)
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }
  
  # Auto minor version upgrade
  auto_minor_version_upgrade = true
  
  tags = local.common_tags
}

# Alternative: Redis Cluster Mode (for very high scale)
# Uncomment if you need horizontal scaling across multiple shards

# resource "aws_elasticache_replication_group" "cluster_mode" {
#   replication_group_id       = "${local.name_prefix}-redis-cluster"
#   description               = "Redis cluster mode for horizontal scaling"
#   
#   # Cluster mode configuration
#   num_node_groups           = 3    # Number of shards
#   replicas_per_node_group   = 1    # 1 replica per shard
#   
#   node_type                 = "cache.r7g.large"  # Larger instances for cluster mode
#   port                      = 6379
#   parameter_group_name      = aws_elasticache_parameter_group.cluster_mode.name
#   
#   # Network configuration
#   subnet_group_name         = aws_elasticache_subnet_group.main.name
#   security_group_ids        = [aws_security_group.redis.id]
#   
#   # Security
#   at_rest_encryption_enabled = true
#   transit_encryption_enabled = true
#   auth_token                = random_password.redis_auth_token.result
#   
#   # Automatic failover
#   automatic_failover_enabled = true
#   multi_az_enabled          = true
#   
#   tags = local.common_tags
# }

# resource "aws_elasticache_parameter_group" "cluster_mode" {
#   family = "redis7.x"
#   name   = "${local.name_prefix}-redis-cluster-params"
#   
#   parameter {
#     name  = "cluster-enabled"
#     value = "yes"
#   }
#   
#   parameter {
#     name  = "maxmemory-policy"
#     value = "allkeys-lru"
#   }
# 
#   tags = local.common_tags
# }

# Redis authentication token
resource "random_password" "redis_auth_token" {
  length  = 32
  special = false  # Redis auth tokens cannot contain special characters
}

# Store Redis auth token in Systems Manager
resource "aws_ssm_parameter" "redis_auth_token" {
  name  = "/${var.project_name}/${var.environment}/redis-auth-token"
  type  = "SecureString"
  value = random_password.redis_auth_token.result

  tags = local.common_tags
}

# CloudWatch Log Groups for Redis
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/redis/${local.name_prefix}/slow-log"
  retention_in_days = 7  # Cost optimization

  tags = local.common_tags
}

# CloudWatch Alarms for Redis monitoring
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${local.name_prefix}-redis-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors redis cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.main.replication_group_id}-001"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${local.name_prefix}-redis-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors redis memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.main.replication_group_id}-001"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_connections" {
  alarm_name          = "${local.name_prefix}-redis-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "This metric monitors redis connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.main.replication_group_id}-001"
  }

  tags = local.common_tags
}

# Auto Scaling for ElastiCache (if using cluster mode disabled)
# Note: ElastiCache auto-scaling is limited compared to other services

resource "aws_appautoscaling_target" "redis_target" {
  max_capacity       = 6   # Maximum 6 nodes
  min_capacity       = 2   # Minimum 2 nodes
  resource_id        = "replication-group/${aws_elasticache_replication_group.main.replication_group_id}"
  scalable_dimension = "elasticache:replication-group:Replicas"
  service_namespace  = "elasticache"

  tags = local.common_tags
}

resource "aws_appautoscaling_policy" "redis_scale_up" {
  name               = "${local.name_prefix}-redis-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.redis_target.resource_id
  scalable_dimension = aws_appautoscaling_target.redis_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.redis_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ElastiCacheDatabaseMemoryUsageCountedForEvictPercentage"
    }
    target_value = 70.0  # Scale up when memory usage hits 70%
  }
}

# Cost optimization: Scheduled scaling for predictable traffic patterns
# Scale down during low-traffic hours (e.g., nights)

resource "aws_appautoscaling_scheduled_action" "redis_scale_down_night" {
  name               = "${local.name_prefix}-redis-scale-down-night"
  service_namespace  = aws_appautoscaling_target.redis_target.service_namespace
  resource_id        = aws_appautoscaling_target.redis_target.resource_id
  scalable_dimension = aws_appautoscaling_target.redis_target.scalable_dimension
  
  schedule = "cron(0 2 * * ? *)"  # 2 AM UTC daily
  
  scalable_target_action {
    min_capacity = 1  # Scale down to 1 replica at night
    max_capacity = 3
  }
}

resource "aws_appautoscaling_scheduled_action" "redis_scale_up_morning" {
  name               = "${local.name_prefix}-redis-scale-up-morning"
  service_namespace  = aws_appautoscaling_target.redis_target.service_namespace
  resource_id        = aws_appautoscaling_target.redis_target.resource_id
  scalable_dimension = aws_appautoscaling_target.redis_target.scalable_dimension
  
  schedule = "cron(0 8 * * ? *)"  # 8 AM UTC daily
  
  scalable_target_action {
    min_capacity = 2  # Scale back up in the morning
    max_capacity = 6
  }
}

# Outputs
output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "redis_replication_group_id" {
  description = "Redis replication group ID"
  value       = aws_elasticache_replication_group.main.replication_group_id
}

# For cluster mode (if using)
# output "redis_configuration_endpoint" {
#   description = "Redis cluster configuration endpoint"
#   value       = aws_elasticache_replication_group.cluster_mode.configuration_endpoint_address
# } 