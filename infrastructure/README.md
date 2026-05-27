# JoblyAI — AWS Infrastructure

Terraform infrastructure for the JoblyAI application.

## Architecture

The diagram below illustrates the network flow and the specific AWS resources created by the Terraform modules.

```mermaid
architecture-beta
    group aws(cloud)[AWS Cloud]
    
    group vpc(cloud)[VPC: joblyai-vpc (10.0.0.0/16)] in aws
    group subnet(cloud)[Public Subnet: joblyai-public-subnet (10.0.1.0/24)] in vpc
    
    service igw(internet)[Internet Gateway: joblyai-igw] in vpc
    service rt(server)[Route Table: joblyai-public-rt] in vpc
    
    service apigw(server)[API Gateway: joblyai-api-{env}] in aws
    
    group ec2_group(server)[EC2: joblyai-server] in subnet
    service sg(server)[Security Group: joblyai-ec2-sg] in ec2_group
    service iam(server)[IAM Profile: joblyai-ec2-profile] in ec2_group
    service docker(server)[Docker: FastAPI (Port 8000)] in ec2_group
    
    service s3(database)[S3 Bucket: joblyai-storage-bucket] in aws
    service ssm(server)[Systems Manager (SSM)] in aws
    service github(server)[GitHub Actions]
    service client(internet)[End Users]

    %% Network Routing
    igw:R --> L:rt
    rt:B --> T:subnet
    
    %% User Traffic
    client:R --> L:apigw
    apigw:R --> L:igw
    
    %% API GW Proxy to EC2
    igw:B --> T:ec2_group
    
    %% CI/CD & Admin Access
    github:R --> L:igw
    
    %% EC2 Outbound & Service Access
    ec2_group:R --> L:s3
    ec2_group:T --> B:ssm
```

### Resource Breakdown

1. **Network Layer (VPC & Subnets)**
   - **VPC** (`joblyai-vpc`): The foundational virtual network covering the `10.0.0.0/16` CIDR block.
   - **Public Subnet** (`joblyai-public-subnet`): Subnet (`10.0.1.0/24`) that automatically assigns public IP addresses.
   - **Internet Gateway** (`joblyai-igw`): Allows resources within the public subnet to communicate with the public internet.
   - **Route Table** (`joblyai-public-rt`): Routes all outbound internet traffic (`0.0.0.0/0`) from the public subnet directly to the Internet Gateway.

2. **Compute & Security Layer (EC2)**
   - **EC2 Instance** (`joblyai-server`): An Ubuntu 22.04 LTS server running the Dockerized FastAPI application.
   - **Security Group** (`joblyai-ec2-sg`): The virtual firewall for the EC2 instance allowing inbound `22` (SSH), `80` (HTTP), and `8000` (FastAPI).

3. **Identity & Access Management (IAM)**
   - **IAM Role** (`joblyai-ec2-role`): The identity assumed by the EC2 instance.
   - **IAM Instance Profile** (`joblyai-ec2-profile`): The wrapper that allows the EC2 instance to assume the role.
   - **Policies Attached**:
     - `AmazonS3FullAccess`: Grants the application inside the EC2 instance the ability to read, write, and delete files in any S3 bucket (specifically used for resumes).
     - `AmazonSSMManagedInstanceCore`: Grants the AWS Systems Manager (SSM) agent permission to connect to the AWS Console (Session Manager).

4. **Integration Layer (API Gateway)**
   - **HTTP API** (`joblyai-api-${environment}`): A cost-effective API Gateway that acts as the entry point for frontend client requests.
   - **Proxy Integration**: An `HTTP_PROXY` integration that blindly forwards all routes to `http://<ec2_public_dns>:8000/`.

5. **Storage Layer (S3)**
   - **S3 Bucket** (`${var.bucket_name}`): A secure, private object storage bucket used for storing application assets like user resumes.

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

## Outputs

| Output | Description |
|---|---|
| `api_gateway_url` | Base URL for all API calls (set as `VITE_API_URL` in the client) |
| `ec2_public_ip` | EC2 public IP (for SSH access) |
| `ec2_public_dns` | EC2 public DNS hostname |
