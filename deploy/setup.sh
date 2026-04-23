#!/bin/bash

# Update packages
sudo apt-get update
sudo apt-get upgrade -y

# Remove Apache if it exists (to prevent port 80 conflicts)
echo "Removing Apache if present..."
sudo systemctl stop apache2 || true
sudo apt-get remove --purge apache2 -y
sudo apt-get autoremove -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Nginx and Diagnostic Tools
echo "Installing Nginx and diagnostic tools..."
sudo apt-get install -y nginx lsof psmisc net-tools

# Install Certbot
echo "Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "Setup complete! Please log out and back in for Docker group changes to take effect."
