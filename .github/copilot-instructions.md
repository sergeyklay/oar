# Oar Coding & Review Standards

Review each changed file in three sequential passes. Comment only when confidence exceeds 80%. Do not flag formatting or import order since linters handle those.

## Pass 1: Bugs and security (severity:must-fix)

### Layer boundaries

Identify each file's architectural layer, then verify constraints:

**Presentation** (`app/`, `components/`): Must not import `@/db`. No business logic or domain conditionals (`if (bill.frequency === 'monthly')`). Server Components by default. `'use client'` only on leaf nodes needing hooks, events, or browser APIs. Never on page or layout files.

**Orchestration** (`actions/`): Validate input with Zod `safeParse()`, delegate to `lib/services/`, call `revalidatePath()`, return `ActionResult<T>`. No business logic, no domain math, no direct DB queries.

**Domain** (`lib/services/`): Pure business logic. Must not import Next.js APIs (`revalidatePath`, `cookies`, `headers`), React, or UI code.

**Data** (`db/`): Schema definitions only. No logic, no service calls.

### Domain invariants

**Money must be integers.** All monetary values stored/transmitted in minor units (4999 = $49.99). Conversion only at UI boundary via `lib/money.ts`. Flag floating-point arithmetic on money, `amount * 100` patterns (use `toMinorUnits()`), or ambiguous `number` types for monetary fields.

**Dates in JSX must use `<ClientDate />`.** Server renders UTC, client renders local timezone. Direct `format()` from date-fns in JSX causes hydration mismatches. Only `<ClientDate date={value} format="..." />` is valid.

**Date filtering must be timezone-aware.** Never `startOfDay()`, `endOfDay()`, `startOfMonth()` for query boundaries (these use server TZ). Use `calculateFilterBoundaries()`, `calculateDayFilterBoundaries()`, or `calculateYearFilterBoundaries()` from `lib/utils.ts` with user's timezone offset.

**SQLite transactions are synchronous.** `better-sqlite3` does not await the `db.transaction()` callback. Any `async`/`await` inside a transaction silently breaks. Flag as critical.

**No `console.log`.** Use `getLogger('ModuleName')` from `@/lib/logger`. If an ESLint suppression hides this, flag it.

### Security

- Server Actions are public POST endpoints. Every action must verify auth and authorize resource ownership, not just validate input shape.
- No secrets, tokens, PII, or financial amounts in log output.
- All user input through Zod before reaching services.
- No `dangerouslySetInnerHTML` without sanitization.

## Pass 2: Pattern compliance (severity:suggestion)

- Server Actions must export Zod schemas so client forms reuse them with `zodResolver()`.
- 2+ async operations in a client component should use `useAsyncAction` hook, not manual `useState` for loading.
- Queries should select specific columns, not bare `select()`.
- Event handlers should use `Prop<Component, 'eventName'>` type, not manual `React.MouseEvent<...>`.
- Logging: data object first, message second: `logger.info({ billId }, 'Logged')`. No string interpolation.
- Error logging: Error as first arg: `logger.error(error, 'Failed')`. Wrapping in `{ error }` loses stack.
- Component types come from `lib/types.ts`, not `db/schema`.
- No `any` without a JSDoc comment explaining why.
- No optional chaining deeper than two levels. Fix the type instead.

## Pass 3: Documentation hygiene (severity:suggestion)

Flag when changes need doc updates:

- **AGENTS.md**: new architectural patterns, renamed critical files, changed conventions.
- **docs/**: new user-facing features, changed config, affected setup/deployment.

Skip docs for: bug fixes, refactors with no API change, test additions, dependency bumps.

## Stay silent when

- Formatting, whitespace, import order (Prettier/ESLint).
- Test files (separate testing.instructions.md applies).
- `drizzle/` migration SQL (generated, never hand-edited).
- Commit messages (CI validates).
- Confidence below 80%. False positives erode trust faster than missed issues.
