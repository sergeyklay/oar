# Local Docker deployment

- **Status:** Draft
- **Last Updated:** 2025-12-31

## 1. Goal

Run Oar as a Docker container on your local machine with persistent data storage. This guide covers two methods: docker-compose (recommended) and manual Docker commands.

**Important:** This guide covers building images locally. If you're using a pre-built image from a public registry, see the "Using Pre-built Images" section below.

## 2. Prerequisites

- **Docker Engine** installed and running (version 20.10 or later)
- **Docker Compose** (version 2.0 or later, included with Docker Desktop)
- **Docker BuildKit** enabled (default in Docker 23.0+, or set `DOCKER_BUILDKIT=1`)
- Terminal access with Docker CLI available
- Access to the Oar project root directory

Verify Docker is available:

```bash
docker --version
docker compose version
```

**Note:** This guide uses Docker BuildKit secrets for secure handling of the Server Actions encryption key. BuildKit is enabled by default in Docker 23.0+. For older versions, ensure `DOCKER_BUILDKIT=1` is set in your environment.

## 3. Method 1: Docker Compose (Recommended)

Docker Compose simplifies deployment by managing configuration in a single file.

### Step 1: Set up environment variables

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

Edit `.env` and optionally set your Server Actions encryption key:

### Option A: With encryption key (recommended for local builds)

This ensures Server Action IDs remain stable across builds, preventing version skew errors:

```bash
# Generate a secure encryption key
openssl rand -base64 32
```

Paste the generated key into `.env`:

```bash
OAR_MEMORY_LIMIT=128MiB
DATABASE_URL=/app/data/oar.db
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-generated-key-here"
```

### Option B: Without encryption key (for pre-built public images)

If you're using a pre-built image from a public registry, you can leave `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` empty:

```bash
OAR_MEMORY_LIMIT=128MiB
DATABASE_URL=/app/data/oar.db
# NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is optional - leave empty for public images
```

**Understanding the encryption key:**

The `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is used by Next.js to generate stable identifiers for Server Actions. Here's when to use it:

- **With key (local/private builds):** Ensures Server Action IDs remain consistent across builds. This prevents "Failed to find Server Action" errors when users have old pages open after a redeploy. Recommended for local development and private deployments.

- **Without key (public images):** Next.js generates a random key during the build and embeds it in the image. The image works without requiring users to know the key, but users may see version skew errors if they have old pages open after redeploy. This happens because each new build gets a different random key, so old pages encrypted with the previous build's key can't work with the new build's key. Refreshing the page fixes it because the new page load uses the current build's key. This is the only practical option for pre-built public images.

**Security:** When using BuildKit secrets, the encryption key is never stored in image layers or build logs. The key is securely passed during build and only available at runtime via environment variables.

### Step 2: Build and start the container

From the project root, run:

```bash
docker compose up --build -d
```

This command:
- Builds the Docker image using BuildKit secrets (if `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is set in `.env`, it's securely passed during build)
- Creates the necessary volumes and networks
- Starts the container in detached mode

**Note:** If you didn't set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` in `.env`, the build will proceed without it. Next.js will generate a random key during build, and the image will work normally.

**Expected output:** Container starts and shows `oar` as running.

### Step 3: Verify the container is running

Check container status:

```bash
docker compose ps
```

You should see `oar` listed with status `Up`.

## 4. Method 2: Manual Docker Commands

If you prefer manual control or don't have Docker Compose, use these commands.

### Step 1: (Optional) Generate encryption key

If you want consistent Server Action IDs across builds, generate an encryption key:

```bash
# Run this once to generate a key, and save it for later use
openssl rand -base64 32
```

Save this key; you'll need it for both build and runtime if you choose to use it.

**Note:** You can skip this step if you're building a public image or don't need consistent Server Action IDs. Next.js will generate a random key automatically during the build.

### Step 2: Build the Docker image

Build the image with or without the encryption key:

