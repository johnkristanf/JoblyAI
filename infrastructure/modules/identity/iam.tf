# IAM Role that EC2 assumes
resource "aws_iam_role" "ec2_role" {
  name = "joblyai-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "joblyai-ec2-role"
  }
}

resource "aws_iam_role_policy_attachment" "attach_s3_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "attach_ssm_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:https://ap-southeast-1.console.aws.amazon.com/s3/home?region=ap-southeast-1#policy/AmazonSSMReadOnlyAccess"
}

# Instance profile wraps the role so EC2 can use it
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "joblyai-ec2-profile"
  role = aws_iam_role.ec2_role.name
}
