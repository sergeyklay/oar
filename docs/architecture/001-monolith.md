# ADR-001: Hyper-optimized modular monolith

- **Status:** Accepted
- **Last Updated:** 2025-12-12
- **Related:** -

## Context

Oar is a personal finance app designed for self-hosters who want complete control over their financial data. The target user runs the app on their own hardware; a home server, a Raspberry Pi, or a cheap VPS. They don't want to learn Kubernetes. They don't want to manage multiple containers. They want to run one command and have a working app.

The industry default for "serious" applications is microservices: separate containers for the API, the frontend, the database, the job queue, the cache. This architecture makes sense for teams of hundreds shipping to millions of users. It doesn't make sense for a single-user app running on a $5/month server.

Microservices introduce network latency between every service call. They require orchestration tools to manage. They demand monitoring infrastructure to debug. They multiply the attack surface. For Oar's use case, all of this complexity provides zero benefit and significant harm.

## Decision

Oar uses a hyper-optimized modular monolith architecture. One Node.js process handles everything: UI rendering, API requests, and background jobs. One SQLite database file stores all data. One Docker container runs the entire application.

### Unified runtime

Next.js serves as the complete application framework:

- **UI layer:** React Server Components render pages on the server. Client components handle interactivity.
- **API layer:** Server Actions replace REST endpoints. Mutations are function calls, not HTTP requests.
- **Job layer:** The `instrumentation.ts` hook starts a cron scheduler when the Node.js process boots. Background jobs run in the same process as the web server.

This means a Server Action that logs a payment and a background job that checks for due bills share the same memory space. No serialization overhead. No network hops. No message queue to maintain.

### Zero-latency data access

SQLite with WAL (Write-Ahead Logging) mode provides:

- **Sub-millisecond reads:** The `better-sqlite3` driver accesses data through direct memory mapping. A query that takes 5ms over a network to PostgreSQL completes in microseconds when the database is a local file.
- **Atomic writes:** WAL mode allows concurrent reads during writes. For a single-user app, this eliminates all contention concerns.
- **Zero configuration:** No connection pooling, no replica management, no credentials to rotate.

### Single-command deployment

The entire application ships as one Docker image:

```bash
docker run -v oar-data:/data -p 3000:3000 oar:latest
```

That's it. The user has a running financial app. The `-v oar-data:/data` flag mounts a volume for the SQLite database, ensuring data persists across container restarts.

No `docker-compose.yml` with five services. No Helm charts. No environment variables for service discovery. One container, one port, one volume.

### Local-first sovereignty

Oar operates without any external service dependencies:

- **No authentication SaaS:** The database IS the user's identity. If you can access the file, you own the data.
- **No cloud databases:** SQLite lives on disk. The user controls the backup strategy.
- **No external APIs for core features:** No Plaid for bank connections, no payment processors for bill tracking. The user enters their own data.
- **Offline capability:** All core features work without an internet connection. The app doesn't phone home.

This isn't a limitation; it's a feature. The user's financial data never touches a third-party server.

## Consequences

### Benefits

**Deployment simplicity:** Self-hosters can run Oar on any system that supports Docker. The cognitive overhead of deployment drops to near zero.

**Latency elimination:** A bill lookup that would require network round-trips in a microservices architecture happens through direct function calls. The application feels instant.

**Debugging transparency:** One process means one set of logs. Stack traces show the complete call path from UI click to database write. No distributed tracing required.

**Resource efficiency:** A single Node.js process with an embedded SQLite database runs comfortably on 256MB of RAM. The app works on hardware that microservices would exhaust.

**Data sovereignty:** Users own their data absolutely. No vendor lock-in, no privacy policies to read, no "we've updated our terms" emails.

### Trade-offs

**Vertical scaling only:** This architecture doesn't support horizontal scaling. You can't spin up more containers to handle load. For a single-user app, this constraint is irrelevant. If Oar ever needed multi-user support, this decision would require revisiting.

**Single point of failure:** No load balancer, no failover, no redundancy. If the container crashes, the app is down. For personal use, this is acceptable. The user can restart the container.

**SQLite constraints:** SQLite handles one writer at a time. High-concurrency write scenarios would bottleneck. Again, a single-user app won't hit this limit.

**Coupling:** All code lives in one repository and deploys together. A bug in the job scheduler affects the web server. This requires discipline in testing and deployment, but simplifies coordination.

## Rejected alternatives

### Microservices with Docker Compose

A common pattern for "production-ready" apps: separate containers for web, API, worker, database, and cache. Rejected because:

- Increases deployment complexity by 5x
- Adds network latency to every cross-service call
- Requires users to understand multi-container orchestration
- Provides no benefit for single-user workloads

### Serverless (Vercel, AWS Lambda)

Running Next.js on a serverless platform eliminates infrastructure management. Rejected because:

- Contradicts the sovereignty principle; data lives on a vendor's infrastructure
- Cold starts add latency to background job execution
- Requires internet connectivity for all operations
- Introduces vendor lock-in

### PostgreSQL instead of SQLite

PostgreSQL offers more features: JSONB, full-text search, concurrent writes. Rejected because:

- Requires a separate container or managed service
- Adds network latency to every query
- Overcomplicates deployment for single-user scenarios
- SQLite's embedded nature aligns with the sovereignty model

## Verification

You know this architecture is working correctly when:

1. `docker ps` shows exactly one container running
2. The app responds at `http://localhost:3000` without any other services
3. Stopping and restarting the container preserves all data
4. The app works after disconnecting from the internet (for already-loaded pages)
5. Background jobs (due date notifications) execute without a separate worker container

