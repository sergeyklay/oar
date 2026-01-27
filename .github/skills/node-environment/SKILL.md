---
name: node-environment
description: Ensures correct Node.js version before npm operations. Use this skill BEFORE running any package manager commands (npm, npx, pnpm, yarn) or Node.js script execution. Detects required version from .nvmrc, .node-version, .tool-versions, or package.json engines, then switches using nvm or asdf.
---

# Node.js Version Management

Ensure correct Node.js version before any package manager operation.

## Workflow

Execute these steps in order BEFORE any npm/npx/pnpm/yarn command:

1. **Detect version manager**: Check which tool is available and configured
2. **Detect required version**: Find version specification in project files
3. **Get current version**: `node --version`
4. **Compare**: If major versions match, skip to step 6
5. **Switch version**: Use appropriate version manager
6. **Verify**: Confirm correct version is active
7. **Execute task**

## Step 1: Detect version manager

Check for version manager configuration files and availability:

Check which version manager is available:

```bash
command -v asdf >/dev/null 2>&1 && echo "asdf"
command -v nvm >/dev/null 2>&1 && echo "nvm"
```

**Priority**: If both available, prefer asdf when `.tool-versions` exists, otherwise use nvm.

If neither tool is available, note this and continue to detect required version — you may still proceed if versions already match.

## Step 2: Detect required version

Search for version specification in this priority order:

```bash
# 1. Check .tool-versions (asdf format: "nodejs 20.10.0")
grep "^nodejs" .tool-versions 2>/dev/null | awk '{print $2}'

# 2. Check .nvmrc
cat .nvmrc 2>/dev/null

# 3. Check .node-version
cat .node-version 2>/dev/null

# 4. Extract from package.json engines
grep -A5 '"engines"' package.json 2>/dev/null | grep '"node"' | sed 's/.*"node".*"\([^"]*\)".*/\1/'
```

If no version specification found, check documentation files:

- `AGENTS.md`
- `README.md`
- `DEVELOPMENT.md`
- `CONTRIBUTING.md`

Look for patterns like:

- "Node.js 20", "Node 20.x" or "Node 20"
- "requires Node v20"
- "node >= 20"

## Step 3-4: Compare versions

```bash
CURRENT=$(node --version 2>/dev/null | sed 's/v//')
CURRENT_MAJOR=$(echo "$CURRENT" | cut -d. -f1)
# Compare CURRENT_MAJOR with required major version
```

If major versions match, proceed directly to task execution.

## Step 5: Switch version (conditional)

**Skip this step if:**

- Major versions already match (from Step 4)
- No version manager available (from Step 1)

If no version manager is available and versions don't match, stop and report to user (see "When version manager unavailable" below).

### Using asdf

```bash
# 1. Check if nodejs plugin is installed
asdf plugin list | grep -q nodejs || asdf plugin add nodejs

# 2. Check installed versions
asdf list nodejs

# 3. Install required version (if not installed)
asdf install nodejs

# 4. Activate version
# If .tool-versions exists:
asdf install
# Otherwise set for current directory:
asdf set nodejs
```

**asdf version formats:**

- Exact: `20.10.0`
- Latest in series: `latest:20`
- System: `system`

### Using nvm

```bash
# 1. Check installed versions
nvm ls

# 2. Install required version (if not installed)
nvm install

# 3. Activate version
# If .nvmrc exists:
nvm use
# Otherwise:
nvm use
```

## Step 6: Verify (after switching)

If you switched versions in Step 5, verify the change:

```bash
node --version
# Must show expected version before proceeding
```

If versions already matched in Step 4, skip verification.

## Troubleshooting

| Symptom                       | Cause                      | Solution                                                  |
| ----------------------------- | -------------------------- | --------------------------------------------------------- |
| `nvm: command not found`      | nvm not available          | Ensure nvm is installed and shell is configured           |
| `asdf: command not found`     | asdf not available         | Ensure asdf is installed and shell is configured          |
| `No preset version installed` | asdf nodejs plugin missing | Run: `asdf plugin add nodejs`                             |
| `N/A: version not installed`  | nvm version missing        | Run: `nvm install <version>`                              |
| `No .nvmrc file found`        | nvm use without config     | Specify version: `nvm use <version>`                      |
| `No version is set` (asdf)    | .tool-versions missing     | Run: `asdf set nodejs <version>` or create .tool-versions |

## When version manager unavailable

If neither nvm nor asdf is available AND versions don't match:

**DO NOT proceed with npm commands.**

Report to user:

```markdown
⚠️ BLOCKED: Node.js version mismatch

Current version: v16.20.0
Required version: v20.x (from .tool-versions)

No supported version manager (nvm or asdf) detected.

To proceed:

1. Install nvm: https://github.com/nvm-sh/nvm
   Or install asdf: https://asdf-vm.com/guide/getting-started.html
2. Install and activate the required Node.js version
3. Retry your command
```

## Constraints

- **NEVER skip verification**: Always confirm version after switching
- **NEVER proceed with wrong version**: Incorrect Node.js version causes cryptic errors
- **Respect project config**: Use .tool-versions with asdf, .nvmrc with nvm
