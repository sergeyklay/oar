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

Commit the changes made in the repository and create a pull request.
If user provides specific details for the pull request, incorporate them into the context.
Use specific skills to create a branch, commit the changes, and open a pull request with a meaningful title and description.
