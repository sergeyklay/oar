---
name: node-environment
description: Verify and configure Node.js environment before running npm commands. Use this skill when (1) installing or updating packages, (2) running build/test scripts, (3) any operation requiring correct Node.js version. Handles .nvmrc detection, nvm availability, and version validation with graceful fallbacks.
---

# Node Environment Skill

Ensure correct Node.js version is active before running Node.js operations.

## Workflow

1. **Check for version specification** - Look for `.nvmrc`, `.node-version`, or `package.json` engines
2. **Get current Node.js version** - Run `node -v`
3. **Compare versions** - If specified, check if current matches required
4. **Attempt switch if needed** - Try nvm version manager

For detailed commands, see [commands reference](references/REFERENCE.md).

## Decision tree

```plaintext
.nvmrc exists?
├── No → Continue with current Node.js
└── Yes → Compare with current version
          ├── Match → Continue
          └── Mismatch → Try version managers
                        ├── Switch successful
                        └── No manager available → Warn and continue
```

## Graceful degradation

**This skill must never block the workflow.**

When version switch fails, warn user but continue:

```markdown
⚠️ Node.js version mismatch ⚠️

- Required: <version> (from .nvmrc)
- Current: <version>

Proceeding with current version. Some operations may fail.
```
