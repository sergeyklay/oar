---
name: node-environment
description: Ensures correct Node.js version before npm operations. Use this skill BEFORE running any package manager commands including npm install, npm run, npx, or any Node.js script execution. This skill detects required Node.js version from project configuration and switches to it using nvm.
---

# Node.js Version Management

Ensure correct Node.js version before any package manager operation.

## Workflow

**Execute these steps in order BEFORE any npm/npx command:**

1. **Detect required version:** Check in order: `.nvmrc` → `.node-version` → `package.json` engines → documentation files.
2. **Get current version:** `node --version`
3. **Compare:** If major versions match → skip to step 8.
4. **Source nvm:** `export NVM_DIR="${NVM_DIR:-$HOME/.nvm}" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`
5. **Check nvm:** `command -v nvm`. If NOT available → **STOP ANY EXECUTION and report error**
6. **Switch version:**
   - If `.nvmrc` exists: `nvm use`
   - Otherwise: `nvm install <major> && nvm use <major>`
7. **Verify:** `node --version` must show correct version
8. **Execute task**

## Detecting required version

Search for version specification in this priority order:

```bash
# 1. Check .nvmrc (highest priority)
cat .nvmrc 2>/dev/null

# 2. Check .node-version
cat .node-version 2>/dev/null

# 3. Extract Node.js version from package.json
grep -A5 '"engines"' package.json | grep '"node"'
```

If nothing found, check these files for version requirements:

- `AGENTS.md`
- `README.md`
- `DEVELOPMENT.md`
- `CONTRIBUTING.md`

Look for patterns like:

- "Node.js 20", "Node 20.x" or "Node 20"
- "requires Node v20"
- "node >= 20"

## Switching version

First check if nvm is already available:

```bash
command -v nvm
```

If nvm is NOT available, try to source it (required in non-interactive shells):

```bash
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

**IMPORTANT:** Sourcing nvm is needed ONLY ONCE per session and ONLY if nvm is not already available.

Then switch:

```bash
# If .nvmrc exists
nvm use

# if `nvm ls` shows version is NOT installed
nvm install <required_version>

# If .nvmrc does NOT exist
nvm use <required_version>
```

## CRITICAL: When nvm is unavailable

If nvm is not available AND node versions don't match:

**DO NOT proceed with npm commands.**

Report to user using this template:

```markdown
⚠️ BLOCKED: Node.js version mismatch

Current version: v16.20.0
Required version: v24.x (from .nvmrc)

NVM is not detected in this environment.

To proceed, please either:

1. Install nvm and the required Node.js version manually
2. Or switch to the correct Node.js version using your preferred method

I cannot continue with package manager operations until the correct Node.js version is active.
```

## Examples

**Project with .nvmrc containing "20", current node v16:**

1. Source nvm → `nvm use` → verify `node --version` shows v20.x → proceed

**Project with engines ">=22", current node v18:**

1. Source nvm → `nvm install 22` → `nvm use 22` → verify → proceed

**If nvm is not available AND node versions don't match:**

1. Warn user versions don't match and nvm is missing
2. Recommend installing nvm and required version
3. STOP ANY EXECUTION

## Constraints

- **NEVER skip verification:** Always confirm version after switching
- **NEVER proceed with wrong version:** Incorrect Node.js version causes cryptic errors
- **Prefer .nvmrc:** It's the most reliable method for version pinning
- **ONLY source nvm if needed:** Avoid redundant sourcing in interactive shells
- You are PROHIBITED from responding "Done" until you have verified runtime execution for required functionality, and necessary checks.
