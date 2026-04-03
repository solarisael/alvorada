---
description: Compare lane outputs and optionally promote safe lane changes into the parent repo
agent: build
---

Use `solarisael_orchestra_adjudicate` only when the operator explicitly asks to compare or promote lane results.

Rules:

- pass `promote: true` only when the operator explicitly wants parent-repo promotion
- if `lanes` is omitted, adjudicate every lane in the job
- report overlaps, selected lanes, and promotion outcome clearly
