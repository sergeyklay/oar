---
name: git-commit
description: Create Git commits with well-crafted messages following Conventional Commits specification. Use this skill when (1) the user asks to commit, save, or persist changes to Git, (2) after completing a task where committing is the logical next step, (3) when code changes are ready to be recorded, or (4) when the agent autonomously decides to checkpoint work. Analyzes project commit history to match the established writing style and uses the gh CLI for Git operations.
---

# Git Commit Skill

Create Git commits using Conventional Commits format with descriptions that match the project's established writing style.

## Workflow

### Step 1: Verify GitHub CLI Authentication

Before any Git operation, verify authentication status:

```bash
gh auth status
```

**If authentication fails** (exit code non-zero or error message contains "not logged in"):

1. Inform the user: "GitHub CLI authentication is missing or expired."
2. Provide the command to re-authenticate:
   ```bash
   gh auth login --web
   ```
3. Wait for the user to complete authentication before proceeding.

**Common authentication error patterns:**
- "You are not logged in"
- "authentication required"
- "token has expired"
- "invalid token"
- Exit code 1 with stderr output

### Step 2: Verify Branch Safety

**CRITICAL:** Never commit directly to protected branches.

#### Detect Protected Branch

```bash
# Get the repository's default branch
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'

# Get current branch
git branch --show-current
```

Protected branches include:
- The default branch (usually `main` or `master`)
- `develop` or `development`
- Any branch matching `release/*` or `hotfix/*` patterns

#### If on Protected Branch

1. **STOP** - do not commit directly
2. Inform the user: "You are on the protected branch `<branch>`. Creating a feature branch."
3. Create an appropriately named feature branch:

```bash
git checkout -b <type>/<short-description>
```

#### Branch Naming Convention

Format: `<type>/<kebab-case-description>`

| Type | Use Case | Example |
|------|----------|---------|
| `feat` | New feature | `feat/bill-reminders` |
| `fix` | Bug fix | `fix/null-amount-validation` |
| `refactor` | Code restructuring | `refactor/extract-payment-service` |
| `chore` | Maintenance tasks | `chore/update-dependencies` |
| `docs` | Documentation | `docs/api-reference` |
| `test` | Test additions | `test/payment-service-coverage` |

**Rules:**
- Use kebab-case (lowercase with hyphens)
- Keep it short (2-4 words max)
- Make it descriptive of the change intent
- ALWAYS in English

### Step 3: Analyze Project Writing Style

Analyze recent commits to understand the project's **writing style** for description content:

```bash
git log --format="%s" -30
```

**Writing style characteristics to identify:**

| Characteristic | What to Look For |
|---------------|------------------|
| **Vocabulary** | Which verbs are commonly used? (add, implement, introduce, etc.) |
| **Detail level** | Brief ("fix bug") vs descriptive ("fix null pointer in auth flow") |
| **Scope patterns** | Common scopes: `(deps)`, `(api)`, `(ui)`, or no scope |
| **Specificity** | Generic vs domain-specific terminology |

**Important:** The Conventional Commits format is fixed. Only adapt the vocabulary and phrasing style to match project conventions.

### Step 4: Identify Files to Commit

**Atomic commits principle:** Each commit should represent ONE logical change. Do not bundle unrelated changes into a single commit.

```bash
# Show current status
git status --short

# Show detailed diff for unstaged changes
git diff

# Show detailed diff for staged changes
git diff --cached
```

**Grouping strategy:**

1. **Analyze all pending changes** and identify logical groups
2. **Group by purpose:** Files that serve the same change belong together
3. **Separate unrelated changes:** Different features, fixes, or docs = separate commits
4. **Ask user if ambiguous:** When grouping is unclear, ask for clarification

**Examples of logical grouping:**

| Changes | Commits |
|---------|---------|
| New service + its unit tests | 1 commit: `feat: add PaymentService` |
| New feature + unrelated config change | 2 commits: feature first, then config |
| Bug fix in component + related test fix | 1 commit: `fix: handle null in BillForm` |
| Refactor + unrelated documentation update | 2 commits: refactor first, then docs |
| Multiple files for one feature (action, service, component) | 1 commit: all related files together |

**Staging rules:**

| User says | Action |
|-----------|--------|
| "commit all changes" | Group into logical atomic commits, create multiple if needed |
| "commit these files" + list | `git add <file1> <file2>...` |
| "commit staged files" | Use already staged files |
| "commit <specific file>" | `git add <file>` |
| Ambiguous | Ask user to clarify which files and grouping |

### Step 5: Generate Commit Message

**Always use Conventional Commits format.** Apply the analyzed writing style to the description.

#### Message Structure (Required)

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Allowed types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code restructuring without behavior change
- `test` - Adding or fixing tests
- `chore` - Maintenance, dependencies, build changes
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Reverting previous commit

#### Description Guidelines

- Use imperative mood: "Add", "Fix", "Update", "Remove", "Improve", "Refactor"
- Keep under 72 characters
- Do not end with a period
- Be specific about what changed
- Avoid vague words: "various", "some", "minor"

#### Examples Based on Change Type

| Change | Good Message | Bad Message |
|--------|--------------|-------------|
| New API endpoint | `feat(api): add user preferences endpoint` | `Added new stuff` |
| Fix null reference | `fix: handle null user in auth middleware` | `Fixed bug` |
| Update README | `docs: clarify installation steps for Docker` | `Update README` |
| Rename variable | `refactor: rename userId to accountId for clarity` | `Refactoring` |
| Upgrade dependency | `chore(deps): bump zod from 4.3.4 to 4.3.5` | `Updated packages` |
| Add unit test | `test: add coverage for PaymentService edge cases` | `Tests` |

### Step 6: Execute the Commit

Stage files and create commit:

```bash
# Stage specific files
git add <files>

# Create commit with message
git commit -m "<message>"
```

**For multi-line messages:**

```bash
git commit -m "<subject>" -m "<body paragraph 1>" -m "<body paragraph 2>"
```

### Step 7: Confirm Success

After committing, verify and report:

```bash
# Show the created commit
git log --oneline -1

# Show commit details
git show --stat HEAD
```

Report to the user:
- Commit hash (short form)
- Files changed count
- Insertions/deletions summary

## Error Handling

### Git Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| "nothing to commit" | No staged changes | Verify files exist and have changes |
| "pathspec did not match" | File path incorrect | Check file path spelling |
| "not a git repository" | Not in repo directory | Navigate to correct directory |

### Authentication Errors

If any `gh` command fails with authentication error:

1. Run `gh auth status` to diagnose
2. If token expired: `gh auth refresh`
3. If no token: `gh auth login --web`
4. Report the issue clearly to the user

## Conventional Commits Format (Required)

Always follow the Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Format rules:**
- Description MUST immediately follow the colon and space
- Description is a short summary of code changes
- Body MAY provide additional context, MUST begin one blank line after description
- Breaking changes: use `!` before `:` (e.g., `feat!: remove deprecated API`)
- Footer `BREAKING CHANGE:` MUST be uppercase

**Common scopes in this project:**
- `(deps)` - dependency updates
- `(deps-dev)` - dev dependency updates
- No scope - most other changes

**When in doubt:** Run `git log --oneline -20` to see recent writing styles

## Language

ALWAYS generate commit messages in **English** regardless of the language used in conversation.
