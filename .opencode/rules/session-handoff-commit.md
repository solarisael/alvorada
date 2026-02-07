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
- Before creating the commit, the agent should ask the human whether they want
  to append any extra text to the end of the commit message.
- If extra text is provided, append it at the end of the commit message and
  separate it from the main message using `//`.
- Do not push unless the human explicitly asks.
