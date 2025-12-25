# Local Docker deployment

- **Status:** Draft
- **Last Updated:** 2025-12-16

## 1. Goal

Run Oar as a Docker container on your local machine with persistent data storage. This guide covers two methods: docker-compose (recommended) and manual Docker commands.

## 2. Prerequisites

- **Docker Engine** installed and running (version 20.10 or later)
- **Docker Compose** (version 2.0 or later, included with Docker Desktop)
- Terminal access with Docker CLI available
- Access to the Oar project root directory

Verify Docker is available:

```bash
docker --version
docker compose version
```

## 3. Method 1: Docker Compose (Recommended)

Docker Compose simplifies deployment by managing configuration in a single file.

### Step 1: Set up environment variables

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

Edit `.env` and set your Server Actions encryption key:

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

**Note:** The encryption key is required for Next.js Server Actions to work correctly in Docker. The runtime `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (set in `.env` and passed via docker-compose environment) must exactly match the build-time key (passed via docker-compose build args). If they differ, Server Actions will fail with "Failed to find Server Action" errors. Always use the same key value for both build-time and runtime.

### Step 2: Build and start the container

From the project root, run:

```bash
docker compose up --build -d
```

This command:
- Builds the Docker image with the encryption key from your `.env` file
- Creates the necessary volumes and networks
- Starts the container in detached mode

**Expected output:** Container starts and shows `oar` as running.

### Step 3: Verify the container is running

Check container status:

```bash
docker compose ps
```

You should see `oar` listed with status `Up`.

## 4. Method 2: Manual Docker Commands

If you prefer manual control or don't have Docker Compose, use these commands.

### Step 1: Generate encryption key

Generate a Server Actions encryption key:

```bash
# Run this once to generate a key, and save it for later use
openssl rand -base64 32
```

Save this key; you'll need it for both build and runtime. The same exact key value must be used for both `--build-arg` during build and `-e` at runtime. Mismatched keys will break Server Actions decryption.

### Step 2: Build the Docker image

Build the image with the encryption key:

```bash
docker build \
  --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-generated-key-here" \
  -t oar .
```

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
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Required | Encryption key for Next.js Server Actions (generate with `openssl rand -base64 32`). Must match exactly between build-time (`--build-arg`) and runtime (`-e` or docker-compose environment). |
| `OAR_MEMORY_LIMIT` | `128MiB` | Memory limit for the container (docker-compose only) |

### Database path handling

The application automatically resolves relative paths to absolute paths and creates the database directory if it doesn't exist.

### Data persistence

The named volume `oar_data` stores your SQLite database. Removing the container does not delete this volume. Your data persists across container restarts and rebuilds.

**With docker-compose:**

```bash
docker compose down -v  # Removes container, network, and volumes
docker compose down     # Removes container and network keeping data
```

**With manual Docker:**

```bash
docker volume rm oar_data
```

## 6. Verification

Open your browser and navigate to: `http://localhost:8080`.

You should see the Oar dashboard. Create a test bill to confirm database writes work correctly.

**Container logs check:**

**With docker-compose:**

```bash
docker compose logs
```

**With manual Docker:**

```bash
docker logs oar_app
```

Look for:
- `Running database migrations...` followed by migration status
- `Starting Next.js server...`
- `Ready in XXms` indicating the server started successfully
- `Local: http://localhost:8080` confirming the port

If you see errors about "Failed to find Server Action", verify that `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` matches between build-time and runtime.

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

**With docker-compose:**

```bash
docker compose logs
```

**With manual Docker:**

```bash
docker logs oar_app
```

Common causes:
- Missing `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` environment variable
- Encryption key mismatch between build-time and runtime
- Database directory creation failure (check permissions)

### Server Actions errors

**Error:** `Failed to find Server Action "..."`

**Fix:** The encryption key used at build-time must exactly match the key used at runtime. This is a hard constraint - mismatched keys will break Server Actions decryption. Verify:

1. **For docker-compose:** The same key value is set in `.env` and used for both `build.args` and `environment` sections in `docker-compose.yml`
2. **For manual Docker:** The exact same key value is passed via `--build-arg` during build and `-e` at runtime
3. If you changed the key, rebuild the image with the new key and ensure runtime uses the same value
4. Never override `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` at runtime with a different value than what was used at build time

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

**With docker-compose:**

```bash
docker compose down
docker compose up --build -d
```

**With manual Docker:**

```bash
docker stop oar_app
docker rm oar_app
docker build --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-key" -t oar .
docker run -d -p 8080:8080 -v oar_data:/app/data -e NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-key" --name oar_app oar
```

Your data persists because the volume remains intact.
