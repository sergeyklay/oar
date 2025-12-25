# /document Command

Create detailed, source-of-truth documentation for features, architecture, and development guides.

## Role

Your goal is not just to "document" features, but to **explain, teach, and justify** them. You create crystal-clear, "Deep Dive" articles that serve as the definitive Source of Truth.

## Core Instruction

**Abandon the "bullet-point" style.** Do not produce dry lists of declarations.
Instead, write **narrative, educational content**. Use analogies, architectural reasoning, and concrete examples.
If a design choice seems counter-intuitive (e.g., "Why do we use text files for context?"), you MUST provide the **Argumentation** for it.

## Context

- **Project:** "Oar" (Personal Finance App).
- **Philosophy:** "Active Payer" (We value friction, manual validation, and awareness over mindless automation).
- **Audience:** Can be **Users** (Feature docs) or **Contributors** (Dev guides).
- **Style Guidelines:** STRICTLY follow the writing rules defined in @.cursor/rules/writing.mdc.
- **Existing Documentation:** Scan `docs/` to avoid duplication, and ensure consistency.

## Input

- Feature Request or User Prompt provided by the user.
- Existing Source Code (optional).
- Technical Specs provided by the user (optional).

## Operational Rules

* **File Naming:**
  1. Determine the scope of the desired documentation: `architecture`, `development`, `feature`, etc.
  2. Create the directory if it doesn't exist: `docs/{scope}/`.
  3. Scan `docs/{scope}/` to find the current highest number.
  4. Increment by 1.
  5. Format: `docs/{scope}/{NNN}-{kebab-case-name}.md`. Example: If `002-auto-pay.md` exists, create `003-forecast-view.md`.

* **Format Selector (CRITICAL):**
  * **IF** explaining "What it is / Why it exists" (Feature) -> Use **Template A**.
  * **IF** explaining "How to do X" (Deployment, Setup, Migration) -> Use **Template B**.

* **Content Constraints:**
  * ❌ **NO CODE DUMPS:** Do not copy-paste large blocks of code. Use references (e.g., "See `RecurrenceService.ts`").
  * ✅ **LOGIC OVER SYNTAX:** Describe the *rules* (e.g., "If date is weekend, move to Friday"), not the implementation details.
  * ✅ **EDGE CASES:** You MUST include a section on edge cases (Leap years, Timezones, Partial payments, etc.).
  * ✅ **VERIFICATION:** Every guide must end with "How do I know it worked?".

* **Do Not Overlap with Existing Documentation:**
  * Scan `docs/{scope}/` to find existing documentation.
  * If the feature is already documented, update the existing documentation.
  * If the feature is not documented, create a new documentation file.

## Output Format

Produce a Markdown file strictly following the appropriate template:

### Template A: Feature / Explanation

*(The "What & Why". Use for: Features, Architecture decisions, Domain logic, etc.)*

Before writing, verify: Does this feature description align with "Active Payer"?
If a feature adds automation, explicitly explain *how* it preserves user awareness.

```markdown
# {Feature Name}

- **Status:** Draft
- **Last Updated:** {YYYY-MM-DD}
- **Related:** {Links to other docs or Specs (if any)}

## Overview
*(The "Why". Concise summary of the user problem and the value proposition. Why does this feature exist? Don't start with "How to ...". Start with the problem.)*

## User Flow
*(The "How". Describe the feature from a behavioral perspective.)*

* **Trigger:** What starts the action? (e.g., User clicks button, Cron job runs).
* **Rules:**
    * Rule 1...
    * Rule 2...
* **UI Behavior:** What does the user see?

## Edge Cases & Constraints
*Critically important section.*
* What happens in a leap year?
* What if the amount is 0?
* What if the user is offline?

## Related Documents
(*Links to other documents that are relevant to this feature, if any. DO NOT create this section if there are no related documents.*)

* [document title](relative path) - One line description of the document, that matches the @docs/README.md file.
...
...
```

For example of style documentation for a feature, see `docs/features/002-auto-pay.md`.

### Template B: How-To / Guide

*(The "Action". Use for: Deployment, Setup, Migration, Testing, Contribution, Development, etc.)*

~~~markdown
# {Action Name} (e.g., Local Deployment Guide)

- **Status:** Draft
- **Last Updated:** {YYYY-MM-DD}
- **Related:** {Links to other docs or Specs (if any)}

## 1. Goal
*(What will the user achieve by following this guide?)*

## 2. Prerequisites
*(What must be installed/configured before starting? (e.g., Docker, Node.js))*

## 3. Step-by-Step Guide
*(Sequential, atomic steps.)*

### Step 1: {Action}
*(Command or Action:)*
```bash
{command}
```

Expected Output/Note: {Brief explanation}

### Step 2: {Action}

...

## 4. Configuration

Environment variables, flags, or settings.

## 5. Verification

How to validate success? (e.g., "Open localhost:8080, you should see...", "Run command ... and verify the output...", "Check the database for the expected data...", etc.)

## 6. Troubleshooting

Common errors and solutions.

## Related Documents
(*Links to other documents that are relevant to this feature, if any. DO NOT create this section if there are no related documents.*)

* [document title](relative path) - One line description of the document, that matches the @docs/README.md file.
...
...
~~~

**Always** specify language for fenced code blocks, if not applicable, use `plaintext`.

## Verification

Before outputting, ensure:

1. Did you select the correct template (Feature vs Guide)?
2. If this is a feature, did you follow the "Active Payer" philosophy?
3. The filename number is correct (sequential).
4. No implementation code is pasted (only logic described).
5. Did you follow @.cursor/rules/writing.mdc rules?
6. Did you STRICTLY follow the "Core Instruction" instructions?

ONLY respond "Done" if you have verified all the above.
