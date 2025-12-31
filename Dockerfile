# syntax=docker/dockerfile:1

# =============================================================================
# BASE STAGE
# =============================================================================
FROM node:24-slim AS base

# =============================================================================
# DEPENDENCIES STAGE
# =============================================================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# =============================================================================
# BUILDER STAGE
# =============================================================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Use in-memory SQLite during build to prevent file access errors
# during Next.js static generation
ENV DATABASE_URL=":memory:"
ENV NEXT_TELEMETRY_DISABLED=1

# Server Actions encryption key (optional - for consistent builds)
# If provided via BuildKit secret, ensures Server Action IDs remain stable across builds.
# If not provided, Next.js generates a random key (may cause version skew after redeploy).
# This allows pre-built images to work without requiring users to know the build-time secret.
# Secret can be provided via --secret id=next_key,src=<file>
# or --secret id=next_key,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
# Generate a key with: openssl rand -base64 32
RUN --mount=type=secret,id=next_key,required=false \
    if [ -f /run/secrets/next_key ]; then \
    export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(cat /run/secrets/next_key); \
    fi && \
    npm run build

# =============================================================================
# RUNNER STAGE (Production)
# =============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Server Actions encryption key (optional at runtime)
# If the image was built with a key, provide the same key at runtime to avoid
# "Failed to find Server Action" errors. If no key was used during build, Next.js
# will generate one automatically at runtime. For pre-built public images, you
# typically don't need to set this - just refresh your browser after redeploy.

# Install sqlite3 for debugging, fixing and backup purposes
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create data directory for SQLite persistence (must be writable by nextjs user)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with correct ownership
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build output (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migration files and scripts for database initialization
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy required node_modules for seed/migration scripts
# These packages are not included in Next.js standalone output but are needed
# for database initialization scripts that run at container startup.
# Direct dependencies: better-sqlite3, @paralleldrive/cuid2, pino
# Transitive deps of better-sqlite3: bindings, prebuild-install
# Transitive dep of bindings: file-uri-to-path
# Transitive deps of @paralleldrive/cuid2: @noble, bignumber.js, error-causes
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@paralleldrive ./node_modules/@paralleldrive
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@noble ./node_modules/@noble
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bignumber.js ./node_modules/bignumber.js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/error-causes ./node_modules/error-causes
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/prebuild-install ./node_modules/prebuild-install
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/pino ./node_modules/pino

# Make entrypoint executable
RUN chmod +x scripts/docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 8080

# Configure runtime environment
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Use entrypoint to run migrations before starting the server
ENTRYPOINT ["scripts/docker-entrypoint.sh"]
