variable "environment" {
  description = "Deployment environment (e.g. production, staging)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "public_subnet_id" {
  description = "ID of the public subnet to launch the EC2 instance in"
  type        = string
}

variable "ec2_sg_id" {
  description = "ID of the EC2 security group"
  type        = string
}

variable "ec2_profile_name" {
  description = "Name of the IAM instance profile to attach to the EC2 instance"
  type        = string
}
