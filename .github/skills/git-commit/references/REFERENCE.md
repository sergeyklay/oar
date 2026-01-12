# GitHub CLI Reference

Quick reference for `gh` CLI commands used in Git commit workflows.

## Authentication Commands

### Check Authentication Status

```bash
gh auth status
```

**Success output:**

```plaintext
github.com
  ✓ Logged in to github.com account <username> (...)
  - Active account: true
  - Git operations protocol: ssh
  - Token: gho_****
  - Token scopes: 'admin:public_key', 'gist', 'read:org', 'repo'
```

**Failed output (examples):**

```
You are not logged in to any GitHub hosts.
```

### Login (Interactive Web Flow)

```bash
gh auth login --web
```

Opens browser for OAuth authentication. Recommended for interactive sessions.

### Login with Token

```bash
gh auth login --with-token < token.txt
```

For headless environments or automation.

### Refresh Expired Token

```bash
gh auth refresh
```

Refreshes the authentication token without full re-login.

### Logout

```bash
gh auth logout
```

Removes stored credentials.

## Git Commands via gh

The `gh` CLI configures Git to use GitHub authentication automatically when using SSH or HTTPS protocols.

After authentication, standard Git commands work seamlessly:

```bash
git add <files>
git commit -m "<message>"
git push
git pull
```

## Error Handling Patterns

### Authentication Required

**Symptom:** Commands fail with authentication errors
**Check:** `gh auth status`
**Fix:** `gh auth login --web`

### Token Expired

**Symptom:** Commands fail with "token expired" message
**Check:** `gh auth status` shows expired token
**Fix:** `gh auth refresh`

### Wrong Account

**Symptom:** Operations fail with permission errors
**Check:** `gh auth status` shows wrong account
**Fix:**

```bash
gh auth logout
gh auth login --web
```

### Multiple Accounts

**List accounts:**

```bash
gh auth status
```

**Switch active account:**

```bash
gh auth switch
```

## Common gh Commands for Development

### View Repository Info

```bash
gh repo view
```

### Create Pull Request

```bash
gh pr create --title "Title" --body "Description"
```

### List Open PRs

```bash
gh pr list
```

### View PR Status

```bash
gh pr status
```

### Getting Help

```bash
gh help
gh <command> --help
```

## Exit Codes

| Code | Meaning                      |
| ---- | ---------------------------- |
| 0    | Success                      |
| 1    | General error (check stderr) |
| 4    | Authentication required      |

## Environment Variables

| Variable   | Purpose                            |
| ---------- | ---------------------------------- |
| `GH_TOKEN` | Override authentication token      |
| `GH_HOST`  | Override default host (github.com) |
| `GH_REPO`  | Override repository detection      |
| `NO_COLOR` | Disable colored output             |

## Best Practices

1. **Always verify auth status** before Git operations in automated workflows
2. **Use `--web` for interactive login** - more secure than token input
3. **Check exit codes** in scripts to handle failures gracefully
4. **Prefer SSH protocol** for Git operations when possible
