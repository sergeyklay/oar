---
name: git-commit
description: Execute Git commits with proper workflow including authentication, branch safety, atomic commits, and style analysis. Use when asked to commit, save, or persist changes to Git, after completing tasks where committing is logical, or when autonomously checkpointing work. This skill handles the HOW of committing (workflow steps, commands, branch management).
---

# Git Commit Skill

Execute Git commits following a structured workflow that ensures authentication, branch safety, atomic commits, and project style consistency.

## References

- [GitHub CLI Commands](references/REFERENCE.md) - Authentication and gh CLI usage

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

### Step 2: Identify Files to Commit

**Atomic commits principle:** Each commit should represent ONE logical change. Do not bundle unrelated changes into a single commit.

Analyze the current Git status to identify files to commit:

```bash
# Show current status
git status --short
```

Not all changed files should be committed.
Having a branch with multiple unrelated changes makes it hard to review, revert, or understand history.
Try to determine what the user intends to commit based on context and recent changes.
If unclear, ask the user for clarification on which files or changes to include in the commit.

```bash
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

| Changes                                                     | Commits                                  |
| ----------------------------------------------------------- | ---------------------------------------- |
| New service + its unit tests                                | 1 commit: `feat: add PaymentService`     |
| New feature + unrelated config change                       | 2 commits: feature first, then config    |
| Bug fix in component + related test fix                     | 1 commit: `fix: handle null in BillForm` |
| Refactor + unrelated documentation update                   | 2 commits: refactor first, then docs     |
| Multiple files for one feature (action, service, component) | 1 commit: all related files together     |

**Staging rules:**

| User says                   | Action                                                       |
| --------------------------- | ------------------------------------------------------------ |
| "commit all changes"        | Group into logical atomic commits, create multiple if needed |
| "commit these files" + list | `git add <file1> <file2>...`                                 |
| "commit staged files"       | Use already staged files                                     |
| "commit <specific file>"    | `git add <file>`                                             |
| Ambiguous                   | Ask user to clarify which files and grouping                 |

### Step 3: Verify Branch Safety

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
3. Create an appropriately named feature branch based on analysis from Step 2:

```bash
git checkout -b <type>/<short-description>
```

#### Branch Naming Convention

Format: `<type>/<kebab-case-description>`

| Type       | Use Case           | Example                            |
| ---------- | ------------------ | ---------------------------------- |
| `feat`     | New feature        | `feat/bill-reminders`              |
| `fix`      | Bug fix            | `fix/null-amount-validation`       |
| `refactor` | Code restructuring | `refactor/extract-payment-service` |
| `chore`    | Maintenance tasks  | `chore/update-dependencies`        |
| `docs`     | Documentation      | `docs/api-reference`               |
| `test`     | Test additions     | `test/payment-service-coverage`    |

**Rules:**

- Use kebab-case (lowercase with hyphens)
- Keep it short (2-4 words max)
- Make it descriptive of the change intent
- ALWAYS in English

### Step 4: Analyze Project Writing Style

Analyze recent commits to match the project's vocabulary and phrasing:

```bash
git log --format="%s" -30
```

You have to mimic the vocabulary, detail level, and phrasing style.

**Writing style characteristics to identify:**

| Characteristic     | What to Look For                                                   |
| ------------------ | ------------------------------------------------------------------ |
| **Vocabulary**     | Which verbs are commonly used? (add, implement, introduce, etc.)   |
| **Detail level**   | Brief ("fix bug") vs descriptive ("fix null pointer in auth flow") |
| **Scope patterns** | Common scopes: `(deps)`, `(api)`, `(ui)`, or no scope              |
| **Specificity**    | Generic vs domain-specific terminology                             |

**Important:** The Conventional Commits format is fixed. Only adapt the vocabulary and phrasing style to match project conventions.

**Identify:**

- Common verbs (add, implement, introduce, etc.)
- Detail level (brief vs descriptive)
- Scope usage patterns (`(deps)`, `(api)`, or none)
- Domain-specific terminology

Mimic the identified style while following Conventional Commits format.

### Step 5: Generate and Execute Commit

Stage files and create commit:

```bash
# Stage specific files
git add <files>

# Create commit with message
git commit -m "<message>"
```

For multi-line messages:

```bash
git commit -m "<subject>" -m "<body paragraph 1>" -m "<body paragraph 2>"
```

Follow the PR Description Structure from [Commit Message Format](../../instructions/commit-messages.instructions.md).

### Step 6: Confirm Success

Verify and report:

```bash
# Show the created commit
git log --oneline -1

# Show commit details
git show --stat HEAD
```

Report to user:

- Commit hash (short form)
- Files changed count
- Insertions/deletions summary

## Error Handling

### Git Errors

| Error                    | Cause                 | Resolution                          |
| ------------------------ | --------------------- | ----------------------------------- |
| "nothing to commit"      | No staged changes     | Verify files exist and have changes |
| "pathspec did not match" | File path incorrect   | Check file path spelling            |
| "not a git repository"   | Not in repo directory | Navigate to correct directory       |

### Authentication Errors

If any `gh` command fails with authentication error:

1. Run `gh auth status` to diagnose
2. If token expired: `gh auth refresh`
3. If no token: Report the issue clearly to the user and offer to run `gh auth login --web`