### Option A: With encryption key (for consistent builds)

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-generated-key-here"
docker build --secret id=next_key,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY -t oar .
```

### Option B: Without encryption key (for public images)

```bash
docker build -t oar .
```

**Note:** Using BuildKit secrets (Option A) ensures the key never appears in image layers or build history, providing better security than build args. If you don't provide a secret, the build will proceed normally and Next.js will generate a random key during the build, embedding it in the image.

**Expected output:** The build completes with `Building 45.1s (23/23) FINISHED` (example).

### Step 3: Run the container

Start Oar with a persistent data volume:

```bash
docker run -d \
  -p 8080:8080 \
  -v oar_data:/app/data \
  -e DATABASE_URL="/app/data/oar.db" \
  -e NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-generated-key-here" \
  --name oar_app \
  oar
```

**Flag breakdown:**

| Flag | Purpose |
|------|---------|
| `-d` | Run in detached mode (background) |
| `-p 8080:8080` | Map host port 8080 to container port 8080 |
| `-v oar_data:/app/data` | Mount a named volume for SQLite persistence |
| `-e DATABASE_URL` | Set the database file location (can be relative or absolute path) |
| `-e NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Set the Server Actions encryption key |
| `--name oar_app` | Assign a memorable container name |

**Expected output:** Docker returns the container ID (a long hexadecimal string).

### Step 4: Verify the container is running

Check container status:

```bash
docker ps
```

You should see `oar_app` listed with status `Up`.

## 5. Configuration

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `/app/data/oar.db` | Absolute or relative path to the SQLite database file |
| `PORT` | `8080` | Port the application listens on |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Optional | Encryption key for Next.js Server Actions (generate with `openssl rand -base64 32`). If set, must match exactly between build-time (BuildKit secret) and runtime (`-e` or docker-compose environment). If not set, Next.js generates a random key during the build and embeds it in the image. |
| `OAR_MEMORY_LIMIT` | `128MiB` | Memory limit for the container (docker-compose only) |

### Database path handling

The application automatically resolves relative paths to absolute paths and creates the database directory if it doesn't exist.

### Data persistence

The named volume `oar_data` stores your SQLite database. Removing the container does not delete this volume. Your data persists across container restarts and rebuilds.

#### With docker-compose

```bash
docker compose down -v  # Removes container, network, and volumes
docker compose down     # Removes container and network keeping data
```

#### With manual Docker

```bash
docker volume rm oar_data
```

## 6. Verification

Open your browser and navigate to: `http://localhost:8080`.

You should see the Oar dashboard. Create a test bill to confirm database writes work correctly.

**Container logs check:**

#### With docker-compose

```bash
docker compose logs
```

#### With manual Docker

```bash
docker logs oar_app
```

Look for:
- `Running database migrations...` followed by migration status
- `Starting Next.js server...`
- `Ready in XXms` indicating the server started successfully
- `Local: http://localhost:8080` confirming the port

If you see errors about "Failed to find Server Action", see the troubleshooting section below.

## 7. Troubleshooting

### Port already in use

**Error:** `bind: address already in use`

**Fix:** Another process occupies port 8080. Either stop that process or change the port in `docker-compose.yml`:

```yaml
ports:
  - 3000:8080  # Change host port to 3000
```

Then access the app at `http://localhost:3000`.

### Container exits immediately

**Symptom:** Container stops right after starting.

**Debug:** Check logs for errors:

#### With docker-compose

```bash
docker compose logs
```

#### With manual Docker

```bash
docker logs oar_app
```

Common causes:
- Missing `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` environment variable
- Encryption key mismatch between build-time and runtime
- Database directory creation failure (check permissions)

### Server Actions errors

**Error:** `Failed to find Server Action "..."`

This error occurs when there's a mismatch between the Server Action IDs generated at build time and those expected at runtime. Here are the scenarios and solutions:

**Scenario 1: Using a pre-built public image (no encryption key)**

If you pulled an image from a public registry and didn't set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`:

- **Cause:** The image was built with a random key embedded during build. If you redeploy a new version, that new build has a different random key. Your browser tab still has Server Action payloads encrypted with the old build's key, but the container is now using the new build's key.
- **Solution:** Refresh your browser page. The new page load fetches Server Actions encrypted with the current build's key, matching what the container expects.

**Scenario 2: Built locally with encryption key, but key mismatch**

If you built the image locally with a key but there's a mismatch:

