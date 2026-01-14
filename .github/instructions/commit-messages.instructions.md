---
description: Commit message formatting rules following Conventional Commits specification
applyTo: '**'
---

# Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for all commit messages.

## Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Use Case                                 |
| ---------- | ---------------------------------------- |
| `feat`     | New feature                              |
| `fix`      | Bug fix                                  |
| `docs`     | Documentation changes                    |
| `style`    | Formatting, no logic change              |
| `refactor` | Code restructuring, no behavior change   |
| `test`     | Adding or updating tests                 |
| `chore`    | Maintenance, dependencies, build changes |
| `perf`     | Performance improvements                 |
| `ci`       | CI/CD changes                            |
| `build`    | Build system changes                     |
| `revert`   | Reverting previous commit                |

## Description Rules

- Use imperative mood: "Add", "Fix", "Update", "Remove"
- Keep under 72 characters
- No period at end
- Be specific about what changed
- Avoid vague words: "various", "some", "minor", "stuff"

## Breaking Changes

Indicate breaking changes with:

1. Exclamation mark before colon: `feat!: remove deprecated API`
2. Footer: `BREAKING CHANGE: previous tokens are no longer valid`

## Common Scopes (This Project)

- `(deps)` - dependency updates
- `(deps-dev)` - dev dependency updates
- No scope - most other changes

## Examples

| Change             | Good                                               | Bad                |
| ------------------ | -------------------------------------------------- | ------------------ |
| New API endpoint   | `feat(api): add user preferences endpoint`         | `Added new stuff`  |
| Fix null reference | `fix: handle null user in auth middleware`         | `Fixed bug`        |
| Update README      | `docs: clarify installation steps for Docker`      | `Update README`    |
| Rename variable    | `refactor: rename userId to accountId for clarity` | `Refactoring`      |
| Upgrade dependency | `chore(deps): bump zod from 4.3.4 to 4.3.5`        | `Updated packages` |
| Add unit test      | `test: add coverage for PaymentService edge cases` | `Tests`            |

## Anti-Patterns

| Pattern             | Problem                | Correct Form                 |
| ------------------- | ---------------------- | ---------------------------- |
| `fix: added...`     | Past tense             | `fix: add...`                |
| `fix: adding...`    | Present continuous     | `fix: add...`                |
| `fix: add feature.` | Trailing period        | `fix: add feature`           |
| `add feature`       | Missing type           | `feat: add feature`          |
| `fix: fix bug`      | Vague                  | `fix: handle null in X`      |
| 80+ char subject    | Too long               | Keep under 72 chars          |
| `✨ feat: add`      | Emoji in subject       | `feat: add`                  |

## Multi-line Messages

```bash
git commit -m "feat: add payment validation" -m "Validates amount is positive and currency is supported." -m "Closes #123"
```

## Language

ALWAYS write commit messages in **English** regardless of conversation language.
