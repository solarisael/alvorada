---
description: Advance a dispatched sol-orchestrator job through its prepared return chain
agent: build
---

Use `sol_orchestrator_continue` to move an existing job forward through its prepared return chain.

Only run this when the operator explicitly asks to continue a job or execute a prepared return step.

Defaults:

- continue the next pending step when no specific step is given
- allow async execution when the operator wants the chain to keep running without waiting
