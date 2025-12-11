# Local Docker deployment

- **Status:** Draft
- **Last Updated:** 2025-12-11
- **Related:**

## 1. Goal

Run Oar as a Docker container on your local machine with persistent data storage. This guide covers building the image, starting the container, and verifying everything works.

## 2. Prerequisites

- **Docker Engine** installed and running (version 20.10 or later)
- Terminal access with Docker CLI available
- Access to the Oar project root directory

Verify Docker is available:

```bash
docker --version
```

## 3. Step-by-step guide

### Step 1: Build the Docker image

Navigate to the project root and build the image:

```bash
docker build -t oar .
```

This reads the `Dockerfile` and creates an image tagged `oar`. Build time depends on your network speed and system resources.

**Expected output:** The build completes with `Building 45.1s (23/23) FINISHED` (example).

### Step 2: Run the container

Start Oar with a persistent data volume:

```bash
docker run -d \
  -p 8080:8080 \
  -v oar_data:/app/data \
  -e DATABASE_URL="./data/oar.db" \
  --name oar_app \
  oar
```

**Flag breakdown:**

| Flag | Purpose |
|------|---------|
| `-d` | Run in detached mode (background) |
| `-p 8080:8080` | Map host port 8080 to container port 8080 |
| `-v oar_data:/app/data` | Mount a named volume for SQLite persistence |
| `-e DATABASE_URL` | Set the database file location |
| `--name oar_app` | Assign a memorable container name |

**Expected output:** Docker returns the container ID (a long hexadecimal string).

### Step 3: Verify the container is running

Check container status:

```bash
docker ps
```

You should see `oar_app` listed with status `Up`.

## 4. Configuration

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `./data/oar.db` | Path to the SQLite database file |
| `PORT` | `8080` | Port the application listens on |

### Data persistence

The named volume `oar_data` stores your SQLite database. Removing the container does not delete this volume. Your data persists across container restarts and rebuilds.

To delete data permanently:

```bash
docker volume rm oar_data
```

## 5. Verification

Open your browser and navigate to: `http://localhost:8080`.

You should see the Oar dashboard. Create a test bill to confirm database writes work correctly.

**Container logs check:**

```bash
docker logs oar_app
```

Look for startup messages indicating the server is listening on port 8080.

## 6. Troubleshooting

### Port already in use

**Error:** `bind: address already in use`

**Fix:** Another process occupies port 8080. Either stop that process or use a different host port:

```bash
docker run -d -p 3000:8080 -v oar_data:/app/data --name oar_app oar
```

Then access the app at `http://localhost:3000`.

### Container exits immediately

**Symptom:** `docker ps` shows no running container.

**Debug:** Check logs for errors:

```bash
docker logs oar_app
```

Common causes:
- Missing environment variables
- Database file permission issues

### Data not persisting

**Symptom:** Bills disappear after container restart.

**Fix:** Ensure you included the `-v oar_data:/app/data` flag. Without it, data lives only in the container's ephemeral filesystem.

### Rebuilding after code changes

Stop and remove the old container, then rebuild:

```bash
docker stop oar_app
docker rm oar_app
docker build -t oar .
docker run -d -p 8080:8080 -v oar_data:/app/data --name oar_app oar
```

Your data persists because the volume remains intact.
