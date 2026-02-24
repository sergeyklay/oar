# Deploying Oar on AWS with Cloudflare Tunnel

- **Status:** Stable
- **Last updated:** 2026-02-24

## Overview

Running a personal finance application on the public internet creates an obvious tension: you want remote access to your financial data, but you don't want that data exposed to attackers. Traditional deployment approaches force you to choose between convenience (open ports, public IP) and security (VPN complexity, firewall maintenance). This guide shows you how to eliminate that tradeoff.

The architecture here combines a cheap AWS EC2 instance with Cloudflare Tunnel, creating a deployment where your server has _zero open inbound ports_. No SSH port listening for brute force attacks. No web port exposed to scanners. Traffic reaches your application only through an encrypted tunnel that Cloudflare's network initiates from your server outward. This inverts the typical security model: instead of defending an exposed surface, you're creating an invisible one.

Why Cloudflare Tunnel instead of a VPN? VPNs require you to connect before accessing the app, which adds friction when you want to check a bill from your phone. Cloudflare's Zero Trust authentication gives you the same access control, appearing as a login page when you visit your domain. One-time email codes replace always-on VPN connections. The result: you type your domain into any browser, verify your email, and you're in. No apps to install, no clients to configure.

This setup costs roughly what you'd pay for a streaming subscription. A cheap domain runs a few dollars per year. A small EC2 instance falls within AWS's free tier for the first year, then costs about as much as a coffee per week afterward. Cloudflare's tunnel and authentication features are free for personal use. For that price, you get a production-grade deployment with enterprise-level zero-trust security.

## Prerequisites

Before starting, gather these:

- An AWS account with payment method configured
- A Cloudflare account (free)
- An SSH client on your local machine (built into macOS and Linux; Windows users can use the built-in OpenSSH client or PuTTY)
- Optional: an existing Oar database from a local Docker installation, if you want to migrate your data

## How it works

The deployment proceeds through six phases: infrastructure provisioning, application deployment, tunnel setup, access control configuration, administrative access setup, and security hardening. Each phase builds on the previous, so you'll have a working (if insecure) deployment before adding the security layers. This lets you verify each component independently.

### Phase 1: Infrastructure (domain and server)

#### Why you need a domain

Cloudflare Tunnel requires a domain name. It doesn't work with raw IP addresses because the tunnel's routing depends on the hostname in incoming requests. Without a domain, Cloudflare can't identify which tunnel should receive your traffic.

Buying your domain directly through Cloudflare eliminates DNS configuration headaches. When you register elsewhere and transfer to Cloudflare, you need to migrate nameservers and wait for propagation. Buying from Cloudflare means DNS "works" from the moment you complete the purchase.

To register a domain:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and create an account
2. Navigate to **Domain Registration → Register Domains** in the left menu
3. Search for an inexpensive TLD like `.xyz` or a traditional `.com`
4. Complete the purchase

#### Launching the EC2 instance

