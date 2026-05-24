# EC2 Security Group
# - Port 22  (SSH)  : open to your IP — tighten this to your CIDR in production
# - Port 80  (HTTP) : open to 0.0.0.0/0 so API Gateway can reach the app
# - Port 8000       : FastAPI default port, also open to 0.0.0.0/0 (used by API GW integration)
# - All outbound    : allowed

resource "aws_security_group" "ec2_sg" {
  name        = "joblyai-ec2-sg"
  description = "Allow SSH, HTTP, and FastAPI port inbound; all outbound"
  vpc_id      = var.vpc_id

  # SSH — restrict to your IP in production
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP (nginx / reverse proxy)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # FastAPI direct port (used as API Gateway integration target)
  ingress {
    description = "FastAPI"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS (for future use / certbot)
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "joblyai-ec2-sg"
  }
}
