# Session Handoff Commit Rule

When you explicitly signal that the current session is ending and a new
session will begin, the agent is allowed to create a git commit for the
completed work.

At handoff, commit scope is full-worktree by default.

## Conditions

- You must clearly indicate session handoff (for example, "we will
  proceed in another session").
- The agent should update session tracking docs (such as `progress.md`) before
  committing.
- At handoff commit time, stage all tracked and untracked changes with
  `git add -A`.
- Do not limit the handoff commit to only files in the immediate request unless
  Sol explicitly asks for a scoped commit.
- The commit message should follow repository style and include any phrase you
  explicitly request.
- If you have a standing preference to skip commit-confirmation questions,
  create the handoff commit directly without asking additional permission.
- If you have a standing preference for commits after major completed
  changes, the agent should create a commit at each major checkpoint.
- Follow `.opencode/rules/commit-message-tail-required.md` for commit-message
  tail handling.
- Do not push unless you explicitly ask.
