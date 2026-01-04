#!/bin/bash

# Find all AGENTS.md files in current directory and subdirectories
# This is a temporary solution for case that Claude Code not satisfies with AGENTS.md usage case.
# See: https://github.com/anthropics/claude-code/issues/6235


if [ -z "${CLAUDE_PROJECT_DIR}" ]; then
  echo "Error: CLAUDE_PROJECT_DIR is not set" >&2
  exit 1
fi


echo "=== AGENTS.md Files Found ==="
find "$CLAUDE_PROJECT_DIR" -name "AGENTS.md" -type f | while read -r file; do
  echo "--- File: $file ---"
  cat "$file"
  echo ""
done
