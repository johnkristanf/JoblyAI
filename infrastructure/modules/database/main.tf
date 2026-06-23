# ─────────────────────────────────────────────
# RDS PostgreSQL — Burstable class (db.t4g.micro)
# - Private (not publicly accessible)
# - Placed in private subnets via the DB subnet group
# - Accessible only from the EC2 security group
# ─────────────────────────────────────────────

resource "aws_db_instance" "main" {
  identifier = "joblyai-${var.environment}-db"

  # Engine
  engine         = "postgres"
  engine_version = "16"

  # Burstable instance class (ARM-based, cost-efficient)
  instance_class = "db.t4g.micro"

  # Storage
  storage_type          = "gp3"
  allocated_storage     = 20
  max_allocated_storage = 100 # Enable autoscaling up to 100 GiB

  # Credentials
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Network
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.rds_sg_id]
  publicly_accessible    = false

  # Availability
  multi_az = false

  # Maintenance & Backups
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Lifecycle
  skip_final_snapshot       = false
  final_snapshot_identifier = "joblyai-${var.environment}-final-snapshot"
  deletion_protection       = false

  tags = {
    Name        = "joblyai-${var.environment}-db"
    Environment = var.environment
  }
}
