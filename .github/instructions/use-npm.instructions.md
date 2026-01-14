---
description: Use npm as the package manager for all operations
applyTo: '**/package.json,**/package-lock.json'
---

# Package Manager

**Always use `npm` as the package manager.** Never use bun, yarn, or pnpm.

## Common Commands

```bash
# Install dependencies
npm ci                            # Install from lock file (CI/reproducible builds)
npm install <package>             # Add a new dependency
npm install -D <package>          # Add a development dependency
npm remove <package>              # Remove a package

# Run scripts
npm run <script>                  # Run package.json scripts

# Execute binaries
npx <command>                     # Execute package binaries
```

## Rules

- Use `npm ci` for reproducible installs (CI, Docker, fresh clones)
- Use `npm install` when adding/updating packages
- Never use `yarn`, `pnpm`, or `bun` commands
- Always commit `package-lock.json` changes
