# Public subnet — EC2 lives here; auto-assigns public IPs
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.primary_availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "joblyai-public-subnet"
  }
}

# Private subnets for RDS (needs at least 2 AZs)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = var.primary_availability_zone

  tags = {
    Name = "joblyai-private-subnet-1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = var.secondary_availability_zone

  tags = {
    Name = "joblyai-private-subnet-2"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "joblyai-db-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "joblyai-db-subnet-group"
  }
}
