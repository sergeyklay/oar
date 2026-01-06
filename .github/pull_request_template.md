### Scope & Context

**Type:** [Feat | Fix | Refactor | Chore | Perf]

**Intent:** [1-2 sentences explaining the business or technical goal - the "Why"]

**Related Issues:** [#123, PROJ-456, etc. - Remove this line if none]

### Reviewer Guide

**Complexity:** [Low | Medium | High]

#### Entry Point

[Identify the most critical or complex file where the reviewer should start. Explain what the file is and why it's important to understand the changes.]

#### Sensitive Areas

- `path/to/file`: [Brief description of why this needs extra scrutiny]

### Risk Assessment

- **Breaking Changes:** [Yes + details | No breaking changes]
- **Migrations/State:** [Database migrations or manual steps required | No migrations or state changes]

<!--

Constraints:

1. NO EMOJIS. Use professional Markdown formatting only. Emojis are allowed only for the section headers as shown in the output format.
2. NO FLUFF. Avoid generic intros like "This PR updates...".
3. STATIC SECTIONS. All 3 sections shown in the output format are REQUIRED in the summary.
4. DYNAMIC SUB-SECTIONS. Only show sub-sections if relevant data exists.
5. NO TOP-LEVEL HEADERS. Start directly with the first section key.
6. USING DASHES. Use a single hyphen "-" and add spaces before and after the hyphen. Do not use "—" for dashes.
    * FORBIDDEN: Breaking Changes: No—all modifications are documentation and configuration updates with no functional impact to codebase or build process.
    * ALLOWED: Breaking Changes: No - all modifications are documentation and configuration updates with no functional impact to codebase or build process.
7. FILENAMES. Filenames should be wrapped in backticks: `lib/services/AutoPayService.ts`
8. **CRITICAL**. Make sure the summary and EVERY ELEMENT of the summary is up to date, following the output format, and accurate for every commit in the PR as well as the overall PR. This is a critical requirement. The summary should NOT contain anything that is not described in this instruction.

-->
