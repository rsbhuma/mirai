# S3 Configuration for React Static Assets
# Cost-optimized storage with automatic lifecycle management

# S3 Bucket for Static Assets (served via CloudFront)
resource "aws_s3_bucket" "static_assets" {
  bucket        = "${local.name_prefix}-static-assets-${random_id.bucket_suffix.hex}"
  force_destroy = true  # Allow destruction for testing

  tags = local.common_tags
}

# S3 Bucket Public Access Block (Security)
resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Cost Optimization: Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    id     = "optimize_storage_costs"
    status = "Enabled"

    # Move to IA after 30 days (rarely accessed old versions)
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    # Move to Glacier after 90 days
    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    # Delete old versions after 365 days
    noncurrent_version_expiration {
      noncurrent_days = 365
    }

    # Delete incomplete multipart uploads after 7 days
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket for CI/CD Deployments
resource "aws_s3_bucket" "deployments" {
  bucket        = "${local.name_prefix}-deployments-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "deployments" {
  bucket = aws_s3_bucket.deployments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "deployments" {
  bucket = aws_s3_bucket.deployments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Cost optimization for deployment artifacts
resource "aws_s3_bucket_lifecycle_configuration" "deployments" {
  bucket = aws_s3_bucket.deployments.id

  rule {
    id     = "cleanup_old_deployments"
    status = "Enabled"

    # Delete deployment artifacts after 30 days
    expiration {
      days = 30
    }

    # Delete old versions after 7 days
    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# S3 Bucket Policy for CloudFront OAC (Origin Access Control)
data "aws_iam_policy_document" "static_assets_policy" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.static_assets.arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.main.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "static_assets_policy" {
  bucket = aws_s3_bucket.static_assets.id
  policy = data.aws_iam_policy_document.static_assets_policy.json

  depends_on = [aws_s3_bucket_public_access_block.static_assets]
}

# S3 Bucket Notification for CI/CD (optional)
resource "aws_s3_bucket_notification" "deployments" {
  bucket = aws_s3_bucket.deployments.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.deployment_trigger.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "builds/"
    filter_suffix       = ".zip"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# Lambda function for deployment automation
resource "aws_lambda_function" "deployment_trigger" {
  filename         = "deployment_trigger.zip"
  function_name    = "${local.name_prefix}-deployment-trigger"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300

  # Create a simple deployment trigger
  source_code_hash = data.archive_file.deployment_trigger_zip.output_base64sha256

  environment {
    variables = {
      STATIC_BUCKET        = aws_s3_bucket.static_assets.bucket
      CLOUDFRONT_DISTRIBUTION_ID = aws_cloudfront_distribution.main.id
    }
  }

  tags = local.common_tags
}

# Create the Lambda deployment package
data "archive_file" "deployment_trigger_zip" {
  type        = "zip"
  output_path = "deployment_trigger.zip"
  
  source {
    content = <<EOF
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

exports.handler = async (event) => {
    console.log('Deployment trigger received:', JSON.stringify(event, null, 2));
    
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;
    
    try {
        // Extract build artifacts
        console.log('Processing deployment from:', key);
        
        // Copy extracted files to static assets bucket
        const staticBucket = process.env.STATIC_BUCKET;
        
        // Trigger CloudFront invalidation
        const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
        
        const invalidation = await cloudfront.createInvalidation({
            DistributionId: distributionId,
            InvalidationBatch: {
                Paths: {
                    Quantity: 1,
                    Items: ['/*']
                },
                CallerReference: Date.now().toString()
            }
        }).promise();
        
        console.log('CloudFront invalidation created:', invalidation.Invalidation.Id);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Deployment processed successfully',
                invalidationId: invalidation.Invalidation.Id
            })
        };
    } catch (error) {
        console.error('Deployment failed:', error);
        throw error;
    }
};
EOF
    filename = "index.js"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.name_prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_execution_policy" {
  name = "${local.name_prefix}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.static_assets.arn,
          "${aws_s3_bucket.static_assets.arn}/*",
          aws_s3_bucket.deployments.arn,
          "${aws_s3_bucket.deployments.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = aws_cloudfront_distribution.main.arn
      }
    ]
  })
}

# Lambda Permission for S3
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.deployment_trigger.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.deployments.arn
} 