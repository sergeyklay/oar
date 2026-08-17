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

Last updated: 2026-03-15

Maintained by: AI Agents under human supervision
