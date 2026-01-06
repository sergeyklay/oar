### 🎯 Scope & Context

**Type:** [Feat | Fix | Refactor | Chore | Perf]

**Intent:** [1-2 sentences explaining the business or technical goal - the "Why"]

**Related Issues:** [#123, PROJ-456, etc. - Remove this line if none]

### 🧭 Reviewer Guide

**Complexity:** [Low | Medium | High]

#### Entry Point

[Identify the most critical or complex file where the reviewer should start. Explain what the file is and why it's important to understand the changes.]

#### Sensitive Areas

- `path/to/file`: [Brief description of why this needs extra scrutiny]

### ⚠️ Risk Assessment

- **Breaking Changes:** [Yes + details | No breaking changes]
- **Migrations/State:** [Database migrations or manual steps required | No migrations or state changes]

<!--
## Constraints

1. NO EMOJIS. Use professional Markdown formatting only. Emojis are allowed only for the section headers as shown in the output format.
2. NO FLUFF. Avoid generic intros like "This PR updates...".
3. STATIC SECTIONS. The three top-level sections in this template (Scope & Context, Reviewer Guide, Risk Assessment) are REQUIRED in the summary.
4. DYNAMIC SUB-SECTIONS.  Remove sub-sections that are not applicable, and only fill in sub-sections when they are relevant.
5. SECTION HEADERS. Use the section headers defined above (### Scope & Context, ### Reviewer Guide, ### Risk Assessment) as the top-level sections in this template.
6. USING DASHES. Use a single hyphen "-" and add spaces before and after the hyphen. Do not use "—" for dashes.
    * FORBIDDEN: Breaking Changes: No—all modifications are documentation and configuration updates with no functional impact to codebase or build process.
    * ALLOWED: Breaking Changes: No - all modifications are documentation and configuration updates with no functional impact to codebase or build process.
7. FILENAMES. Filenames should be wrapped in backticks: `lib/services/AutoPayService.ts`
8. **CRITICAL**. Keep this PR description accurate and up to date as the PR evolves. Do not list changes or impacts that are not implemented in the code or commits in this PR.

## Output Format

```markdown
### 🎯 Scope & Context
**Type:** [Feat | Fix | Refactor | Chore | Perf]
**Intent:** [1-2 sentences explaining the business or technical goal - the "Why"]
**Related Issues:** [Extract issue numbers (e.g., #123 for GitHub, PROJ-456 for Jira, etc.) from commits. If none, omit this line. Do NOT use empty values here - "Related Issues: " - this is NOT allowed.]

### 🧭 Reviewer Guide
**Complexity:** [Choose one of: Low | Medium | High]
#### Entry Point
[Identify the most critical or complex file where the reviewer should start to understand the logic. Example to follow: "Start with the `schema.ts` file to understand the database schema and the core changes to the schema. Then look at ..., then look at ...". Do not use just file name, you have to explain what the file is and why it is important to understand the changes.]
#### Sensitive Areas
[List specific files or functions that require extra scrutiny (e.g., auth, payments, regex)]

### ⚠️ Risk Assessment
- **Breaking Changes:** [Choose one of:  Yes + details | No breaking changes]
- **Migrations/State:** [Database migrations or manual steps required? If none, just "No migrations or state changes"]
```

## Example

```markdown
### 🎯 Scope & Context

**Type:** Chore

**Intent:** Refactor agent identifiers to use more descriptive naming conventions (e.g., "Implement" → "Coder", "Test" → "Tester") and clean up VS Code workspace configuration by removing unused settings and extension recommendations.

### 🧭 Reviewer Guide
**Complexity:** Low

#### Entry Point
Start with the agent configuration files in `.github/agents/` directory. Begin with `planner.agent.md` to understand the agent naming changes and handoff dependencies, then cross-reference the updated agent names in `architect.agent.md`, `coder.agent.md`, `test.agent.md`, and `writer.agent.md` to verify that all handoff references are correctly updated to match the new agent identifiers.

#### Sensitive Areas

- `.github/agents/planner.agent.md`: Updated handoff references from "Implement" to "Coder" and "Specify" to "Architect", plus modified compliance-check workflow logic
- Agent name changes across all five agent files: Verify consistency in references between interdependent agents (`architect.agent.md`, `coder.agent.md`, `test.agent.md`, `writer.agent.md`)
- `oar.code-workspace`: Configuration removals for git settings, editor formatting rules, and extension recommendations

### ⚠️ Risk Assessment
- **Breaking Changes:** No breaking changes
- **Migrations/State:** No migrations or state changes
```

You can safely remove this comment before submitting the PR.
-->
