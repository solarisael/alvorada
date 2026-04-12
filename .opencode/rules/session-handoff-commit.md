# Session Handoff Commit Rule

When you explicitly signal that the current session is ending and a new
session will begin, the agent may prepare a handoff commit flow.

This rule does not override higher-priority git safety rules or Sol's explicit
commit instructions.

If Sol asks for a handoff commit, commit scope is full-worktree by default.

## Conditions

- You must clearly indicate session handoff (for example, "we will
  proceed in another session").
- The agent should update `questbook/active.md` before committing.
  This file is the active session tracking source of truth.
- Do not create a commit unless Sol explicitly asks for one, or has clearly
  established that handoff commits should be created automatically.
- At handoff commit time, stage all tracked and untracked changes with
  `git add -A`.
- Do not limit the handoff commit to only files in the immediate request unless
  Sol explicitly asks for a scoped commit.
- The commit message should follow repository style and include any phrase you
  explicitly request.
- If you have a standing preference to skip commit-confirmation questions,
  and Sol has already asked for the handoff commit flow, create the handoff
  commit directly without asking additional permission.
- If you have a standing preference for commits after major completed
  changes, only apply it when Sol has explicitly asked for commit creation in
  the current session or handoff flow.
- Follow `.opencode/rules/commit-message-tail-required.md` for commit-message
  tail handling.
- Do not push unless you explicitly ask.
