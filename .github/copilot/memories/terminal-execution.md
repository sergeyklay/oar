# Terminal execution

- When `isBackground=false` returns "The command opened the alternate buffer", switch to `isBackground=true` + `get_terminal_output` immediately. Do not retry the same approach.
- The tmux environment already has node configured. Do not waste attempts sourcing nvm manually. Run `npm run <command> 2>&1` directly.
- If a command fails, diagnose the failure mode before retrying. "alternate buffer" = terminal mode issue, not a command issue.
