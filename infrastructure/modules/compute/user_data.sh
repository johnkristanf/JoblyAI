#!/bin/bash
set -euo pipefail

# ─── Create 2GB swap to prevent OOM on t3.micro ────────────────────────────────────
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab


# ─── System Update ────────────────────────────────────
apt-get update -y
apt-get upgrade -y

# ─── Install dependencies ────────────────────────────────────
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    unzip \
    awscli

# ─── Install Docker ──────────────────────────────────────────
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

# ─── Enable & start Docker ───────────────────────────────────
systemctl enable docker
systemctl start docker

# Add ubuntu user to docker group (no sudo needed for docker commands)
usermod -aG docker ubuntu

# ─── Create app directory ────────────────────────────────────
mkdir -p /app
chown ubuntu:ubuntu /app
