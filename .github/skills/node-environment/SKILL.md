---
name: node-environment
description: Ensures correct Node.js version before npm operations. Use BEFORE running any npm or npx commands. Reads .tool-versions, compares with active Node.js version, and switches via asdf if needed.
---

# Node.js version management

Ensure the correct Node.js version is active before any npm operation. This project pins Node.js 24 via `.tool-versions` and manages it with asdf.

## Workflow

Execute these steps before any `npm` or `npx` command:

1. **Read required version** from `.tool-versions`
2. **Compare** with the active Node.js version
3. **Switch** via asdf if versions do not match (skip if they match)
4. **Verify** the switch succeeded
5. **Proceed** with the original task

## Step 1: Read required version

The single source of truth is `.tool-versions` in the project root:

```bash
grep "^nodejs" .tool-versions | awk '{print $2}'
# Expected output: 24.13.0
```

Do not check `.nvmrc`, `.node-version`, or `package.json` engines. This project uses none of those. If `.tool-versions` is missing or has no `nodejs` entry, stop and report to the user.

## Step 2: Compare versions

```bash
REQUIRED=$(grep "^nodejs" .tool-versions | awk '{print $2}')
CURRENT=$(node --version 2>/dev/null | sed 's/v//')
REQUIRED_MAJOR=$(echo "$REQUIRED" | cut -d. -f1)
CURRENT_MAJOR=$(echo "$CURRENT" | cut -d. -f1)
```

If `CURRENT_MAJOR` equals `REQUIRED_MAJOR`, skip Steps 3-4 and proceed with the task.

## Step 3: Switch version

```bash
# Ensure nodejs plugin is installed
asdf plugin list | grep -q nodejs || asdf plugin add nodejs

# Install the pinned version (no-op if already installed)
asdf install nodejs

# Activate it (reads .tool-versions automatically)
asdf install
```

If asdf is not available and versions do not match, stop and report:

```
BLOCKED: Node.js version mismatch

Current version:  v<CURRENT>
Required version: v<REQUIRED> (from .tool-versions)

This project uses asdf for version management.
Install asdf: https://asdf-vm.com/guide/getting-started.html

Then run:
  asdf plugin add nodejs
  asdf install
```

## Step 4: Verify

```bash
node --version
# Must show v24.x.x before proceeding
```

If the version is still wrong after switching, do not proceed. Report the failure to the user.

## Troubleshooting

| Symptom | Cause | Solution |
|---|---|---|
| `asdf: command not found` | asdf not installed | Install asdf and configure shell |
| `No preset version installed` | nodejs plugin missing | `asdf plugin add nodejs` |
| `No version is set` | `.tool-versions` missing | Create file with `nodejs 24.13.0` or copy from repository |
| Version mismatch after `asdf install` | Shell not reloaded | Run `asdf reshim nodejs` |

## Constraints

- NEVER use `nvm`. This project uses asdf with `.tool-versions`.
- NEVER use `yarn`, `pnpm`, or `bun`. npm is the only package manager. See `npm-environment.instructions.md` for the full command reference.
- NEVER proceed with npm commands when the Node.js major version does not match. Wrong versions cause cryptic dependency resolution and native addon build failures.
- NEVER modify `.tool-versions` without also updating `Dockerfile` (`node:24-slim`) and `.github/workflows/ci.yml` (`node-version: 24.x`). All three locations must stay in sync.
