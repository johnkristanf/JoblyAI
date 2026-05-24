# JoblyAI — AWS Infrastructure

Terraform infrastructure for the JoblyAI application.

## Architecture

```
Internet
    │
    ▼
┌─────────────────────────┐
│   API Gateway (HTTP)    │  ← Entry point for all API traffic
│   ANY /{proxy+}         │
└────────────┬────────────┘
             │  HTTP Proxy (INTERNET, no VPC Link)
             ▼
┌─────────────────────────┐
│   EC2 t3.micro          │  ← Ubuntu 22.04, public subnet, Docker
│   FastAPI :8000         │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   S3 Bucket             │  ← Resume storage (IAM role access)
└─────────────────────────┘
```

## Module Structure

```
infrastructure/
├── main.tf                        # Root: wires all modules together
├── variables.tf                   # Root input variables
├── outputs.tf                     # Root outputs (API URL, EC2 IP)
├── secrets.tfvars.example         # Template — copy to secrets.tfvars
└── modules/
    ├── network/                   # VPC, public subnet, IGW, route table
    │   ├── vpc.tf
    │   ├── subnets.tf
    │   ├── routing.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── security/                  # EC2 security group (22, 80, 443, 8000)
    │   ├── security-groups.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── identity/                  # IAM role, S3 policy, instance profile
    │   ├── iam.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── compute/                   # EC2 instance, key pair, Docker bootstrap
    │   ├── ec2.tf
    │   ├── user_data.sh
    │   ├── variables.tf
    │   └── outputs.tf
    └── integration/               # API Gateway HTTP API → EC2 proxy
        ├── api-gateway.tf
        ├── variables.tf
        └── outputs.tf
```

## Prerequisites

1. **AWS CLI** configured with a named profile
2. **SSH key pair** — generate if not already present:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/joblyai-key-pair -C "joblyai"
   ```
3. **Terraform >= 1.6** installed

## Usage

```bash
cd infrastructure

# 1. Copy and fill in the secrets file
cp secrets.tfvars.example secrets.tfvars
# Edit secrets.tfvars with your region and AWS profile

# 2. Initialise Terraform
terraform init

# 3. Preview changes
terraform plan -var-file=secrets.tfvars

# 4. Apply
terraform apply -var-file=secrets.tfvars

# 5. Get the API Gateway URL
terraform output api_gateway_url
```

## Outputs

| Output | Description |
|---|---|
| `api_gateway_url` | Base URL for all API calls (set as `VITE_API_URL` in the client) |
| `ec2_public_ip` | EC2 public IP (for SSH access) |
| `ec2_public_dns` | EC2 public DNS hostname |

## SSH into the server

```bash
ssh -i ~/.ssh/joblyai-key-pair ubuntu@$(terraform output -raw ec2_public_ip)
```

## Teardown

```bash
terraform destroy -var-file=secrets.tfvars
```
