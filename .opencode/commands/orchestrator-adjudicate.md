---
description: Compare lane outputs and optionally promote safe non-overlapping changes into the parent repo
agent: build
---

Use `sol_orchestrator_adjudicate` to compare lane diffs and results for a dispatched job.

Only run this when the operator explicitly asks for comparison, recommendation, or promotion.

Options:

- review lane changes side by side before choosing a winner or next step
- optionally promote safe, non-overlapping lane changes into the parent repo when the operator wants consolidation
