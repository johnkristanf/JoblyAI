variable "region" {
  description = "AWS region to deploy resources in"
  type        = string
  sensitive   = true
}

variable "profile" {
  description = "AWS CLI profile to use"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Deployment environment (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "bucket_name" {
  description = "S3 bucket name for the application"
  type        = string
  default     = "joblyai-production-bucket"
}
