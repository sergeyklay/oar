---
description: Pull request title and description formatting rules
applyTo: '**'
---

# Pull Request Description Format

Follow these conventions when creating pull request titles and descriptions.

## PR Title Format

Use Conventional Commits format for PR titles:

```
<type>[optional scope]: <description>
```

**Examples:**

- `feat: add bill reminder notifications`
- `fix(api): handle null user in auth middleware`
- `refactor: extract validation logic to service`
- `chore(deps): bump dependencies`

**Rules:**

- Use imperative mood: "add", "fix", "update" (not "added", "fixes")
- STRICT: Keep under 72 characters
- No period at end
- Be specific about what changed

## PR Description Structure

Use the project template with three required sections. See [PR Template](../pull_request_template.md).

### Section 1: Scope & Context

```markdown
### 🎯 Scope & Context

**Type:** [Feat | Fix | Refactor | Chore | Perf]

**Intent:** [1-2 sentences explaining the business or technical goal]

**Related Issues:** [#123 - Remove if none]
```

### Section 2: Reviewer Guide

```markdown
### 🧭 Reviewer Guide

**Complexity:** [Low | Medium | High]

#### Entry Point

[Most critical file where reviewer should start + why]

#### Sensitive Areas

- `path/to/file`: [Why this needs extra scrutiny]
```

### Section 3: Risk Assessment

```markdown
### ⚠️ Risk Assessment

- **Breaking Changes:** [Yes + details | No breaking changes]
- **Migrations/State:** [Required steps | No migrations or state changes]
```

## Formatting Constraints

| Rule | Requirement |
|------|-------------|
| **Emojis** | Only in section headers (🎯, 🧭, ⚠️) as shown in template |
| **No fluff** | Avoid generic intros like "This PR updates..." |
| **All sections required** | Include all 3 sections from template |
| **Dynamic sub-sections** | Only show sub-sections if relevant data exists |
| **No top-level headers** | Start directly with first section |
| **Dashes** | Use single hyphen with spaces: " - " not "—" |
| **Filenames** | Wrap in backticks: \`lib/services/AutoPayService.ts\` |

## Complexity Assessment

| Level | Criteria |
|-------|----------|
| **Low** | Single file or config changes, documentation, simple fixes |
| **Medium** | Multiple related files, new features with tests, refactoring |
| **High** | Cross-cutting changes, database migrations, breaking changes, security-sensitive |

## Anti-Patterns

| Pattern | Problem | Correct Form |
|---------|---------|--------------|
| `This PR adds...` | Fluff intro | Start with Type and Intent directly |
| Using "—" | Em-dash causes issues | Use " - " (hyphen with spaces) |
| Missing Entry Point | Reviewer lacks direction | Always specify where to start |
| `file.ts` without backticks | Poor formatting | Use \`file.ts\` |

## Language

ALWAYS write PR titles and descriptions in **English** regardless of conversation language.
