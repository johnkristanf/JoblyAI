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
