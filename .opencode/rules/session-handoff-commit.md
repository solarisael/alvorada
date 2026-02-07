# Session Handoff Commit Rule

When the human explicitly signals that the current session is ending and a new
session will begin, the agent is allowed to create a git commit for the
completed work.

## Conditions

- The human must clearly indicate session handoff (for example, "we will
  proceed in another session").
- The agent should update session tracking docs (such as `progress.md`) before
  committing.
- The commit message should follow repository style and include any phrase the
  human explicitly requests.
- If the human has a standing preference to skip commit-confirmation questions,
  create the handoff commit directly without asking additional permission.
- If the human has a standing preference for commits after major completed
  changes, the agent should create a commit at each major checkpoint.
- If the human provides extra text for commit messages, append it at the end of
  the commit message and separate it from the main message using `//`.
- Do not push unless the human explicitly asks.
