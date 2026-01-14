# Node Environment Commands Reference

Detailed commands for Node.js version detection and switching.

## Version specification detection

Check for Node.js version requirements in priority order:

```bash
# 1. Check .nvmrc (nvm standard)
cat .nvmrc 2>/dev/null

# 2. Check package.json engines field
cat package.json | grep -A 3 '"engines"' 2>/dev/null
```

## Current version check

```bash
node -v
```

## nvm detection and switching

Most common on macOS and Linux.

```bash
# Check availability
command -v nvm >/dev/null 2>&1 && echo "nvm available"

# Switch to project version
nvm use

# Install if missing
nvm install
```

**Terminal context note:** In VS Code integrated terminal, nvm is usually pre-loaded. Do NOT chain shell initialization:

```bash
# ❌ DON'T
source ~/.nvm/nvm.sh && nvm use

# ✅ DO
nvm use
```

If `nvm: command not found`, inform user to open new terminal or run:

```bash
source ~/.nvm/nvm.sh
```

## Version comparison

Extract major version for comparison:

```bash
# Get required version (strip 'v' prefix if present)
REQUIRED=$(cat .nvmrc | tr -d 'v' | cut -d. -f1)

# Get current version
CURRENT=$(node -v | tr -d 'v' | cut -d. -f1)

# Compare
if [ "$REQUIRED" = "$CURRENT" ]; then
  echo "Version match"
else
  echo "Version mismatch: required $REQUIRED, current $CURRENT"
fi
```

## Troubleshooting

| Issue                        | Cause                       | Solution                                        |
| ---------------------------- | --------------------------- | ----------------------------------------------- |
| `nvm: command not found`     | Shell not initialized       | Run `source ~/.nvm/nvm.sh` or open new terminal |
| `N/A: version not installed` | Required version missing    | Run `nvm install`                               |
| `No .nvmrc file found`       | Project has no version spec | Use current version, no action needed           |
| Permission denied            | npm cache issue             | Run `npm cache clean --force`                   |
