# CloudFront CDN Configuration
# Global content delivery with cost optimization and auto-scaling

# CloudFront Origin Access Control (OAC) - Modern security approach
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${local.name_prefix}-oac"
  description                       = "OAC for ${local.name_prefix}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  comment             = "CDN for ${local.name_prefix}"
  default_root_object = "index.html"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"  # Cost optimization: Use only US, Canada, and Europe

  # S3 Origin
  origin {
    domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.static_assets.bucket}"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # Default Cache Behavior (for React app)
  default_cache_behavior {
    target_origin_id       = "S3-${aws_s3_bucket.static_assets.bucket}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    # Cost optimization: Longer TTL for static assets
    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 31536000 # 1 year

    # Security headers
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behavior for static assets (CSS, JS, images)
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    target_origin_id = "S3-${aws_s3_bucket.static_assets.bucket}"

    viewer_protocol_policy = "redirect-to-https"
    compress              = true

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    # Aggressive caching for static assets
    min_ttl     = 0
    default_ttl = 31536000  # 1 year
    max_ttl     = 31536000  # 1 year
  }

  # Cache behavior for API calls (pass through to backend)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    target_origin_id = "API-Backend"

    viewer_protocol_policy = "redirect-to-https"
    compress              = false

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Origin", "Referer"]
      cookies {
        forward = "all"
      }
    }

    # No caching for API calls
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # API Backend Origin (your backend server)
  origin {
    domain_name = replace(var.backend_api_url, "https://", "")
    origin_id   = "API-Backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Geographic restrictions (cost optimization)
  restrictions {
    geo_restriction {
      restriction_type = "none"
      # locations        = ["US", "CA", "GB", "DE", "FR", "AU", "JP"]  # Uncomment to restrict
    }
  }

  # SSL Certificate
  viewer_certificate {
    cloudfront_default_certificate = true
    # For custom domain, use:
    # acm_certificate_arn      = aws_acm_certificate.main.arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  # Custom Error Pages for SPA (React Router)
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Aliases (custom domains)
  # aliases = [var.domain_name]

  tags = local.common_tags
}

# CloudFront Response Headers Policy (Security)
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "${local.name_prefix}-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

  custom_headers_config {
    items {
      header   = "X-XSS-Protection"
      value    = "1; mode=block"
      override = true
    }

    items {
      header   = "X-Content-Security-Policy"
      value    = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; connect-src 'self' https: wss: ws:;"
      override = true
    }

    items {
      header   = "Permissions-Policy"
      value    = "geolocation=(), microphone=(), camera=()"
      override = true
    }
  }
}

# CloudFront Function for URL rewriting (optional)
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "${local.name_prefix}-url-rewrite"
  runtime = "cloudfront-js-1.0"
  comment = "URL rewriting for SPA"
  publish = true

  code = <<-EOT
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check whether the URI is missing a file name.
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // Check whether the URI is missing a file extension.
    else if (!uri.includes('.')) {
        request.uri = '/index.html';
    }
    
    return request;
}
EOT
}

# CloudWatch Log Group for CloudFront
resource "aws_cloudwatch_log_group" "cloudfront_logs" {
  name              = "/aws/cloudfront/${local.name_prefix}"
  retention_in_days = 7  # Cost optimization

  tags = local.common_tags
}

# CloudWatch Alarms for CloudFront monitoring
resource "aws_cloudwatch_metric_alarm" "cloudfront_error_rate" {
  alarm_name          = "${local.name_prefix}-cloudfront-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront 4xx error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudfront_metric_alarm" "cloudfront_cache_hit_rate" {
  alarm_name          = "${local.name_prefix}-cloudfront-cache-hit-rate"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CacheHitRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors CloudFront cache hit rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = local.common_tags
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = local.common_tags
}

# CloudFront Real-time Logs (optional, costs extra)
# resource "aws_cloudfront_realtime_log_config" "main" {
#   name          = "${local.name_prefix}-realtime-logs"
#   endpoint_type = "Kinesis"
#   fields        = ["timestamp", "c-ip", "sc-status", "cs-method", "cs-uri-stem"]
#   
#   endpoint {
#     stream_type = "Kinesis"
#     kinesis_stream_config {
#       role_arn   = aws_iam_role.cloudfront_logs.arn
#       stream_arn = aws_kinesis_stream.cloudfront_logs.arn
#     }
#   }
# }

# Outputs for CloudFront
output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID for Route53"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
} 