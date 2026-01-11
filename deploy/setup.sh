#!/bin/bash

# Update packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Nginx
echo "Installing Nginx..."
sudo apt-get install -y nginx

# Install Certbot
echo "Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "Setup complete! Please log out and back in for Docker group changes to take effect."