Head to [console.aws.amazon.com](https://console.aws.amazon.com) and select a region geographically close to you. Latency matters less for a single-user app like Oar, but there's no reason to add unnecessary round-trip time.

Navigate to **EC2 → Launch Instance** and configure:

| Setting        | Value                                | Reasoning                                        |
| -------------- | ------------------------------------ | ------------------------------------------------ |
| Name           | `oar`                                | Descriptive for the console                      |
| AMI            | Ubuntu 24.04 LTS                     | Long-term support, wide compatibility            |
| Instance type  | `t3.micro`                           | Enough for a single-user app; free tier eligible |
| Key pair       | Create new, download `.pem`          | Your SSH authentication credential               |
| Security Group | Allow SSH (port 22) from `0.0.0.0/0` | Temporary; you'll remove this later              |
| Storage        | 20 GB gp3                            | Room for database growth                         |

The security group configuration looks alarming, but it's temporary. You need SSH access to set up the server; you'll close this port once the tunnel is running.

### Phase 2: Application deployment

Connect to your instance using the key pair you downloaded:

```bash
ssh -i ~/path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
```

#### Configuring swap space

A `t3.micro` instance has 1 GB of RAM. This is enough to run Oar day-to-day, but the Docker image build runs `npm install` which resolves the entire dependency tree in memory. With hundreds of transitive dependencies, this can easily exhaust available RAM, causing the build to fail with cryptic `SIGKILL` or `out of memory` errors.

Creating a persistent swap file eliminates this problem:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Make it permanent so it survives reboots:

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Verify the swap is active:

```bash
free -h
```

You should see a `Swap` row showing 4.0G total. This swap file adds negligible cost (it uses your existing EBS volume) and prevents out-of-memory failures during builds and updates.

#### Installing Docker

Install Docker using the convenience script:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
```

Log out and reconnect for the group membership to take effect:

```bash
exit
ssh -i ~/path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
docker --version
```

#### Running Oar

Clone the repository and start the application:

```bash
git clone https://github.com/sergeyklay/oar.git
cd oar
cp .env.example .env
docker compose up -d
```

Verify the application responds:

```bash
curl localhost:8080
```

You should see HTML output. At this point, Oar is running but accessible only from inside the server.

### Phase 3: Secure access via Cloudflare Tunnel

The tunnel has three components: `cloudflared` (the daemon), the tunnel configuration (how traffic routes), and Zero Trust policies (who can access).

#### Installing cloudflared

On Ubuntu/Debian:

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list

sudo apt update && sudo apt install cloudflared -y
```

On Amazon Linux:

```bash
sudo yum install -y \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
```

#### Creating and configuring the tunnel

Authenticate with Cloudflare (this opens a URL you'll copy to your browser):

```bash
cloudflared tunnel login
```

Create the tunnel and note the UUID it returns:

```bash
cloudflared tunnel create oar
```

The credentials file is created in `~/.cloudflared/<UUID>.json`. For system service deployment, move this to `/etc/cloudflared/` where the systemd service expects it:

```bash
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/<TUNNEL_UUID>.json /etc/cloudflared/
```

Create the configuration file at `/etc/cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /etc/cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: yourdomain.xyz
    service: http://localhost:8080
  - service: http_status:404
```

Replace `<TUNNEL_UUID>` with the UUID from the tunnel creation step, and `yourdomain.xyz` with your domain. The `ingress` block tells cloudflared: requests to your domain go to the local app on port 8080; everything else gets a 404.

Why `/etc/cloudflared/` instead of the home directory? When you run `sudo cloudflared service install`, the `$HOME` variable points to `/root`, not your user's home directory. Placing config and credentials in `/etc/cloudflared/` follows the Filesystem Hierarchy Standard for system-wide configuration and avoids this path confusion.

Create the DNS record that points your domain to the tunnel:

```bash
cloudflared tunnel route dns oar yourdomain.xyz
```

Test the tunnel (press Ctrl+C to stop):

```bash
cloudflared tunnel run
```

Open `https://yourdomain.xyz` in your browser. You should see Oar. HTTPS works automatically because Cloudflare terminates TLS at their edge.

#### Running the tunnel as a system service

Manual tunnel execution stops when you close your SSH session. Install it as a systemd service:

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

```bash
sudo systemctl status cloudflared
```

The output should show `active (running)`.

### Phase 4: Access control with Zero Trust

At this point, anyone with your domain can access Oar. Cloudflare Zero Trust adds an authentication layer.

1. Go to [one.dash.cloudflare.com](https://one.dash.cloudflare.com) (Zero Trust dashboard)
2. Create a team name and select the free plan
3. Navigate to **Access → Applications → Add an application**
4. Select **Self-hosted**
5. Configure:
   - **Application name:** Oar
   - **Session Duration:** 24 hours (or 1 week for less frequent authentication)
   - **Application domain:** yourdomain.xyz
6. Add a policy:
   - **Policy name:** Only me
   - **Action:** Allow
   - **Include → Selector:** Emails
   - **Value:** your email address

Now visitors see a Cloudflare login page. They enter their email; only your email receives the one-time code. To verify: open your domain in an incognito window. You should see the authentication page, not the application.

### Phase 5: AWS SSM Session Manager

You still need server access for deployments and maintenance, but leaving SSH open creates an attack surface. AWS Systems Manager (SSM) Session Manager provides shell access without any open ports. The SSM agent on your EC2 instance initiates an outbound connection to AWS, and you connect through that established channel. No listening ports, no key management, and full session logging if you want it.

#### Creating an IAM role for EC2

Your EC2 instance needs permission to communicate with the SSM service:

1. In AWS Console, navigate to **IAM → Roles → Create role**
2. **Trusted entity type:** AWS service
3. **Service or use case:** Select EC2 from the dropdown
4. Click **Next**
5. Search for and select: **AmazonSSMManagedInstanceCore**
6. Click **Next**
7. **Role name:** EC2-SSM-Role
8. Click **Create Role**

#### Attaching the role to your instance

1. Navigate to **EC2 → Instances**
2. Select your `oar` instance
3. **Actions → Security → Modify IAM role**
4. Select EC2-SSM-Role
5. Save

#### Granting your IAM user SSM permissions

Your AWS user account also needs permission to start SSM sessions:

1. Navigate to **IAM → Users → your user**
2. **Add permissions → Attach policies directly**
3. Search for and add: **AmazonSSMFullAccess**
4. Click **Add permissions**

#### Verifying the SSM agent

SSH into your instance one last time while port 22 is still open:

```bash
ssh -i ~/path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent
```

Ubuntu 24.04 LTS typically ships with SSM Agent pre-installed and running. If it's not installed:

```bash
sudo snap install amazon-ssm-agent --classic
sudo systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent
sudo systemctl start snap.amazon-ssm-agent.amazon-ssm-agent
```

#### Installing the Session Manager plugin locally

Your local machine needs the Session Manager plugin to use `aws ssm` commands from the terminal.

**Linux (Ubuntu/Debian/WSL):**

```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" \
  -o "session-manager-plugin.deb"
sudo dpkg -i session-manager-plugin.deb
rm session-manager-plugin.deb
```

**macOS:**

```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac/sessionmanager-bundle.zip" \
  -o "sessionmanager-bundle.zip"
unzip sessionmanager-bundle.zip
sudo ./sessionmanager-bundle/install -i /usr/local/sessionmanagerplugin -b /usr/local/bin/session-manager-plugin
rm -rf sessionmanager-bundle sessionmanager-bundle.zip
```

**Windows:**

Download and run the installer from AWS: [SessionManagerPluginSetup.exe](https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe)

#### Testing the SSM connection

Wait 2-3 minutes after attaching the IAM role for the instance to register with SSM, then:

```bash
aws ssm start-session --target <INSTANCE_ID> --region <YOUR_REGION>
```

Find your Instance ID in **EC2 → Instances**. It looks like `i-0abc1234def567890`.

You should see:

```plaintext
Starting session with SessionId: youruser-abc123...
$
```

You can also connect through the browser: **AWS Console → Systems Manager → Session Manager → Start a session** → select your instance.

SSM logs you in as `ssm-user`, which doesn't have access to your project files or Docker. After connecting, switch to the `ubuntu` user:

```bash
sudo su - ubuntu
```

Now you're in `/home/ubuntu` with full access to your files and Docker.

### Phase 6: Closing the attack surface

Only after you've confirmed SSM is working, close the SSH port:

1. In AWS Console, navigate to **EC2 → Security Groups**
2. Find your instance's security group
3. Edit **Inbound rules**
4. Remove the SSH (port 22) rule
5. Save

Your server now has zero open inbound ports. All traffic flows through authenticated, encrypted channels: Cloudflare Tunnel for the application, SSM for server administration.

## Daily workflow

With everything configured, here's how you'll interact with your deployment day-to-day.

### Connecting to your server

```bash
aws ssm start-session --target <INSTANCE_ID> --region <YOUR_REGION>
sudo su - ubuntu
cd ~/oar
```

Consider adding a shell alias to your `~/.bashrc` or `~/.zshrc` for quick access:

```bash
alias oar-ssh='aws ssm start-session --target <INSTANCE_ID> --region <YOUR_REGION>'
```

Then type `oar-ssh` to connect.

### Deploying updates

```bash
# After connecting via SSM:
sudo su - ubuntu
cd ~/oar
git pull
docker compose down
docker compose up -d --build
```

### Copying files without SSH

Since SSH is closed, `scp` no longer works. Use S3 as an intermediary:

```bash
# From your local machine: upload to S3
aws s3 cp ./myfile s3://your-bucket/myfile

# On EC2 via SSM: download from S3
aws s3 cp s3://your-bucket/myfile ~/myfile
```

An S3 bucket for file transfers costs almost nothing for occasional use. If you prefer, you can temporarily re-add the SSH rule to your Security Group, use `scp`, then remove the rule again.

## Migrating an existing database

If you've been running Oar locally in Docker and want to preserve your data, you'll need to copy your SQLite database to the EC2 instance.

### Export from your local Docker container

```bash
docker cp oar:/app/data/oar.db ./oar.db
```

### Copy to EC2

If SSH is closed, use the S3 intermediary method described above. Otherwise:

```bash
scp -i ~/path/to/key.pem ./oar.db ubuntu@<EC2_IP>:~/oar.db
```

### Import into the Docker volume

SQLite uses Write-Ahead Logging (WAL) mode, which creates accompanying `.db-shm` and `.db-wal` files. These files contain transaction state from the source database. If you copy only the main `.db` file but leave old WAL files in place, SQLite will try to replay stale transactions, corrupting your data.

```bash
cd ~/oar
docker compose down

# Remove ALL database files, including WAL/SHM
sudo rm /var/lib/docker/volumes/oar_oar_data/_data/oar.db-wal
sudo rm /var/lib/docker/volumes/oar_oar_data/_data/oar.db-shm

# Copy your database
sudo cp ~/oar.db /var/lib/docker/volumes/oar_oar_data/_data/oar.db

# Set ownership so the container can write
# 1001:1001 matches the nextjs user inside the container
sudo chown 1001:1001 /var/lib/docker/volumes/oar_oar_data/_data/oar.db

docker compose up -d
```

## Edge cases and constraints

**Session persistence across deploys:** Cloudflare Zero Trust sessions survive container restarts and redeploys. Your browser's authentication token is stored with Cloudflare, not your server.

**Tunnel credential backup:** The tunnel credentials file (`<UUID>.json` in `/etc/cloudflared/`) is your tunnel's identity. If you lose it and the server dies, you'll need to create a new tunnel and update DNS. Consider backing this file up.

**SQLite concurrency:** Oar uses SQLite with WAL mode, which handles concurrent reads well but serializes writes. For a single-user app, this is a non-issue. If you share access with family members, you might occasionally see a brief delay when simultaneous writes queue up.

**EC2 instance recovery:** If your instance terminates unexpectedly, your data persists in the EBS volume as long as you didn't configure "Delete on Termination". Launch a new instance, attach the old volume, and restart.

## Verification

You've completed the deployment successfully when:

1. Visiting `https://yourdomain.xyz` in an incognito window shows the Cloudflare authentication page
2. After authenticating with your email, you see the Oar application
3. Your AWS security group shows zero inbound rules
4. `sudo systemctl status cloudflared` shows `active (running)`
5. `aws ssm start-session --target <INSTANCE_ID> --region <YOUR_REGION>` connects successfully
6. If you migrated a database, your existing bills and payment history appear in the app

## Troubleshooting

### Tunnel not connecting

Check the service status and logs:

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
```

Common causes: incorrect UUID in config file, missing credentials file, DNS record pointing to wrong tunnel.

### Application not loading through tunnel

Verify the app runs locally:

```bash
docker compose ps
curl localhost:8080
```

If `curl` fails, check Docker logs with `docker compose logs`.

### Zero Trust not blocking access

Three things to verify:

1. The application domain in Zero Trust matches your domain exactly (including or excluding subdomains)
2. A policy is attached to the application
3. You're testing in an incognito window to avoid cached authentication tokens

### Database permission errors after migration

SQLite needs write access to both the database file and its directory:

```bash
sudo ls -la /var/lib/docker/volumes/oar_oar_data/_data/
sudo chown 1001:1001 /var/lib/docker/volumes/oar_oar_data/_data/oar.db
```

### SSM session not connecting

If `aws ssm start-session` fails with "target is not connected":

1. Verify the IAM role is attached: **EC2 → Instances → select instance → Security tab → IAM Role** should show EC2-SSM-Role
2. Check the SSM agent is running on the instance (requires temporary SSH access):
   ```bash
   sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent
   ```
3. Wait 2-3 minutes after attaching the IAM role for the instance to register
4. Confirm your IAM user has `AmazonSSMFullAccess` policy attached
5. Check the region matches where your instance is running
