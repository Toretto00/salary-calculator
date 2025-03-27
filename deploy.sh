#!/bin/bash

# Salary Calculator Deployment Script for AWS EC2
# Domain: toretto.id.vn

# Exit on error
set -e

echo "Starting deployment for Salary Calculator application..."

# 1. Create required directories
echo "Creating required directories..."
mkdir -p nginx/conf
mkdir -p nginx/certbot/conf
mkdir -p nginx/certbot/www
mkdir -p server/payslips
mkdir -p server/payslip-template

# 2. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    sudo apt update
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt update
    sudo apt install -y docker-ce
    sudo usermod -aG docker $USER
    echo "Docker installed successfully!"
else
    echo "Docker is already installed."
fi

# 3. Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully!"
else
    echo "Docker Compose is already installed."
fi

# 5. Obtain SSL certificate using Certbot
if [ ! -d "nginx/certbot/conf/live/toretto.id.vn" ]; then
    echo "SSL certificate not found. Obtaining certificate from Let's Encrypt..."
    
    # Install Certbot if not installed
    if ! command -v certbot &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot
    fi
    
    # Stop any running Nginx to free port 80
    sudo systemctl stop nginx || true
    
    # Run Certbot to get certificate
    sudo certbot certonly --standalone -d toretto.id.vn -d www.toretto.id.vn --email your-email@example.com --agree-tos --no-eff-email
    
    # Copy certificates to Docker volume
    sudo mkdir -p nginx/certbot/conf
    sudo cp -L -r /etc/letsencrypt/* nginx/certbot/conf/
    sudo chown -R $USER:$USER nginx/certbot/conf
    
    echo "SSL certificate obtained successfully!"
else
    echo "SSL certificate already exists."
fi

# 6. Build and start Docker containers
echo "Building and starting Docker containers..."
docker-compose down || true
docker-compose build
docker-compose up -d

echo "Checking if containers are running..."
docker-compose ps

echo "Deployment completed successfully!"
echo "Your application is now accessible at https://toretto.id.vn" 