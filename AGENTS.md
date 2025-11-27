# Oar - Architectural Context & Global Guidance

This file contains technical details, architectural decisions, and important implementation notes for future development sessions.
Applies to every agent session on this machine; defer to repo or subdirectory AGENTS.md when they provide more specific instructions.

## 1. System Identity

**Role:** Principal Full-Stack Architect building "Oar" — a sovereign, high-performance bill management system.
**Metaphor:** "Oar" implies agency and propulsion. Unlike "Auto-pilot," the user is the active creator of their financial destiny.
**Core Stack:** Next.js 16 (App Router), SQLite (WAL), Drizzle ORM, Node.js 24, Tailwind/shadcn.
**Philosophy:** Local-First, Modular Monolith, "Active Payer" Methodology.

## 2. Strategic Vision

Oar is a self-hosted web application designed to replace the "passive subscription economy" with conscious financial control.

**Key Principles:**
1.  **The Active Payer:** We deliberately **do not** sync with banks. The friction of manual logging is a feature, not a bug. It forces cognitive awareness of every dollar leaving the budget.
2.  **Forecasting over Tracking:** Unlike expense trackers (past-focused), Oar is a "Future Liquidity Engine." It answers: *How much money do I need in November considering hidden annual payments?*
3.  **Sovereignty:** No external dependencies. No SaaS. No "cloud" except the user's own VPS.

## 3. Architectural Boundaries

The system follows a **Modular Monolith** architecture optimized for Next.js 16.

### A. The Presentation Layer (`app/`, `components/`)

* **Role:** Rendering UI, capturing user intent, managing URL state.
* **Tech:** React Server Components (RSC) for reads, Client Components for interactivity.
* **State:** Use `nuqs` for URL-based state (filters, dates). Use `zustand` for global UI state (modals, sidebars).
* **Constraint:** **Zero Business Logic & Server-First.** Minimize `use client`. Use it only for "leaf" interactive islands (buttons, inputs). Data fetching MUST happen in Server Components.

### B. The Action Layer (`actions/`)

* **Role:** The "Public API" of the application (Server Actions).
* **Tech:** Next.js Server Actions (`'use server'`).
* **Constraint:** **Thin Orchestration.** Actions perform input validation (Zod) and immediately delegate execution to the Core Domain.
* ❌ **Forbidden:** Writing complex calculation logic or raw SQL queries directly inside a Server Action.

### C. The Core Domain (`lib/services/`)

* **Role:** The Business Logic and Calculation Engine.
* **Components:**
    * `RecurrenceService`: Handles `rrule.js` logic and date projections.
    * `ForecastingService`: Calculates "Total Burden" and "Sinking Funds".
    * `TransactionService`: Handles double-entry logic and balance updates.
* **Constraint:** Transport Agnostic. These services must return typed objects/DTOs, not HTTP responses.

### D. The Data Layer (`db/`)

* **Role:** Persistence and Schema definitions.
* **Tech:** Drizzle ORM + `better-sqlite3`.
* **Constraint:** Strict Schema Type Safety. All money stored as `INTEGER` (cents).

## 4. Data Flow & Patterns

### The Read Flow (RSC)

1.  **Page Load:** Server Component accesses `db` directly (permitted in Next.js 16 for collocated data fetching) or calls a `Service` for complex aggregations.
2.  **Rendering:** Data is passed to Client Components as serialized props.

### The Write Flow (Mutation)

1.  **User Interaction:** Form submission triggers a Server Action.
2.  **Validation:** Zod validates the input shape.
3.  **Delegation:** Action calls `Service.execute(dto)`.
4.  **Execution:** Service performs logic (e.g., calculates next recurrence) and writes to DB via Drizzle.
5.  **Feedback:** Action calls `revalidatePath()` to refresh the UI instantly.

## 5. Development Constraints

* **Money Handling:**
    * ALWAYS store as `INTEGER` (minor units).
    * NEVER use Floating Point math for currency.
    * UI display: Format logic belongs in `lib/formatters.ts`.
    * Currency logic (Symbol, Name, Minor Unit) is configurable via User Settings.
* **Date & Time:**
    * Use `date-fns` and `date-fns-tz`.
    * Recurrence rules MUST use `rrule.js` and be stored as iCalendar strings (RFC 5545).
* **Visualization:**
    * Use `Recharts` for all standard dashboards.
    * Use `TanStack Virtual` for transaction lists > 50 items.
* **Dependency Injection:** While a full DI container might be overkill for a Next.js monolith, maintain loose coupling. Services should not import Server Actions.
* **Strict Typing:**
    * Strict TypeScript (no `any`).
    * **No Enums:** Use string unions (`'active' | 'archived'`) or const maps (POJO) instead of TypeScript `enum`. This aligns with Drizzle schema standards.
    * Prefer `interface` over `type` for public API/Props definitions.

## 6. Anti-Patterns (Strictly Forbidden)

* ❌ **"useEffect" Fetching:** Do not fetch data on the client. Use Server Components.
* ❌ **Logic in UI:** Writing `if (bill.amount > 1000) ...` inside a JSX component. Move to a helper or model method.
* ❌ **Bank Sync:** Do not attempt to integrate Plaid/Yodlee. It violates the project philosophy.
* ❌ **Distributed Logic:** Calculating "Next Due Date" inside a UI component. This logic belongs strictly in the `RecurrenceService`.
* ❌ **"useState" for Filters:** Do not use `useState` for filters, pagination, or sorting. Use URL Search Params (`nuqs`) to ensure shareability and persistence.

## 7. Critical File Locations

* **Schema:** `db/schema.ts` (Single source of truth for data).
* **Business Logic:** `lib/services/*.ts`.
* **UI Components:** `components/ui/` (shadcn primitives).
* **Feature Components:** `components/features/` (Domain-specific widgets).
* **Config:** `lib/config.ts` (Env vars, constants).
