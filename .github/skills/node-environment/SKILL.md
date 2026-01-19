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
3. **Compare:** If major versions match, skip steps 4-5 and go directly to step 6 (**Execute task**).
4. **Switch version:**
   - If `.nvmrc` exists: `nvm use`
   - Otherwise: `nvm install <major> && nvm use <major>`
5. **Verify:** `node --version` must show correct version
6. **Execute task**

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

1. First check if nvm is already available:

```bash
command -v nvm
```

2. If nvm is NOT available, try to source it (required in non-interactive shells):

```bash
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

**IMPORTANT:** Source nvm only once per shell session (for example, once per new terminal window/tab, CI job, or agent run), and only if nvm is not already available.

3. Proceed to switch versions:

- If nvm is still NOT available → follow the error workflow in **CRITICAL: When nvm is unavailable**.

- If nvm is available → switch node versions:

  ```bash
  # Check installed versions
  nvm ls

  # If the required version is not listed above, install it
  nvm install <required_version>

  # If .nvmrc exists
  nvm use

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
3. Do not proceed, wait for user action

## Troubleshooting

Use this table to quickly handle common Node.js and nvm issues.

| Issue                        | What it means                                                               | How to fix                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nvm: command not found`     | `nvm` is not in the PATH or not loaded in this shell.                       | Source `nvm` by running `export NVM_DIR="${NVM_DIR:-$HOME/.nvm}" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`. If that fails, install `nvm` in the environment. |
| `N/A: version not installed` | The requested Node.js version is not installed in `nvm`.                    | Run `nvm install <required_version>` and then `nvm use <required_version>`.                                                                                            |
| `No .nvmrc file found`       | You ran `nvm use` but the project does not have a `.nvmrc` file.            | Detect the required version from `.node-version` or `package.json` engines, then run `nvm install <required_version>` and `nvm use <required_version>`.                |
| `Permission denied`          | The shell cannot execute a command or write to a directory that `nvm` uses. | Check file permissions on your project and `~/.nvm` directory, avoid `sudo` with `nvm`, and retry the command.                                                         |

## Constraints

- **NEVER skip verification:** Always confirm version after switching
- **NEVER proceed with wrong version:** Incorrect Node.js version causes cryptic errors
- **Prefer .nvmrc:** It's the most reliable method for version pinning
- **ONLY source nvm if needed:** Avoid redundant sourcing in interactive shells
