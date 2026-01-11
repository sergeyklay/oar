# Conventional Commits Reference

This reference provides guidance on writing commit messages following the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/).

## Conventional Commits Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Required Elements

- **Type**: Must be present (e.g., `feat`, `fix`, `docs`)
- **Colon and space**: Must follow type/scope
- **Description**: Short summary of changes

### Optional Elements

- **Scope**: Provides additional context (e.g., `feat(api):`)
- **Body**: Detailed explanation, separated by blank line
- **Footer**: Metadata like `BREAKING CHANGE:` or issue references

## Commit Types

| Type       | Description                                      |
| ---------- | ------------------------------------------------ |
| `feat`     | New feature                                      |
| `fix`      | Bug fix                                          |
| `docs`     | Documentation changes                            |
| `style`    | Code style changes (formatting, no logic change) |
| `refactor` | Code restructuring (no behavior change)          |
| `test`     | Adding or updating tests                         |
| `chore`    | Maintenance tasks, dependencies                  |
| `perf`     | Performance improvements                         |
| `ci`       | CI/CD changes                                    |
| `build`    | Build system changes                             |
| `revert`   | Revert previous commit                           |

## Breaking Changes

Breaking changes MUST be indicated by:

1. **Exclamation mark** before the colon:

   ```
   feat!: remove deprecated API endpoints
   fix(api)!: change response format
   ```

2. **Footer** with `BREAKING CHANGE:` (uppercase):

   ```
   feat: add new authentication flow

   BREAKING CHANGE: previous auth tokens are no longer valid
   ```

## Format Rules

- **Type**: lowercase (`fix:`, `feat:`, `chore:`)
- **Scope**: lowercase in parentheses (`(api)`, `(deps)`)
- **Description**: immediately follows colon and space
- **No period**: at end of description
- **Imperative mood**: use "add" not "added" or "adds"

## Best Practices

### Description Quality

✅ **Good descriptions:**

- `fix: prevent race condition in request handler`
- `feat(auth): add OAuth2 support`
- `docs: clarify installation steps`

❌ **Poor descriptions:**

- `fix: fixed bug` (vague)
- `feat: added stuff` (unclear)
- `update` (missing type)

### Character Limits

- **50 characters**: ideal for subject line
- **72 characters**: maximum for subject line
- **Wrap body**: at 72 characters per line

## Common Anti-Patterns

| Anti-Pattern        | Why Wrong                      | Correct                                           |
| ------------------- | ------------------------------ | ------------------------------------------------- |
| Past tense          | Doesn't follow imperative mood | `fix: add validation` not `fix: added validation` |
| Present continuous  | Doesn't follow imperative mood | `fix: add support` not `fix: adding support`      |
| Trailing period     | Against spec conventions       | `fix: add validation` not `fix: add validation.`  |
| Emoji in subject    | Not part of specification      | `feat: add feature` not `✨ feat: add feature`    |
| Missing type prefix | Required by specification      | `feat: add feature` not `add feature`             |
| Vague descriptions  | Lacks useful information       | `fix: prevent race condition` not `fix: fix bug`  |
| Exceeding 72 chars  | Readability issues             | Keep subject line under 72 characters             |
