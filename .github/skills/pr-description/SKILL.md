---
name: pr-description
description: Generates standardized pull request descriptions following project conventions for GitHub PRs. Use when asked to create a PR description, or when PR description generation is part of a larger PR creation workflow. This skill handles the FORMAT rules for PR descriptions. For the actual PR creation workflow, or PR title generation, use appropriate skill.
---

# Pull Request Description Format

Follow these conventions when creating a pull request description.

## PR Description Structure

Use the project template with three required sections. See [PR Template](./assets/pull_request_template.md).

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

[Example 1: Start with `lib/services/AutoPayService.ts` - this is where the core logic change happens. The rest of the files are just adapting to the new return type introduced here. Understanding this file first will make the other changes obvious.]
[Example 2: Start with `lib/models/Bill.ts` - there are changes to how `nextDueDate` is calculated. This looks minor but it affects validation in 3 other services. Once you see the new calculation logic, the changes in `AutoPayService` and `BillValidator` will make sense.]
[Example 3: Start with `lib/services/PaymentProcessor.ts` - this contains the most significant change: switching from sync to async transaction handling. Pay attention to the error handling block on lines 45-60, this is where the behavior differs from before.]
[Example 4: Start with `lib/services/AutoPayService.ts` - this file drives the change. The modifications in other files follow from the new interface defined here.]
[Example 5: No specific entry point needed - changes are straightforward and self-contained. Each file can be reviewed independently. The `AutoPayService.ts` change is just a string update in the notes field, other files follow the same pattern.]

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

| Rule                      | Requirement                                               |
| ------------------------- | --------------------------------------------------------- |
| **Emojis**                | Only in section headers (🎯, 🧭, ⚠️) as shown in template |
| **No fluff**              | Avoid generic intros like "This PR updates..."            |
| **All sections required** | Include all 3 sections from template                      |
| **Dynamic sub-sections**  | Only show sub-sections if relevant data exists            |
| **No top-level headers**  | Start directly with first section                         |
| **Dashes**                | Use single hyphen with spaces: " - " not "—"              |
| **Filenames**             | Wrap in backticks: \`lib/services/AutoPayService.ts\`     |

## Complexity Assessment

| Level      | Criteria                                                                         |
| ---------- | -------------------------------------------------------------------------------- |
| **Low**    | Single file or config changes, documentation, simple fixes                       |
| **Medium** | Multiple related files, new features with tests, refactoring                     |
| **High**   | Cross-cutting changes, database migrations, breaking changes, security-sensitive |

## Anti-Patterns

| Pattern                     | Problem                  | Correct Form                        |
| --------------------------- | ------------------------ | ----------------------------------- |
| `This PR adds...`           | Fluff intro              | Start with Type and Intent directly |
| Using "—"                   | Em-dash causes issues    | Use " - " (hyphen with spaces)      |
| Missing Entry Point         | Reviewer lacks direction | Always specify where to start       |
| `file.ts` without backticks | Poor formatting          | Use \`file.ts\`                     |

## Language

ALWAYS write PR descriptions in **English** regardless of conversation language.
