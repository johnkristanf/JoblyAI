variable "environment" {
  description = "Deployment environment (e.g. production, staging)"
  type        = string
}

variable "ec2_public_dns" {
  description = "Public DNS hostname of the EC2 instance (API Gateway integration target)"
  type        = string
}
