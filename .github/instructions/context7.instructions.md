---
name: 'Context7 Documentation Retrieval'
description: 'When and how to use Context7 MCP to fetch live library documentation instead of relying on training data'
applyTo: '**'
---

# Context7 Usage

Context7 fetches live, version-specific documentation for external libraries. Use it to prevent hallucinated APIs and outdated code patterns. Do not use it as a general knowledge base.

## Two-Step Workflow

Every Context7 interaction follows two calls in strict sequence.

**Step 1 — Resolve the library ID.** Call `resolve-library-id` with the human-readable library name and your current question. Do not guess library IDs.

**Step 2 — Query the documentation.** Call `query-docs` with the resolved ID, a specific question, and optionally a topic filter and token budget.

Do not call `query-docs` without first calling `resolve-library-id`, unless the user has explicitly provided a Context7 ID in `/org/project` format.

## When to Use Context7

Use Context7 when writing code that depends on an **external library's API surface** and any of these conditions hold:

- The library has had breaking changes between major versions.
- The API in question was introduced or modified after 2024.
- You are unsure whether a function, method, or parameter exists in the current version.
- The user asks you to use Context7 or to check the latest docs.

Typical use cases for this project's dependencies:

| Dependency | Context7 useful? | Reason |
|---|---|---|
| Next.js 16 (App Router) | Yes | RSC patterns, Server Actions, and caching APIs change between major versions |
| React 19 | Yes | New APIs (`use`, `useActionState`, `useOptimistic`) introduced recently |
| Drizzle ORM | Yes | Active development; query builder API evolves across minor versions |
| Zod 4 | Yes | Major version with breaking changes from v3 |
| nuqs | Check first | Niche URL state library; call `resolve-library-id` and fall back to web search if not indexed |
| react-hook-form | Yes | API surface changed between v7 and v8; resolver patterns vary |
| date-fns | No | Stable API since v3, slow release cycle, training data sufficient |
| better-sqlite3 | No | Stable C++ binding with minimal API surface, rarely changes |
| Tailwind CSS 4 | Yes | Major rewrite from v3; configuration and class syntax differ |
| shadcn/ui | Yes | Component APIs and installation patterns update frequently |
| pino | No | Stable logger API, well-documented, training data sufficient |
| rrule | No | Stable RFC 5545 implementation, no recent breaking changes |

## When Not to Use Context7

Do not call Context7 when:

- The answer exists in this project's own documentation (`AGENTS.md`, `docs/architecture/`, `docs/features/`). Project-internal docs are always authoritative over external sources.
- The question is about a general programming concept (data structures, design patterns, async patterns). Use training knowledge or web search.
- The library is part of the Node.js standard library or the TypeScript type system. Both are backward-compatible and training data is reliable.
- You already have high confidence in the API from recent, verified training data and the library has not had a major release.

## Writing Effective Queries

### Query specificity

Context7 uses vector search to rank documentation. Vague queries return diluted, irrelevant content.

```
Bad:  "How do I use Drizzle?"
Good: "How do I define a many-to-many relation with a junction table in Drizzle ORM SQLite?"

Bad:  "Tell me about Next.js Server Actions"
Good: "How do I return field-level validation errors from a Next.js 16 Server Action using Zod?"

Bad:  "React hooks"
Good: "How does useOptimistic work with Server Actions in React 19?"
```

### Topic filter

The optional `topic` parameter narrows results by keyword. Use it when the library has broad documentation and you need a specific section.

```
query-docs({
  libraryId: "/vercel/next.js",
  query: "How do I revalidate cached data after a Server Action mutation?",
  topic: "caching"
})
```

Use one-word topics matching the library's documentation structure: `authentication`, `pagination`, `caching`, `migrations`, `middleware`, `transactions`, `validation`, `relations`.

### Token budget

| Scenario | Tokens | Rationale |
|---|---|---|
| Single API call signature | 3000 | Minimal context needed |
| Feature implementation with examples | 5000 | Default; good balance |
| Multi-step setup or migration guide | 8000-10000 | Broad context needed |

Context7 ranks results: code examples first, API signatures second, prose last. Higher budgets include more prose, not necessarily more useful code.

## Handling Failures

If `resolve-library-id` returns "No libraries found":

1. Try alternative names (e.g., "nextjs" instead of "next.js", "react-hook-form" instead of "react hook form", "drizzle-orm" instead of "drizzle").
2. If still not found, the library is not indexed. Fall back to web search or the library's official documentation site.
3. Do not retry the same query. Do not fabricate a library ID.

If `query-docs` returns irrelevant content:

1. Narrow the `topic` parameter.
2. Rephrase the `query` to be more specific.
3. Reduce the `tokens` budget to force higher-relevance filtering.

## Rules

- Do not call Context7 speculatively "just in case." Each call consumes tokens and latency. Use it when there is a concrete question about an external API.
- Do not trust Context7 output blindly. Cross-check returned APIs against the actual library version declared in `package.json`.
- Do not use Context7 to fetch documentation for libraries this project intentionally avoids (external SaaS APIs like Plaid, Yodlee, or cloud sync services). See `AGENTS.md` for the full list of constraints.
- When Context7 documentation conflicts with `docs/architecture/` or `AGENTS.md`, the project documentation wins. Context7 tells you what an external library *can* do; the project docs tell you what this project *will* do.
