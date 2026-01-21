---
name: pr-naming
description: Generates standardized pull request titles following project conventions for GitHub PRs. Use when asked to create a PR title, or when PR title generation is part of a larger PR creation workflow. This skill handles the FORMAT rules for PR titles. For the actual PR creation workflow, use appropriate skill.
---

# Pull Request Title Format

Follow these conventions when creating pull request titles.

## Rules

1. Use Conventional Commit format: `<type>[optional scope]: <description>`
2. Types: feat, fix, refactor, docs, test, chore, style, perf, ci
3. An optional scope MAY be provided to a commit's type.
4. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis
5. Keep under 72 characters including type and scope
6. Be specific and descriptive
7. Use imperative mood (e.g., 'add' not 'added')
8. No period at the end
9. Respond with ONLY the title, no explanations or markdown formatting

## Examples

**Good examples:**

- chore: cleanup workspace config and refactor agent names
- feat: implement PR title generation using Claude API
- feat(auth): add OAuth2 login support
- fix(api): resolve null pointer exception in user endpoint
- docs(readme): update installation instructions for clarity

**Bad examples:**

- Added OAuth2 login support. (not imperative, has period)
- Fix issue with user endpoint (not specific)
- Update docs (not descriptive)
- feat: implement PR title generation using Claude API to enhance automation and improve workflow efficiency in CI/CD processes (too long)

## Language

ALWAYS write PR titles in **English** regardless of conversation language.
