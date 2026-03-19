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

Typical use cases in this project's future milestones:

| Dependency | Context7 useful? | Reason |
|---|---|---|
| Jira Cloud REST API (tracker adapter) | Yes | API evolves across versions; field schemas vary by instance |
| GitHub API (future tracker adapter) | Yes | Endpoints and auth patterns change |
| `modernc.org/sqlite` | Check first | Niche pure-Go driver; may not be indexed — call `resolve-library-id` and fall back to `pkg.go.dev` if not found |
| `gopkg.in/yaml.v3` | No | Stable API, slow release cycle, training data sufficient |
| `github.com/fsnotify/fsnotify` | No | Stable API, well-known, training data sufficient |
| Go standard library | No | Backward-compatible, excellent official docs, never use Context7 for stdlib |

## When Not to Use Context7

Do not call Context7 when:

- The answer exists in this project's own documentation (`docs/architecture.md`, `AGENTS.md`, `docs/decisions/*.md`). Project-internal docs are always authoritative over external sources.
- The question is about a general programming concept (data structures, design patterns, concurrency theory). Use training knowledge or web search.
- The library is part of the Go standard library. Go stdlib is backward-compatible and training data is reliable.
- You already have high confidence in the API from recent, verified training data and the library has not had a major release.

## Writing Effective Queries

### Query specificity

Context7 uses vector search to rank documentation. Vague queries return diluted, irrelevant content.

```
Bad:  "How do I use Jira API?"
Good: "How do I search issues using JQL in Jira Cloud REST API v3 with pagination?"

Bad:  "Tell me about sqlite"
Good: "How do I execute a prepared statement with context cancellation in modernc.org/sqlite?"
```

### Topic filter

The optional `topic` parameter narrows results by keyword. Use it when the library has broad documentation and you need a specific section.

```
query-docs({
  libraryId: "/atlassian/jira",
  query: "How do I transition an issue via REST API?",
  topic: "transitions"
})
```

Use one-word topics matching the library's documentation structure: `authentication`, `pagination`, `webhooks`, `migrations`, `middleware`, `transactions`.

### Token budget

| Scenario | Tokens | Rationale |
|---|---|---|
| Single API call signature | 3000 | Minimal context needed |
| Feature implementation with examples | 5000 | Default; good balance |
| Multi-step setup or migration guide | 8000–10000 | Broad context needed |

Context7 ranks results: code examples first, API signatures second, prose last. Higher budgets include more prose, not necessarily more useful code.

## Handling Failures

If `resolve-library-id` returns "No libraries found":

1. Try alternative names (e.g., "jira cloud" instead of "atlassian jira", "nextjs" instead of "next.js").
2. If still not found, the library is not indexed. Fall back to web search or `pkg.go.dev` for Go packages.
3. Do not retry the same query. Do not fabricate a library ID.

If `query-docs` returns irrelevant content:

1. Narrow the `topic` parameter.
2. Rephrase the `query` to be more specific.
3. Reduce the `tokens` budget to force higher-relevance filtering.

## Rules

- Do not call Context7 speculatively "just in case." Each call consumes tokens and latency. Use it when there is a concrete question about an external API.
- Do not trust Context7 output blindly. Cross-check returned APIs against the actual library version declared in `go.mod`.
- Do not use Context7 to fetch documentation for libraries this project intentionally avoids (e.g., `mattn/go-sqlite3`, any CGo library).
- When Context7 documentation conflicts with `docs/architecture.md`, the architecture document wins. Context7 tells you what an external library *can* do; the architecture doc tells you what this project *will* do.
