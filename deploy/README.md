# Deployment Guide: AWS Lightsail

This guide covers deploying the Sleepy Hollows Sessions app to an AWS Lightsail instance at `tns.sleepyhollows.com`.

## Prerequisites

1.  **AWS Lightsail Instance**:
    *   Create a new instance (OS Only > Ubuntu 20.04 or 22.04 LTS).
    *   Minimum 1GB RAM recommended for Next.js builds (or 512MB if building locally and pushing images).
    *   Attach a static IP to your instance.

2.  **Domain Configuration**:
    *   Point `tns.sleepyhollows.com` (A Record) to your Lightsail Static IP.

## 2. Server Setup

SSH into your Lightsail instance and run the setup script (or run existing commands manually).

1.  **Copy Setup Script**:
    ```bash
    scp deploy/setup.sh ubuntu@<YOUR_STATIC_IP>:~/setup.sh
    ```
2.  **Run Setup**:
    ```bash
    ssh ubuntu@<YOUR_STATIC_IP>
    chmod +x setup.sh
    ./setup.sh
    ```
    *Log out and log back in.*

## 3. GitHub Secrets Configuration

Go to your GitHub Repository > Settings > Secrets and Variables > Actions. Add:

*   `SSH_PRIVATE_KEY`: The private key content (`.pem` file) you use to SSH into the Lightsail server.

*Note: Ensure your GitHub Packages permissions allow the Action to write packages.*

## 4. Initial Deploy

1.  **Push to Main**: The GitHub Action will trigger, build the image, and try to deploy.
2.  **Server Config**:
    On the server, clone the repo (or just copy `docker-compose.yml` and `.env.local`).
    ```bash
    mkdir sleepyhollows
    cd sleepyhollows
    # Copy docker-compose.yml here
    nano .env.local # Paste env vars
    ```
3.  **Manual Start (First Time)**:
    Since the action might fail if the folder doesn't exist, run once manually:
    ```bash
    docker compose up -d
    ```

## 5. Nginx & SSL

1.  **Copy Config**:
    (You can SCP `deploy/nginx.conf` to the server first)
    ```bash
    sudo cp deploy/nginx.conf /etc/nginx/sites-available/sleepyhollows
    sudo ln -s /etc/nginx/sites-available/sleepyhollows /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    ```

2.  **Enable SSL**:
    ```bash
    sudo certbot --nginx -d tns.sleepyhollows.com
    ```
