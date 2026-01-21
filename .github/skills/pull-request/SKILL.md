---
name: pull-request
description: Execute Pull Request creation workflow including authentication, branch verification, change analysis, and gh CLI operations. Use when asked to create a PR, open a pull request, submit changes for review, or after completing work where PR creation is logical. This skill handles the HOW of creating PRs (workflow steps, commands, verification). For PR title and description FORMAT rules, use the appropriate skill.
---

# Pull Request Skill

Execute Pull Request creation following a structured workflow that ensures authentication, branch safety, and proper change analysis.

## Workflow

### Step 1: Verify GitHub CLI Authentication

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

### Step 2: Verify Branch State

**CRITICAL:** Never create a PR from a protected branch.

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

### Step 3: Analyze Changes for PR Description

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

### Step 4: Create the Pull Request

```bash
# Get default branch for base
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')

# Do NOT use double quotes for --body
gh pr create \
  --title "<type>: <description>" \
  --body '<generated description>' \
  --base "$DEFAULT_BRANCH"
```

**For draft PRs:**

```bash
# Do NOT use double quotes for --body
gh pr create \
  --title "<type>: <description>" \
  --body '<generated description>' \
  --base "$DEFAULT_BRANCH" \
  --draft
```

Follow the PR Description Convention.

**IMPORTANT:** Do NOT use double quotes for `--body` to avoid shell interpolation issues.

### Step 5: Confirm Success

After creating, verify and report:

```bash
# Get PR URL
gh pr view
```

Report to the user:

- PR number and URL
- Title
- Base and head branches

## Error Handling

| Error                         | Cause                     | Resolution                            |
| ----------------------------- | ------------------------- | ------------------------------------- |
| "pull request already exists" | PR open for this branch   | Use `gh pr view` to see existing PR   |
| "no commits between"          | Branch same as base       | Verify commits exist on branch        |
| "repository not found"        | Wrong remote or no access | Check `git remote -v` and permissions |
