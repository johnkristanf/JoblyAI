output "api_gateway_url" {
  description = "The invoke URL for the API Gateway — use this as your backend base URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_gateway_id" {
  description = "ID of the API Gateway HTTP API"
  value       = aws_apigatewayv2_api.main.id
}
