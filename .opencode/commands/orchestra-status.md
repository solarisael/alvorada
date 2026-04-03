---
description: Inspect the live state of a previously dispatched orchestra job
agent: build
---

Use `solarisael_orchestra_status` when the operator explicitly asks to inspect a prior `orchestra` run.

Report:

- job metadata
- lane state, model, repo, branch, directory, and session ids
- result previews and git status when available
- whether the operator should use `solarisael_orchestra_continue` or `solarisael_orchestra_adjudicate` next
