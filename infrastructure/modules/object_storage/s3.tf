resource "aws_s3_bucket" "app_bucket" {
  bucket = var.bucket_name

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
  }
}

# Block public access (unless hosting a public website)
resource "aws_s3_bucket_public_access_block" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Object versioning
resource "aws_s3_bucket_versioning" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encrption AES256 is enough in most applications
resource "aws_s3_bucket_server_side_encryption_configuration" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS — required so browsers can fetch presigned URLs from the frontend
# (react-pdf and docx-preview use fetch() internally, which triggers CORS checks)
resource "aws_s3_bucket_cors_configuration" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = [
      "https://jobly-ai-weld.vercel.app",
      "http://localhost:3000",
    ]
    expose_headers  = ["ETag", "Content-Type", "Content-Length"]
    max_age_seconds = 3600
  }
}

