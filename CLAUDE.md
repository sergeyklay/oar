# Oar

Sovereign, local-first bill manager. Core design principle: the "Active Payer" philosophy — every payment requires conscious acknowledgment. This is intentional friction, not a missing feature. Never add automation that bypasses user awareness.

## Commands

- Dev schema sync: `npm run db:push` (NOT `drizzle-kit generate` + `migrate` — those are for production)
- Production migrations: `scripts/migrate.mjs` runs at container startup via `docker-entrypoint.sh`
- Test single file: `npm test -- --testPathPatterns="FileName"` (plural — Jest 30+ renamed the flag)
- Audit: `npm audit --omit=dev --audit-level=high`

## Gotchas

- **SQLite transactions are synchronous.** `better-sqlite3` does NOT support `async/await` inside `db.transaction()`. The callback is NOT awaited — async code silently breaks.
- **Money is always integers.** Store and transmit as minor units (4999 = $49.99). Convert only at UI boundary via `lib/money.ts`. Floating-point money is banned.
- **Never use `format()` from date-fns in JSX.** Server renders UTC, client renders local timezone → hydration mismatch. Always use `<ClientDate />` component.
- **Never use `startOfDay()`/`endOfDay()`/`startOfMonth()` for date filtering.** These use server timezone. Use `calculateFilterBoundaries()`, `calculateDayFilterBoundaries()`, or `calculateYearFilterBoundaries()` from `lib/utils.ts` with the user's timezone offset.
- **Timezone comes from a cookie.** `TimezoneProvider` sets it client-side. Server reads it via `getUserTimezoneOffset()` from `lib/timezone.ts`. Actions must pass `userTimezoneOffset` to services.
- **Actions are thin orchestration.** Validate (Zod) → delegate to `lib/services/` → `revalidatePath()` → return `ActionResult<T>`. No business logic, no math, no conditionals on domain data.
- **No global state.** No Zustand, Redux, or Context for app state. URL state via nuqs, form state via react-hook-form, server state via RSC.
- **Docker build uses `DATABASE_URL=":memory:"`** to avoid file access errors during Next.js static generation. This is intentional.
- **`use client` goes on leaf nodes only.** Default to Server Components. Never make a page/route component a client component.
- **UI types import from `lib/types.ts`**, not directly from `db/schema`. Presentation layer must not depend on the database schema.
- **Optional chaining avalanche.** Fix the type instead of chaining `?.` five levels deep.
- **Never add a `package.json` override without a tripwire.** Every key in `overrides` must have a matching probe in `__tests__/tech-debt/npm-overrides.test.ts` carrying WHY / EXIT / ACTION. A registry probe fails when the block and the probes disagree, so an undocumented override turns the suite red. Before adding one, check the cheaper fixes first: an in-range `npm update`, or bumping the parent in `package.json`. Overrides are the last resort, and the goal is always to shrink the block.
- **`npm run format` refuses to run on a stale `node_modules`.** A `preformat` hook runs `scripts/check-prettier-sync.mjs`, which fails when the installed Prettier differs from the one `package-lock.json` pins. Formatting rules change between Prettier releases, so a stale install silently rewrites files with the wrong version, reports success locally, and lands a commit CI rejects. That loop cost five rounds of "correct formatting" commits on 2026-08-17. When it fires, run `npm ci` — never bypass the hook.
- **A red `tech-debt` test means "reconcile the debt", not "the build is broken."** Read the failing probe's ACTION comment and follow it — the exit condition has changed, which usually means a workaround is now removable.
- **`npm ci` must finish with zero warnings — treat a new one as a regression.** Three overrides exist purely to keep it that way, all against test-only transitive chains Jest has not moved yet: `babel-plugin-istanbul: ^8.0.2` (drops the deprecated glob 7 and inflight), `glob: ^13.0.6` (glob 10 is deprecated wholesale upstream), `jsdom: ^29.0.0` (jsdom 28 replaced the deprecated whatwg-encoding). Each carries a probe in `__tests__/tech-debt/npm-overrides.test.ts`; the jsdom cap is `^29` and not `^30` because jsdom 30 requires Node ≥ 24.15 while `.tool-versions` pins 24.13.0. Two warnings remain and are expected: drizzle-kit declares the deprecated `@esbuild-kit` chain without ever importing it, and `overrides` cannot delete a dependency. If the ERESOLVE peer-dependency blocks come back, the fix is `npm update typescript-eslint`, not an override — `eslint-config-next` declares a range wide enough already.
- **Never verify a clean install with `npm ci --dry-run`.** It emits `ERESOLVE` peer-dependency warnings but not `npm warn deprecated` lines, so a repository with deprecated transitive packages measures zero on the dry run and prints them on the real one. Measuring the two families with one command is how the deprecation half of this problem was missed on 2026-08-17. Count with the real `npm ci --include=dev` (what CI runs), and report the two families separately rather than as one total — a family the instrument cannot emit can never raise the count, so its absence from a total is not evidence.
- **TypeScript is held on 6.x — do not bump it to 7.** TypeScript 7 is the native Go port and ships no JavaScript compiler API, which `typescript-eslint` (pulled in transitively by `eslint-config-next`) loads at import time. `npm run lint` exits 2 before parsing a file. Typecheck, tests and `next build` all pass under 7.x, so the temptation to "just try it" is real — but lint has no fix available: no typescript-eslint release admits 7.x, and upstream (typescript-eslint#10940) is waiting on the stable API that TypeScript 7.1 is due to ship. The build only passes because Next 16.3.1 defaults `experimental.useTypeScriptCli` to true and shells out to `tsc`; that flag is documented as experimental and not recommended for production. Dependabot skips the major; `__tests__/tech-debt/typescript-major-hold.test.ts` carries the exit check.

## Boundaries

### Always

- Business logic lives in `lib/services/`. This is non-negotiable.
- Use `useAsyncAction` hook for async operations with loading states in client components.
- Use Drizzle query builder exclusively. Raw SQL only in migration files.
- Follow existing patterns in the codebase before creating new abstractions.

### Ask first

- `components.json`, `app/globals.css`, `tailwind.config.ts` — design system config
- `components/layout/*`, `app/layout.tsx` — app shell structure
- `jest.config.ts`, `jest.setup.ts`, `tsconfig.json` — toolchain config
- `scripts/migrate.mjs`, `scripts/seed-production.mjs` — production startup scripts

### Never

- Edit `drizzle/` migration SQL files. Generate new migrations instead.
- Import from `@/db` in components or pages. Only services and actions touch the database.
- Add external SaaS dependencies for core features (no Plaid, Yodlee, cloud APIs).
- Use `console.log` — use `getLogger('ModuleName')` from `lib/logger.ts` (pino). ESLint enforces this.

## Refactoring strategy: Strict

New code enforces all standards. Touched code gets brought up to standard. Adjacent untouched code stays as-is — document as tech debt but do not spread old patterns.

## Reference docs

Read whichever of these are relevant before starting work:

- `.github/instructions/typescript-react.instructions.md` — coding standards and React patterns
- `.github/instructions/testing.instructions.md` — Jest mocking patterns (mock `@/db` but never mock `@/db/schema`)
- `.github/instructions/logging.instructions.md` — pino logger conventions (data first, message second)
- `.github/instructions/commit-messages.instructions.md` — Conventional Commits format
- `.github/agents/` — specialized agent configurations (coder, tester, planner, architect, writer)
- `docs/architecture/client-side-date-rendering.md` — why ClientDate exists and how timezone handling works

---

Last updated: 2026-08-17

Maintained by: AI Agents under human supervision
