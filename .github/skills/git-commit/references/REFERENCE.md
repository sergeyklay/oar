# GitHub CLI authentication reference

Quick reference for `gh` CLI authentication commands used in the git-commit workflow.

## Authentication commands

### Check authentication status

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

### Login (interactive web flow)

```bash
gh auth login --web
```

Opens browser for OAuth authentication. Recommended for interactive sessions.

### Login with token

```bash
gh auth login --with-token < token.txt
```

For headless environments or automation.

### Refresh expired token

```bash
gh auth refresh
```

Refreshes the authentication token without full re-login.

### Logout

```bash
gh auth logout
```

Removes stored credentials.

## Git commands via gh

The `gh` CLI configures Git to use GitHub authentication automatically when using SSH or HTTPS protocols.

After authentication, standard Git commands work seamlessly:

```bash
git add <files>
git commit -m "<message>"
git push
git pull
```

## Error handling patterns

### Authentication required

**Symptom:** Commands fail with authentication errors
**Check:** `gh auth status`
**Fix:** `gh auth login --web`

### Token expired

**Symptom:** Commands fail with "token expired" message
**Check:** `gh auth status` shows expired token
**Fix:** `gh auth refresh`

### Wrong account

**Symptom:** Operations fail with permission errors
**Check:** `gh auth status` shows wrong account
**Fix:**

```bash
gh auth logout
gh auth login --web
```

### Multiple accounts

**List accounts:**

```bash
gh auth status
```

**Switch active account:**

```bash
gh auth switch
```

## Exit codes

| Code | Meaning                      |
| ---- | ---------------------------- |
| 0    | Success                      |
| 1    | General error (check stderr) |
| 4    | Authentication required      |

## Environment variables

| Variable   | Purpose                            |
| ---------- | ---------------------------------- |
| `GH_TOKEN` | Override authentication token      |
| `GH_HOST`  | Override default host (github.com) |
| `GH_REPO`  | Override repository detection      |
| `NO_COLOR` | Disable colored output             |
