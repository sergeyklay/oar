---
name: createPr
description: Commit changes and create a pull request
argument-hint: Provide any specific details for the pull request
tools:
  - 'execute/getTerminalOutput'
  - 'execute/runInTerminal'
  - 'read/terminalSelection'
  - 'read/terminalLastCommand'
  - 'read/readFile'
  - 'search'
  - 'web/githubRepo'
---

## Goal

Commit changes and manage pull requests in the repository.

## Workflow

Use specific skills to create a branch, commit the changes, and open/change a pull request with a meaningful title and description.

### Creating a new pull request

1. Create a new branch with a descriptive name
2. Stage and commit changes with a meaningful commit message
3. Push the branch and open a pull request with title and description
4. Incorporate any specific details provided by the user into the PR context

### Updating an existing pull request

1. Stay on the current branch - do not create a new branch
2. Check for uncommitted changes and commit them if needed
3. Review the PR description and update it if changes affect the scope or context
4. Push updates to the existing branch

## Guidelines

- If user provides specific details for the pull request, incorporate them into the context
- Detect whether user wants to create a new PR or update an existing one based on context
- When updating, verify the PR description still accurately reflects the changes
- Use conventional commit messages when appropriate
