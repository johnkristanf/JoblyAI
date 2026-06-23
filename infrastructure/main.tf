terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region  = var.region
  profile = var.profile
}

# ─────────────────────────────────────────────
# Network: VPC, Subnets, IGW, Route Tables
# ─────────────────────────────────────────────
module "network" {
  source = "./modules/network"
}

# ─────────────────────────────────────────────
# Security: EC2 Security Group
# ─────────────────────────────────────────────
module "security" {
  source         = "./modules/security"
  vpc_id         = module.network.vpc_id
  vpc_cidr_block = module.network.vpc_cidr_block
}

# ─────────────────────────────────────────────
# Identity & Compliance: IAM Role + Instance Profile
# ─────────────────────────────────────────────
module "identity" {
  source      = "./modules/identity"
  bucket_name = var.bucket_name
}

# ─────────────────────────────────────────────
# Object Storage: S3 Bucket
# ─────────────────────────────────────────────
module "object_storage" {
  source      = "./modules/object_storage"
  environment = var.environment
  bucket_name = var.bucket_name
}

# ─────────────────────────────────────────────
# Compute: EC2 (public subnet, public IP)
# ─────────────────────────────────────────────
module "compute" {
  source             = "./modules/compute"
  environment        = var.environment
  instance_type      = var.instance_type
  public_subnet_id   = module.network.public_subnet_id
  ec2_sg_id          = module.security.ec2_sg_id
  ec2_profile_name   = module.identity.ec2_profile_name
}

# ─────────────────────────────────────────────
# Integration: API Gateway → EC2 (direct HTTP proxy)
# ─────────────────────────────────────────────
module "integration" {
  source         = "./modules/integration"
  environment    = var.environment
  ec2_public_dns = module.compute.ec2_public_dns
}

# ─────────────────────────────────────────────
# Database: RDS PostgreSQL (private, burstable)
# ─────────────────────────────────────────────
module "database" {
  source               = "./modules/database"
  environment          = var.environment
  db_name              = var.db_name
  db_username          = var.db_username 
  db_password          = var.db_password 
  db_subnet_group_name = module.network.db_subnet_group_name
  rds_sg_id            = module.security.rds_sg_id
}
