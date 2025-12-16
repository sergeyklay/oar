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

# Server Actions encryption key (required for consistent builds)
# Must be provided via --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<key>
# Generate a key with: openssl rand -base64 32
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY}

# Validate that the encryption key was provided
RUN test -n "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" || \
    (echo "ERROR: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is required. Generate one with: openssl rand -base64 32" && exit 1)

# Build the Next.js application (standalone output)
RUN npm run build

# =============================================================================
# RUNNER STAGE (Production)
# =============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Server Actions encryption key (must match build-time key)
# Can be provided via --build-arg or -e at runtime
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY}

# Validate that the encryption key is set
RUN test -n "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" || \
    (echo "ERROR: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY must be provided at runtime" && exit 1)

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
