---
name: pull-request
description: Execute Pull Request creation workflow including authentication, branch verification, change analysis, and gh CLI operations. Use when asked to create a PR, open a pull request, submit changes for review, or after completing work where PR creation is logical. For PR title and description FORMAT rules, use the pull-request-descriptions instructions.
---

# Pull request

## Workflow

### Step 1: Verify GitHub CLI authentication

Before any GitHub operation, verify authentication status:

```bash
gh auth status
```

**If authentication fails:**

1. Inform the user: "GitHub CLI authentication is missing or expired."
2. Provide the command to re-authenticate:
   ```bash
   gh auth login --web
   ```
3. Wait for the user to complete authentication before proceeding.

### Step 2: Verify branch state

Never create a PR from a protected branch - it bypasses review and merges directly into shared history.

```bash
# Get current branch
git branch --show-current

# Get the repository's default branch
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
```

**Protected branches (cannot be PR source):**

- The default branch (usually `main` or `master`)
- `develop` or `development`
- Any branch matching `release/*` or `hotfix/*` patterns

If on protected branch, inform user and switch to or create a feature branch first.

**Branch state verification:**

```bash
# Verify commits ahead of base
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
git log --oneline "${DEFAULT_BRANCH}..HEAD"

# Check for uncommitted changes
git status --short

# Push branch if needed
git push -u origin $(git branch --show-current)
```

**Pre-PR checklist:**

- [ ] Current branch is NOT a protected branch
- [ ] Branch has commits ahead of base branch
- [ ] No uncommitted changes (commit or stash first)
- [ ] Branch is pushed to remote

### Step 3: Analyze changes for PR description

Gather context for the PR description:

```bash
# Get default branch name
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')

# Get all commits in this PR
git log --format="%s%n%b" $DEFAULT_BRANCH..HEAD

# Get list of changed files
git diff --name-only $DEFAULT_BRANCH..HEAD

# Get diff stats
git diff --stat $DEFAULT_BRANCH..HEAD
```

**Analyze for:**

| Element              | Source                                                 |
| -------------------- | ------------------------------------------------------ |
| **Type**             | Primary commit type (feat, fix, refactor, chore, perf) |
| **Intent**           | Business/technical goal from commit messages           |
| **Entry Point**      | Most critical or complex changed file                  |
| **Sensitive Areas**  | Files requiring extra scrutiny (auth, payments, data)  |
| **Breaking Changes** | Look for `!` in commits or BREAKING CHANGE footer      |
| **Migrations**       | Database or schema changes                             |

### Step 4: Create the pull request

```bash
# Get default branch for base
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')

gh pr create \
  --title "<type>: <description>" \
  --body '<generated description>' \
  --base "$DEFAULT_BRANCH"
```

**For draft PRs:**

```bash
gh pr create \
  --title "<type>: <description>" \
  --body '<generated description>' \
  --base "$DEFAULT_BRANCH" \
  --draft
```

Follow the PR Description Convention.

Use single quotes for `--body` to avoid shell interpolation issues.

### Step 5: Confirm success

After creating, verify and report:

```bash
# Get PR URL
gh pr view
```

Report to the user:

- PR number and URL
- Title
- Base and head branches

## Error handling

| Error                         | Cause                     | Resolution                            |
| ----------------------------- | ------------------------- | ------------------------------------- |
| "pull request already exists" | PR open for this branch   | Use `gh pr view` to see existing PR   |
| "no commits between"          | Branch same as base       | Verify commits exist on branch        |
| "repository not found"        | Wrong remote or no access | Check `git remote -v` and permissions |
