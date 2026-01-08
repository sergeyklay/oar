---
name: pull-request
description: Create Pull Requests with well-structured descriptions following project conventions. Use this skill when (1) the user asks to create a PR, open a pull request, or submit changes for review, (2) after completing a feature or fix where PR creation is the logical next step, (3) when the agent autonomously decides to submit work for review. Uses the project PR template and gh CLI for operations.
---

# Pull Request Skill

Create Pull Requests with structured descriptions that follow the project template and conventions.

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

#### Detect Protected Branch

```bash
# Get the repository's default branch
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'

# Get current branch
git branch --show-current
```

**Protected branches (cannot be PR source):**
- The default branch (usually `main` or `master`)
- `develop` or `development`
- Any branch matching `release/*` or `hotfix/*` patterns

#### If on Protected Branch

1. **STOP** - do not create PR from this branch
2. Inform the user: "You are on the protected branch `<branch>`. PRs must be created from feature branches."
3. Ask the user to switch to or create a feature branch first
4. Suggest using the `git-commit` skill to create an appropriate branch

#### Branch State Verification

```bash
# Verify commits ahead of base
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
git log --oneline "${DEFAULT_BRANCH}..HEAD"

# Check for uncommitted changes
git status --short
```

**Pre-PR checklist:**

- ✅ Current branch is NOT a protected branch
- ✅ Branch has commits ahead of base branch
- ✅ No uncommitted changes (commit or stash first)
- ✅ Branch is pushed to remote

```bash
# Push branch if needed
git push -u origin $(git branch --show-current)
```

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

| Element | Source |
|---------|--------|
| **Type** | Primary commit type (feat, fix, refactor, chore, perf) |
| **Intent** | Business/technical goal from commit messages |
| **Entry Point** | Most critical or complex changed file |
| **Sensitive Areas** | Files requiring extra scrutiny (auth, payments, data) |
| **Breaking Changes** | Look for `!` in commits or BREAKING CHANGE footer |
| **Migrations** | Database or schema changes |

### Step 4: Generate PR Title

PR title should follow Conventional Commits format:

```
<type>[optional scope]: <description>
```

**Examples:**

- `feat: add bill reminder notifications`
- `fix(api): handle null user in auth middleware`
- `refactor: extract validation logic to service`
- `chore(deps): bump dependencies`

### Step 5: Generate PR Description

Use the project template structure. See [PR Template](../../../pull_request_template.md).

#### Required Sections

```markdown
### 🎯 Scope & Context

**Type:** [Feat | Fix | Refactor | Chore | Perf]

**Intent:** [1-2 sentences explaining the business or technical goal]

**Related Issues:** [#123, etc. - omit if none]

### 🧭 Reviewer Guide

**Complexity:** [Low | Medium | High]

#### Entry Point

[Most critical file to start review + explanation]

#### Sensitive Areas

- `path/to/file`: [Why it needs scrutiny]

### ⚠️ Risk Assessment

- **Breaking Changes:** [Yes + details | No breaking changes]
- **Migrations/State:** [Required steps | No migrations or state changes]
```

#### Description Guidelines

- **NO EMOJIS** except section headers (🎯, 🧭, ⚠️)
- **NO FLUFF** - avoid "This PR updates..."
- **BE SPECIFIC** - reference actual files and changes
- **USE DASHES** - single hyphen with spaces: `- item`
- **WRAP FILENAMES** in backticks: `` `lib/services/BillService.ts` ``

### Step 6: Create the Pull Request

```bash
# Get default branch for base
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')

gh pr create \
  --title "<type>: <description>" \
  --body "<generated description>" \
  --base "$DEFAULT_BRANCH"
```

**For draft PRs:**

```bash
gh pr create \
  --title "<type>: <description>" \
  --body "<generated description>" \
  --base "$DEFAULT_BRANCH" \
  --draft
```

### Step 7: Confirm Success

After creating, verify and report:

```bash
# Get PR URL
gh pr view --web
```

Report to the user:
- PR number and URL
- Title
- Base and head branches

## Complexity Assessment

| Complexity | Criteria |
|------------|----------|
| **Low** | Single file or config changes, documentation, simple fixes |
| **Medium** | Multiple related files, new features with tests, refactoring |
| **High** | Cross-cutting changes, database migrations, breaking changes, security-sensitive |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| "pull request already exists" | PR open for this branch | Use `gh pr view` to see existing PR |
| "no commits between" | Branch same as base | Verify commits exist on branch |
| "repository not found" | Wrong remote or no access | Check `git remote -v` and permissions |

## Language

ALWAYS generate PR titles and descriptions in **English** regardless of the language used in conversation.
