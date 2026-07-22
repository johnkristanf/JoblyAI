# output "api_gateway_url" {
#   description = "The invoke URL for the API Gateway (use this as your backend base URL)"
#   value       = module.integration.api_gateway_url
# }

# output "ec2_public_ip" {
#   description = "Public IP of the EC2 instance"
#   value       = module.compute.ec2_public_ip
# }

# output "ec2_public_dns" {
#   description = "Public DNS of the EC2 instance"
#   value       = module.compute.ec2_public_dns
# }

output "db_endpoint" {
  description = "RDS connection endpoint (host:port)"
  value       = module.database.db_endpoint
}

output "db_address" {
  description = "RDS hostname (for use in DATABASE_URL)"
  value       = module.database.db_address
}
