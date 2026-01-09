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

## Task

- Use specific skills to create a branch, commit the changes, and open/change a pull request with a meaningful title and description.
- If user provides specific details for the pull request, incorporate them into the context
- Detect whether user wants to create a new PR or update an existing one based on context
- When updating, verify the PR description still accurately reflects the changes
- Use conventional commit messages when appropriate
