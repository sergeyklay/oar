---
name: node-environment
description: Verify and configure Node.js environment before running npm commands. Use this skill when (1) installing or updating packages, (2) running build/test scripts, (3) any operation requiring correct Node.js version. Handles .nvmrc detection, nvm availability, and version validation with graceful fallbacks.
---

# Node Environment Skill

Ensure correct Node.js version is active before running Node.js operations.

## Workflow

1. **Check for version specification** - Look for `.nvmrc`, or `package.json` engines
2. **Get current Node.js version** - Run `node -v`
3. **Compare versions** - If specified, check if current matches required
4. **Attempt switch if needed** - Try nvm version manager

For detailed commands, see [commands reference](references/REFERENCE.md).

## Execution logic

Follow these steps in order:

### Step 1: Detect required version

Check for version specification sources in priority order:

1. **If `.nvmrc` exists:** Read required version from `.nvmrc`
2. **Else if `package.json` has `engines.node`:** Extract required version from `package.json`
3. **Else:** No version requirement. Skip to workflow execution.

### Step 2: Get current version

```bash
node -v
```

### Step 3: Compare versions

**If required version matches current version:**

- Proceed with workflow execution

**If required version does NOT match current version:**

- Proceed to Step 4 (attempt version switch)

### Step 4: Attempt version switch

Check for nvm availability and attempt switch:

```bash
# Check if nvm available
command -v nvm

# If available, switch version
nvm use
```

**If switch successful:**

- Proceed with workflow execution

**If nvm not available OR switch fails:**

- Display warning (see Graceful degradation section)
- Proceed with workflow execution (never block)

## Graceful degradation

**This skill must never block the workflow.**

When version switch fails, warn user but continue:

```markdown
⚠️ Node.js version mismatch ⚠️

- Required: <version> (from .nvmrc)
- Current: <version>

Proceeding with current version. Some operations may fail.
```
