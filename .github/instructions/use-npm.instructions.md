---
description: 'npm commands, Node.js version constraints, and banned alternatives for a local-first Next.js/SQLite project'
applyTo: '**/package.json,**/package-lock.json,.npmrc,Dockerfile*,.github/workflows/*.yml,scripts/**'
---

# npm environment

npm is the only package manager. Node.js 24 is the runtime. Both are pinned across three locations that must stay in sync:

| Source                     | Value                | Purpose                  |
| -------------------------- | -------------------- | ------------------------ |
| `.tool-versions`           | `nodejs 24.13.0`     | Local development (asdf) |
| `Dockerfile`               | `node:24-slim`       | Production image         |
| `.github/workflows/ci.yml` | `node-version: 24.x` | CI pipeline              |

If you change the Node.js version in one location, update all three.

## Commands

Use `npm run <script>` for all operations defined in `package.json`. Do not invoke the underlying tools directly.

| Task               | Command                                     |
| ------------------ | ------------------------------------------- |
| Dev server         | `npm run dev`                               |
| Production build   | `npm run build`                             |
| Type check         | `npm run typecheck`                         |
| Lint               | `npm run lint`                              |
| Lint with autofix  | `npm run lint:fix`                          |
| Format check       | `npm run format:check`                      |
| Format fix         | `npm run format`                            |
| Run all tests      | `npm test`                                  |
| Test single file   | `npm test -- --testPathPatterns="FileName"` |
| Test with coverage | `npm run test:coverage`                     |
| Dev schema sync    | `npm run db:push`                           |
| Generate migration | `npm run db:generate`                       |
| Seed dev data      | `npm run db:seed`                           |
| Drizzle Studio     | `npm run db:studio`                         |
| Security audit     | `npm audit --omit=dev --audit-level=high`   |

Note: Jest 30+ renamed `--testPathPattern` to `--testPathPatterns` (plural). The singular form no longer works.

## Install rules

Choose the install command by context:

| Context                 | Command                | Why                                                                           |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| CI pipeline             | `npm ci --include=dev` | Reproducible: fails if lock file is out of sync, deletes `node_modules` first |
| Dockerfile              | `npm ci`               | Same guarantees, required for deterministic image layers                      |
| Fresh clone             | `npm ci`               | Matches exactly what CI and Docker use                                        |
| Adding a dependency     | `npm install <pkg>`    | Updates both `package.json` and `package-lock.json`                           |
| Adding a dev dependency | `npm install -D <pkg>` | Same, scoped to `devDependencies`                                             |
| Removing a dependency   | `npm remove <pkg>`     | Cleans both manifest and lock file                                            |

After `npm install` or `npm remove`, always commit both `package.json` and `package-lock.json` together. Never manually edit `package-lock.json`.

## Constraints

- NEVER use `yarn`, `pnpm`, or `bun` commands in any context: terminal, Dockerfiles, CI workflows, README snippets, or code comments.
- NEVER run `npx <tool>` when the same tool has a script in `package.json`. Use `npm run <script>` instead. Exception: one-off `npx tsx scripts/...` for ad-hoc TypeScript execution.
- NEVER use `npm install` where `npm ci` is correct (CI, Docker, fresh clone). `npm install` can silently update the lock file and produce non-reproducible builds.
- NEVER use the `--save` flag. It is the default since npm 5 and is redundant.
- NEVER run `npm audit fix --force`. It performs major version bumps that can introduce breaking changes. Fix audit findings manually or with `npm audit fix` (without `--force`) and verify the result.
- NEVER suggest `nvm use` or `nvm install`. The project uses `.tool-versions` (asdf), not `.nvmrc`.
- NEVER modify the `overrides` field in `package.json` without explicit instruction. It pins transitive dependencies to resolve known build conflicts.

## Security

Automatic audit on `npm install` is disabled in `.npmrc` (`audit=false`). This is intentional: audits run explicitly in CI via `npm audit --omit=dev --audit-level=high`, which checks only production dependencies and fails on HIGH or CRITICAL vulnerabilities.

When adding dependencies:

- Production dependencies (`npm install <pkg>`) ship to users. Evaluate the package's maintenance status, download count, and known vulnerabilities before adding.
- Dev dependencies (`npm install -D <pkg>`) do not ship but still execute during build. Prefer well-maintained packages from known publishers.
- `better-sqlite3` has a native install script (`prebuild-install || node-gyp rebuild`). This is expected and required. Do not add `ignore-scripts=true` to `.npmrc` without accounting for this.

## Docker build

The Dockerfile uses a multi-stage build. Understanding the npm flow prevents common mistakes:

1. **deps stage**: `npm ci` installs all dependencies (including devDependencies for build).
2. **builder stage**: `npm run build` compiles Next.js with `DATABASE_URL=":memory:"` (intentional: avoids SQLite file access during static generation).
3. **runner stage**: copies only `.next/standalone` output and hand-picked `node_modules` for runtime scripts (`better-sqlite3`, `@paralleldrive/cuid2`, `pino` and their transitive dependencies).

Do not add `npm install` to the runner stage. If a runtime script needs a package, copy it explicitly from the deps stage following the existing pattern.

## Lock file integrity

`package-lock.json` is version 3 (npm 7+). It is the source of truth for exact dependency versions.

- Always commit changes to `package-lock.json`.
- Never add `package-lock.json` to `.gitignore`.
- If the lock file has merge conflicts, delete it, run `npm install`, and commit the regenerated file. Do not attempt manual conflict resolution on JSON lock files.