- **Cause:** The key used at build-time doesn't match the key used at runtime.
- **Solution:**
  1. **For docker-compose:** Verify the same key value is set in `.env` and used for both the build secret (via `secrets.next_key.environment`) and `environment` section in `docker-compose.yml`
  2. **For manual Docker:** Ensure the same key value is passed via `--secret` during build and `-e` at runtime
  3. If you changed the key, rebuild the image with the new key and ensure runtime uses the same value
  4. Never override `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` at runtime with a different value than what was used at build time

**Scenario 3: Version skew after redeploy**

If you redeployed a new version of the image:

- **Cause:** Users have old pages open with Server Action payloads encrypted with the previous build's key. The new build has a different key embedded in it.
- **Solution:**
  - If you used an encryption key: The key remains the same across builds, so Server Action IDs stay stable. This shouldn't happen unless the key changed. Verify the key matches between builds.
  - If you didn't use a key: Each build gets a new random key, so old pages can't decrypt with the new build's key. Users need to refresh their browser pages to get pages encrypted with the current build's key. This is expected behavior for public images without encryption keys.

### Database directory does not exist

**Error:** `Cannot open database because the directory does not exist`

**Fix:** This should not occur with recent versions. The application automatically creates the database directory. If you see this error:

1. Verify `DATABASE_URL` uses an absolute path (e.g., `/app/data/oar.db`)
2. Check container logs for directory creation messages
3. Ensure the volume is mounted correctly: `-v oar_data:/app/data`

### Data not persisting

**Symptom:** Bills disappear after container restart.

**Fix:** Ensure the volume is mounted:

- **docker-compose:** Verify `volumes: - oar_data:/app/data` exists in `docker-compose.yml`
- **Manual Docker:** Include the `-v oar_data:/app/data` flag

Without the volume mount, data lives only in the container's ephemeral filesystem.

### Rebuilding after code changes

#### With docker-compose

```bash
docker compose down
docker compose up --build -d
```

#### With manual Docker

```bash
docker stop oar_app
docker rm oar_app
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-key"
docker build --secret id=next_key,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY -t oar .
docker run -d -p 8080:8080 -v oar_data:/app/data -e NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-key" --name oar_app oar
```

Your data persists because the volume remains intact.

## 8. Using Pre-built Images from Public Registry

If you're using a pre-built Oar image from a public Docker registry (e.g., Docker Hub, GitHub Container Registry), you don't need to build the image yourself.

### Pulling and running a pre-built image

```bash
# Pull the image
docker pull your-registry/oar:latest

# Run the container (no encryption key needed)
docker run -d \
  -p 8080:8080 \
  -v oar_data:/app/data \
  -e DATABASE_URL="/app/data/oar.db" \
  --name oar_app \
  your-registry/oar:latest
```

**Important notes for pre-built images:**

1. **No encryption key required:** Pre-built images work without `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`. When you don't provide the key at build time, Next.js generates a random key during the build and embeds it in the image. That key is fixed in the build output and doesn't change at runtime.

2. **Version skew behavior:** If you redeploy a new version of the image, users with old browser tabs open may see "Failed to find Server Action" errors. This happens because each build generates a different random key and embeds it in the image. The old page has Server Action payloads encrypted with the previous build's key, but the new container uses the new build's key. Refreshing the browser page fixes it because the new page load uses the current key from the running container.

3. **Why this design?** Pre-built public images can't require users to know a secret that was used during build. Making the encryption key optional allows anyone to use the image without additional configuration, at the cost of potential version skew errors (which are easily resolved by refreshing the page).

4. **For production deployments:** If you're deploying to production and want to avoid version skew errors, consider:
   - Building the image yourself with a known encryption key
   - Using a private registry where you can document the key
   - Accepting that users may need to refresh after redeploy (which is often acceptable)

### Docker Compose with pre-built image

If you want to use docker-compose with a pre-built image, modify `docker-compose.yml`:

```yaml
services:
  oar:
    image: your-registry/oar:latest
    container_name: oar
    # ... rest of configuration ...
    environment:
      DATABASE_URL: ${DATABASE_URL:-/app/data/oar.db}
```

Then run:

```bash
docker compose up -d
```
