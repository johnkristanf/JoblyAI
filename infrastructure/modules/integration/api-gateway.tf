# ─────────────────────────────────────────────────────────────────────────────
# API Gateway (HTTP API) — direct HTTP proxy integration to EC2 public DNS
#
# Flow:  Client → API Gateway → http://<ec2_public_dns>:8000/{proxy}
#
# No VPC Link needed since EC2 has a public IP and is internet-reachable.
# API Gateway egresses from AWS-managed IPs, so the EC2 SG must allow
# port 8000 from 0.0.0.0/0 (handled in the security module).
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "main" {
  name          = "joblyai-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    max_age       = 300
  }

  tags = {
    Name        = "joblyai-api"
    Environment = var.environment
  }
}

# ── Integration: HTTP proxy → EC2 :8000 ──────────────────────────────────────
resource "aws_apigatewayv2_integration" "ec2_proxy" {
  api_id = aws_apigatewayv2_api.main.id

  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"

  # All traffic forwarded to EC2 on port 8000 (FastAPI)
  # The {proxy} path parameter passes the full path through
  integration_uri = "http://${var.ec2_public_dns}:8000/{proxy}"

  # INTERNET connection — no VPC Link required for public EC2
  connection_type = "INTERNET"

  payload_format_version = "1.0"
}

# ── Catch-all route: ANY /{proxy+} ───────────────────────────────────────────
resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.ec2_proxy.id}"
}

# ── Root Integration (No {proxy}) ────────────────────────────────────────────
resource "aws_apigatewayv2_integration" "ec2_root" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${var.ec2_public_dns}:8000/"
  connection_type    = "INTERNET"
  payload_format_version = "1.0"
}

# ── Root route: ANY / ────────────────────────────────────────────────────────
resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.ec2_root.id}"
}

# ── Default stage with auto-deploy ───────────────────────────────────────────
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Name        = "joblyai-api-stage"
    Environment = var.environment
  }
}
