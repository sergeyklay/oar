# PR Description Guidelines

This reference contains formatting rules and examples for PR descriptions.

## Formatting Constraints

1. **NO EMOJIS** - Use professional Markdown formatting only. Emojis allowed only for section headers (🎯, 🧭, ⚠️)

2. **NO FLUFF** - Avoid generic intros like "This PR updates..."

3. **STATIC SECTIONS** - Three top-level sections are REQUIRED:
   - 🎯 Scope & Context
   - 🧭 Reviewer Guide
   - ⚠️ Risk Assessment

4. **DYNAMIC SUB-SECTIONS** - Remove sub-sections that don't apply

5. **USING DASHES** - Single hyphen with spaces around it
   - ✅ `Breaking Changes: No - all modifications are documentation`
   - ❌ `Breaking Changes: No—all modifications are documentation`

6. **FILENAMES** - Wrap in backticks: `` `lib/services/AutoPayService.ts` ``

7. **ACCURACY** - Only list changes actually implemented in the PR

8. **RELATED ISSUES** - Omit line entirely if none exist. Never leave empty.

## Section Details

### Scope & Context

| Field              | Description                                             |
| ------------------ | ------------------------------------------------------- |
| **Type**           | One of: Feat, Fix, Refactor, Chore, Perf                |
| **Intent**         | 1-2 sentences explaining the business or technical goal |
| **Related Issues** | Issue numbers from commits. Omit if none.               |

### Reviewer Guide

| Field               | Description                                             |
| ------------------- | ------------------------------------------------------- |
| **Complexity**      | Low, Medium, or High                                    |
| **Entry Point**     | Most critical file to start review + explanation of why |
| **Sensitive Areas** | Files requiring extra scrutiny (auth, payments, data)   |

### Risk Assessment

| Field                | Description                                        |
| -------------------- | -------------------------------------------------- |
| **Breaking Changes** | "Yes + details" or "No breaking changes"           |
| **Migrations/State** | Required steps or "No migrations or state changes" |

## Complexity Criteria

| Level      | Criteria                                                      |
| ---------- | ------------------------------------------------------------- |
| **Low**    | Single file, config changes, documentation, simple fixes      |
| **Medium** | Multiple related files, new features with tests, refactoring  |
| **High**   | Cross-cutting changes, migrations, breaking changes, security |

## Example PR Description

```markdown
### 🎯 Scope & Context

**Type:** Chore

**Intent:** Refactor agent identifiers to use more descriptive naming conventions and clean up VS Code workspace configuration by removing unused settings.

### 🧭 Reviewer Guide

**Complexity:** Low

#### Entry Point

Start with the agent configuration files in `.github/agents/` directory. Begin with `planner.agent.md` to understand the agent naming changes and handoff dependencies, then cross-reference the updated agent names in `architect.agent.md`, `coder.agent.md`, `test.agent.md`, and `writer.agent.md` to verify that all handoff references are correctly updated.

#### Sensitive Areas

- `.github/agents/planner.agent.md`: Updated handoff references and modified compliance-check workflow logic
- `oar.code-workspace`: Configuration removals for git settings and extension recommendations

### ⚠️ Risk Assessment

- **Breaking Changes:** No breaking changes
- **Migrations/State:** No migrations or state changes
```
