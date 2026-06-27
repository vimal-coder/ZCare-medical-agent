# VM Deployment Guide: ZCare Medical Agent

This guide covers the end-to-end process for deploying the ZCare Medical Agent onto a fresh Virtual Machine (Ubuntu/Debian based).

## Prerequisites

1. A Virtual Machine (e.g., AWS EC2, DigitalOcean Droplet, Azure VM, GCP Compute Engine).
2. SSH access to your VM.
3. Your codebase needs to be transferred to the VM (via Git or SCP).

---

## Step 1: Connect to your VM

Open your terminal and SSH into your VM:
```bash
ssh username@your_vm_ip_address
```
*(Replace `username` with your VM user, like `ubuntu` or `root`, and `your_vm_ip_address` with the actual public IP).*

---

## Step 2: Update System & Install Docker

Run the following commands on your VM to install Docker:

```bash
# Update package list
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# (Optional) Allow running Docker without 'sudo'
sudo usermod -aG docker $USER
newgrp docker
```

---

## Step 3: Get your Code onto the VM

You can either clone your repository via Git or transfer it directly.

**Option A: Using Git (Recommended)**
```bash
# Install git if you don't have it
sudo apt install -y git

# Clone the repo (you may need to set up SSH keys or use HTTPS with a PAT)
git clone https://github.com/your-username/ZCare-medical-agent.git
cd ZCare-medical-agent
```

**Option B: Using SCP (From your local machine)**
Open a terminal on your *local* machine (not the VM) and copy the folder:
```bash
scp -r "c:\Users\Vimal\Documents\ZCare-medical-agent" username@your_vm_ip_address:~/ZCare-medical-agent
```
Then, back on your VM, `cd` into the directory:
```bash
cd ~/ZCare-medical-agent
```

---

## Step 4: Add Environment Variables

Create your `.env` file on the VM. Since `.env` is ignored by `.dockerignore` and `.gitignore`, you need to recreate it on the VM securely.

```bash
vi .env
# Or if you prefer nano: nano .env
```
* **If using `vi`:** Press `i` to enter insert mode, paste your secrets, then press `Esc`, type `:wq`, and press `Enter` to save and exit.
* **If using `nano`:** Paste your secrets into the file, then press `Ctrl+O`, `Enter`, and `Ctrl+X` to save and exit.

---

## Step 5: Build and Run the Docker Container

Make sure you are in the `ZCare-medical-agent` directory on the VM.

**1. Build the Docker Image:**
```bash
docker build -t zcare-medical-agent .
```

**2. Run the Container:**
Run it in detached mode (`-d`), map port 8001, and pass your `.env` file:
```bash
docker run -d \
  --name zcare-app \
  --restart unless-stopped \
  -p 8001:8001 \
  --env-file .env \
  zcare-medical-agent
```

> [!NOTE]
> The `--restart unless-stopped` flag ensures that if your VM reboots, your Docker container will automatically start back up.

---

## Step 6: Configure Firewall (If applicable)

If you are using a cloud provider (like AWS or Azure), ensure that **TCP Port 8001** is open in your Security Group/Firewall settings so traffic can reach your app.

If you have `ufw` enabled on the VM itself, allow the port:
```bash
sudo ufw allow 8001
```

---

## Step 7: Verify the Deployment

You can check if your application is running by typing:
```bash
docker ps
```
To view the live application logs:
```bash
docker logs -f zcare-app
```

Now, open your web browser and navigate to:
`http://your_vm_ip_address:8001`

Your application should be live!

## How to Update Code in the Future
When you make changes to your code locally and want to update the VM:
1. SSH into the VM
2. `cd ZCare-medical-agent`
3. `git pull origin main` (or copy files again via SCP)
4. `docker stop zcare-app`
5. `docker rm zcare-app`
6. `docker build -t zcare-medical-agent .`
7. `docker run -d --name zcare-app --restart unless-stopped -p 8001:8001 --env-file .env zcare-medical-agent`
