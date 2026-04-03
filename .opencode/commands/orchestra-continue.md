---
description: Advance a dispatched orchestra job through its prepared return chain
agent: build
---

Use `solarisael_orchestra_continue` only when the operator explicitly asks to continue a prior job.

Rules:

- pass the `jobID`
- pass `step` only when the operator wants a specific prepared return step
- default `asyncMode` to `false` unless the operator explicitly wants queued continuation
- after execution, report the executed step, remaining steps, and source session target
