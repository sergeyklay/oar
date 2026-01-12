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
# Get current branch
git branch --show-current

# Get the repository's default branch
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
```

**Protected branches (cannot be PR source):**

- The default branch (usually `main` or `master`)
- `develop` or `development`
- Any branch matching `release/*` or `hotfix/*` patterns

If current local branch is protected:

1. Inform the user: "You are on the protected branch `<branch>`. PRs must be created from feature branches."
2. Switch to or create a feature branch first

#### Branch State Verification

```bash
# Verify commits ahead of base
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
git log --oneline "${DEFAULT_BRANCH}..HEAD"

# Check for uncommitted changes
git status --short
```

**Pre-PR checklist:**

- [ ] Current branch is NOT a protected branch
- [ ] Branch has commits ahead of base branch
- [ ] No uncommitted changes (commit or stash first)
- [ ] Branch is pushed to remote

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

| Element              | Source                                                 |
| -------------------- | ------------------------------------------------------ |
| **Type**             | Primary commit type (feat, fix, refactor, chore, perf) |
| **Intent**           | Business/technical goal from commit messages           |
| **Entry Point**      | Most critical or complex changed file                  |
| **Sensitive Areas**  | Files requiring extra scrutiny (auth, payments, data)  |
| **Breaking Changes** | Look for `!` in commits or BREAKING CHANGE footer      |
| **Migrations**       | Database or schema changes                             |

### Step 4: Generate PR Title

PR title should follow Conventional Commits format:

```plaintext
<type>[optional scope]: <description>
```

**Examples:**

- `feat: add bill reminder notifications`
- `fix(api): handle null user in auth middleware`
- `refactor: extract validation logic to service`
- `chore(deps): bump dependencies`

### Step 5: Generate PR Description

Use the project template structure. See [PR Template](../../../pull_request_template.md).

#### Constraints

1. **NO EMOJIS:** Use professional Markdown formatting only. Emojis are allowed only for the section headers as shown in PR template.
2. **NO FLUFF:** Avoid generic intros like "This PR updates...".
3. **STATIC SECTIONS:** All 3 sections from template are required in the summary.
4. **DYNAMIC SUB-SECTIONS:** Only show sub-sections if relevant data exists.
5. **NO TOP-LEVEL HEADERS:** Start directly with the first section key.
6. **USING DASHES:** Use a single hyphen "-" and add spaces before and after the hyphen. Do not use "—" for dashes.
   - **FORBIDDEN:** Breaking Changes: No—all modifications are documentation and configuration updates with no functional impact to codebase or build process.
   - **ALLOWED:** Breaking Changes: No - all modifications are documentation and configuration updates with no functional impact to codebase or build process.
7. **FILENAMES:** Filenames should be wrapped in backticks: `lib/services/AutoPayService.ts`

#### Example

Use Pull Request example as a guide: [Example PR Description](references/pr-example.md)

### Step 6: Create the Pull Request

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

**IMPORTANT:** Do NOT use double quotes for `--body` to avoid shell interpolation issues.

### Step 7: Confirm Success

After creating, verify and report:

```bash
# Get PR URL
gh pr view
```

Report to the user:

- PR number and URL
- Title
- Base and head branches

## Complexity Assessment

| Complexity | Criteria                                                                         |
| ---------- | -------------------------------------------------------------------------------- |
| **Low**    | Single file or config changes, documentation, simple fixes                       |
| **Medium** | Multiple related files, new features with tests, refactoring                     |
| **High**   | Cross-cutting changes, database migrations, breaking changes, security-sensitive |

## Error Handling

| Error                         | Cause                     | Resolution                            |
| ----------------------------- | ------------------------- | ------------------------------------- |
| "pull request already exists" | PR open for this branch   | Use `gh pr view` to see existing PR   |
| "no commits between"          | Branch same as base       | Verify commits exist on branch        |
| "repository not found"        | Wrong remote or no access | Check `git remote -v` and permissions |

## Language

ALWAYS generate PR titles and descriptions in **English** regardless of the language used in conversation.
