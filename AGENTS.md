# Oar - Architectural Context & Global Governance

This file establishes the architectural philosophy and coding standards for **Oar**.
It is the "Constitution" for all AI agents working on this project.

**Applies to:** Every agent session, every code change.

---

## 1. System Identity

**Role:** You are a Principal Engineer maintaining a sovereign financial system. Treat user data as sacred—this system exists to serve the user, not to harvest their information.

**Core Stack:**
- Node.js 24 with npm as package manager
- Next.js 16 (App Router, React Server Components)
- React 19.2 with TypeScript
- SQLite + Drizzle ORM (local-first persistence)
- Tailwind CSS 4 + Shadcn/UI primitives
- Zod (validation), nuqs (URL state), react-hook-form (forms)
- Node.js Cron for background jobs (cron, node-cron fork)
- Docker for containerization

**Philosophy — "The Active Payer":**
> Unlike passive expense trackers that merely *record* what happened, Oar is a **commitment calendar** that enforces *awareness* of upcoming financial obligations. The user is not a passive observer—they are an **Active Payer** who must consciously acknowledge every bill. This is a feature, not friction.

**Sovereignty Principle:**
> All data lives on the user's machine. There is no cloud sync, no telemetry, no external API calls for core functionality. The user owns their financial truth absolutely.

---

## 2. Strategic Vision

**Goal:** Build a sovereign, local-first financial commitment calendar that enforces "Active Payer" awareness and provides deep liquidity forecasting—without external banking dependencies.

**Technical Implications:**
1. **Forecasting Engine:** The system must predict future cash flow using only user-entered bill data and recurrence rules. No bank balance imports.
2. **Commitment, Not Automation:** Bills are not auto-paid by the system. The user must explicitly mark payments—this is intentional friction that builds financial awareness.
3. **Offline-First:** The app must function completely offline. SQLite with WAL mode ensures this.
4. **Single-User Focus:** No multi-tenancy, no auth system required for MVP. The database IS the user's identity.

---

## 3. Architectural Boundaries

```plaintext
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  React Server   │  │  Client Leaf    │  │   URL State     │  │
│  │  Components     │  │  Components     │  │   (nuqs)        │  │
│  │  (app/, pages)  │  │  ('use client') │  │                 │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘  │
│           │                    │                                │
└───────────┼────────────────────┼────────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATION LAYER                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Server Actions                         │   │
│  │                   (actions/*.ts)                         │   │
│  │   • Zod validation                                       │   │
│  │   • Calls Domain Services                                │   │
│  │   • revalidatePath() for cache                           │   │
│  │   • Returns ActionResult<T>                              │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Services (lib/services/)                 │   │
│  │   • RecurrenceService: Next due date calculations        │   │
│  │   • SettingsService: User preferences                    │   │
│  │   • [Future] ForecastingService: Liquidity predictions   │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Utilities (lib/*.ts)                     │   │
│  │   • money.ts: Integer currency conversion                │   │
│  │   • utils.ts: Pure helper functions                      │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Drizzle ORM (db/schema.ts)                  │   │
│  │   • SQLite with WAL mode                                 │   │
│  │   • Type-safe queries                                    │   │
│  │   • Migrations via drizzle-kit                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Rules (Access Matrix)

| Layer | CAN Access | CANNOT Access |
|-------|------------|---------------|
| **React Server Components** | Server Actions, Domain Services (read-only queries), URL state | Client state, browser APIs |
| **Client Components** | Server Actions (via form/mutation), props from parent, URL state | Domain Services directly, database |
| **Server Actions** | Domain Services, Drizzle queries, Zod schemas | UI components, React hooks |
| **Domain Services** | Other services, Drizzle ORM, pure utilities | Server Actions, UI, Next.js APIs (revalidate, cookies) |
| **Utilities (lib/*.ts)** | Other utilities, external libs | Services, Actions, Database, UI |

### The Golden Rule of Logic Isolation

> **Business logic MUST live in `lib/services/`.**
> Server Actions are thin orchestration—validate, delegate, revalidate. No math, no business rules.
> UI components render and capture input. No calculations beyond display formatting.

---

## 4. Data Flow & Patterns

### Standard Mutation Flow (User Creates a Bill)

```plaintext
User Input (Form)
      │
      ▼
┌─────────────────┐
│ Client Component│  ← 'use client' (BillFormDialog)
│ react-hook-form │
└────────┬────────┘
         │ onSubmit()
         ▼
┌─────────────────┐
│  Server Action  │  ← actions/bills.ts::createBill()
│  1. Zod parse   │
│  2. toMinorUnits│  ← lib/money.ts (pure conversion)
│  3. db.insert() │  ← Drizzle ORM
│  4. revalidate  │
└────────┬────────┘
         │ ActionResult<T>
         ▼
┌─────────────────┐
│ Client Component│  ← Handles success/error, closes dialog
└─────────────────┘
```

### Standard Read Flow (Server Component)

```plaintext
Route Request (/bills)
      │
      ▼
┌──────────────────┐
│  Server Component│  ← app/page.tsx (RSC)
│  await getBills()│  ← Server Action or direct query
└────────┬─────────┘
         │ BillWithTags[]
         ▼
┌─────────────────┐
│  Render JSX     │  ← Pass data as props to child components
└─────────────────┘
```

### URL State Pattern (Filtering)

```plaintext
User clicks filter
      │
      ▼
┌─────────────────┐
│  nuqs hook      │  ← useQueryState('tag')
│  updates URL    │  ← /bills?tag=utilities
└────────┬────────┘
         │ URL change triggers RSC refetch
         ▼
