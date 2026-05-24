variable "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "primary_availability_zone" {
  description = "AZ for the public subnet"
  type        = string
  default     = "ap-southeast-1a"
}
