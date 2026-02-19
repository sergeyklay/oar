---
name: pr-naming
description: Generates standardized pull request titles following project conventions for GitHub PRs. Use when asked to create a PR title, or when PR title generation is part of a larger PR creation workflow. For the actual PR creation workflow, use the pull-request skill.
---

# Pull request title format

Follow these conventions when creating pull request titles.

## Rules

- Use Conventional Commit format: `<type>[optional scope]: <description>`
- Types: feat, fix, refactor, docs, test, chore, style, perf, ci
- Scope is optional - when used, it must be a noun describing a section of the codebase in parentheses
- Keep under 72 characters including type and scope
- Be specific and descriptive
- Use imperative mood (e.g., 'add' not 'added')
- No period at the end
- Respond with ONLY the title, no explanations or markdown formatting

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

Write PR titles in English regardless of conversation language.