┌─────────────────┐
│  Server Component│  ← Reads searchParams, filters query
└─────────────────┘
```

---

## 5. Development Constraints

### Money Handling — THE IRON RULE

> **All monetary values are stored and transmitted as INTEGERS (minor units).**
> - Database: `amount INTEGER` (4999 = $49.99)
> - API/Actions: Always integers
> - Conversion: Only at UI boundary via `lib/money.ts`
> - NEVER use `float`, `double`, or `Decimal` for money

### React Server Components First

- **Default:** Every component is a Server Component unless proven otherwise.
- **`use client` Criteria:** Only add when the component requires:
  - `useState`, `useEffect`, or other hooks
  - Event handlers (`onClick`, `onSubmit`)
  - Browser-only APIs
- **Leaf Node Rule:** Client components should be as small as possible—push `use client` to the leaves.

### State Management Hierarchy

1. **URL State (nuqs):** Filters, pagination, selected dates—anything shareable/bookmarkable
2. **Form State (react-hook-form):** In-progress form data
3. **Server State:** Fetched via Server Components or Server Actions
4. **Local Component State:** Only for ephemeral UI (dialog open/closed, hover states)
5. **Global Client Store:** NOT USED. No Zustand, no Redux, no Context for app state.

### Validation Strategy

- **Server Actions:** Zod schemas are the source of truth. Validate ALL input.
- **Client Forms:** Use `@hookform/resolvers/zod` to share schemas.
- **Trust Nothing:** Treat all input as hostile, even from internal components.

### Date/Time Handling

- **Storage:** Timestamps in milliseconds (`timestamp_ms` mode in Drizzle)
- **Library:** `date-fns` for all date manipulation
- **Timezone:** Normalize to user's local timezone at display, store in UTC

---

## 6. Anti-Patterns (Forbidden)

These patterns are explicitly banned. If you see them in existing code, do NOT replicate—flag for refactoring.

- ❌ **Floating-point money:** Never `amount: 49.99`. Always `amount: 4999`.
- ❌ **Business logic in Server Actions:** Actions validate and delegate. No `if (bill.frequency === 'monthly')` calculations.
- ❌ **Business logic in Components:** Components render. No `const nextDue = addMonths(bill.dueDate, 1)`.
- ❌ **External SaaS for core features:** No Plaid, Yodlee, or cloud APIs for bill/payment data.
- ❌ **Global state stores:** No Zustand, Redux, or React Context for application state.
- ❌ **`use client` at route level:** Never make a page component a client component.
- ❌ **Direct DB access in components:** Components never import from `@/db`.
- ❌ **Raw SQL:** Use Drizzle's query builder. Raw SQL only for migrations.
- ❌ **Premature abstraction:** Don't create helpers/utils for one-time operations.
- ❌ **Optional chaining avalanche:** Fix the type, don't chain `?.` five levels deep.

---

## 7. Critical File Locations

```plaintext
oar/
├── AGENTS.md                    ← YOU ARE HERE (Constitution)
├── .cursor/
│   ├── rules/                   ← Tactical coding patterns (HOW)
│   │   ├── testing.mdc
│   │   ├── preservation.mdc     ← SACRED (DO NOT MODIFY)
│   │   └── environment.mdc      ← SACRED (DO NOT MODIFY)
│   ├── specs/                   ← Feature specifications
│   └── plans/                   ← Implementation plans
│
├── app/                         ← Next.js App Router
│   ├── layout.tsx               ← SACRED (root providers, fonts)
│   ├── globals.css              ← SACRED (design tokens)
│   └── page.tsx                 ← Home route
│
├── actions/                     ← Server Actions (Orchestration)
│   ├── bills.ts                 ← Bill CRUD operations
│   ├── tags.ts                  ← Tag management
│   └── transactions.ts          ← Payment history
│
├── lib/                         ← Domain Layer
│   ├── services/                ← Business Logic (THE LAW)
│   │   ├── RecurrenceService.ts ← Due date calculations
│   │   └── SettingsService.ts   ← User preferences
│   ├── money.ts                 ← Currency conversion (integers!)
│   └── utils.ts                 ← Pure utilities
│
├── db/                          ← Persistence Layer
│   ├── schema.ts                ← Drizzle schema (source of truth)
│   └── index.ts                 ← Database connection
│
├── docs/                        ← All project documentation
│
├── components/
│   ├── ui/                      ← Shadcn primitives (DO NOT EDIT)
│   ├── layout/                  ← SACRED (AppShell, Sidebar)
│   └── features/                ← Feature-specific components
│       ├── bills/
│       └── calendar/
│
├── drizzle/                     ← Generated migrations
├── components.json              ← SACRED (Shadcn config)
├── tailwind.config.ts           ← SACRED (theme extensions)
└── package.json                 ← Dependencies & scripts
```

### Sacred Files Protocol

Files marked `SACRED` must NOT be modified without explicit user instruction. When modifying adjacent code:
1. Do NOT reset or overwrite sacred files
2. Do NOT remove existing CSS variables or theme tokens
3. Do NOT restructure the layout component hierarchy
4. APPEND to configuration files; never replace

---

## 8. Refactoring Protocol

### Strategy: STRICT

When encountering legacy or inconsistent code:

1. **New Code:** Enforce all standards in this document. No exceptions.
2. **Touched Code:** If you modify a function, bring it up to standard.
3. **Adjacent Code:** Do NOT refactor code you weren't asked to touch.
4. **Legacy Containment:** If old patterns exist, document them as tech debt but do not spread them.

### The Boy Scout Rule

> Leave code *you touched* cleaner than you found it. Leave code *you didn't touch* alone.

---

Last Updated: 2025-12-10

Maintained by: AI Agents under human supervision
