# Latest Ubuntu 22.04 LTS (Jammy) AMI — Canonical official
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# Key pair — expects ~/.ssh/joblyai-key-pair.pub to exist on the machine running terraform
resource "aws_key_pair" "main" {
  key_name   = "joblyai-key-pair"
  public_key = file("~/.ssh/joblyai-key-pair.pub")
}

resource "aws_instance" "main" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [var.ec2_sg_id]
  iam_instance_profile        = var.ec2_profile_name
  key_name                    = aws_key_pair.main.key_name

  # Public IP is assigned by the subnet (map_public_ip_on_launch = true)
  # Explicitly request it for clarity
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  # Bootstrap: install Docker & Docker Compose
  user_data = file("${path.module}/user_data.sh")

  tags = {
    Name        = "joblyai-server"
    Environment = var.environment
  }
}
