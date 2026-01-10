---
description: Use these instructions to guide your code reviews.
excludeAgent: ["coding-agent"]
applyTo: "**"
---

# Code Review Guidelines

Guidelines for TypeScript/React/Next.js code reviews.

**Important**: When reviewing code in specific languages or technologies, refer to the corresponding instruction files in `.github/instructions/` directory for language-specific best practices, conventions, and review criteria.

## Scope

1. **Correctness** — Does the code do what it claims?
2. **Type Safety** — No `any`, unchecked nulls handled, errors propagated correctly
3. **Architecture** — Layer boundaries and common conventions respected (see #file:../../AGENTS.md for details)
4. **Performance** — No N+1 queries, unbounded loops, unnecessary re-renders
5. **Security** — No secrets in code/logs, input validated, no XSS vectors
6. **Style** — Airbnb guide, 100-char lines, JSDoc on public APIs

## Required Patterns

- Server Components by default; `'use client'` only for hooks/events
- Services contain domain logic; Actions validate and delegate
- Money stored as integers (minor units)
- Dates rendered via `<ClientDate />` component
- Types preferred over comments
- `useAsyncAction` for async operations with loading states

## Reject On Sight

- `any` type without justification
- Direct DB imports in components
- `useState`/`useEffect` in Server Components
- Floating-point money calculations
- Dead code or TODOs without issue reference
- Secrets or PII in logs
- `format()` from date-fns in JSX (hydration mismatch)

## Documentation Hygiene

Flag when changes require documentation updates:

**AGENTS.md** — Update when:
- New architectural patterns or layer boundaries introduced
- Critical files added/removed/renamed
- Core philosophy or conventions change

**docs/** — Update when:
- User-facing features added or behavior changed
- Configuration options modified
- Setup/deployment steps affected

Do NOT require docs for: bug fixes, refactors with no API change, test additions, dependency updates and minor changes that do not affect usage.
