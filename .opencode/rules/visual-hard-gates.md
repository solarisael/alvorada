---
name: Visual Hard Gates
globs: "src/**/*.{astro,css,js}"
description: Enforce strict visual implementation limits for ornaments and decorative background complexity.
alwaysApply: true
---

# Visual Hard Gates

Apply this rule for all visual/styling implementation work.

## Hard Gates

- Ornament assets MUST be rendered in HTML layers.
- CSS `url(...)` references to `/ornaments/` are forbidden.
- Decorative background stacks MUST NOT exceed 2 layers.
- If more than 2 decorative layers are truly required, add an explicit in-file marker on the declaration block:
  - `/* bg-stack-exception: <reason> */`

## Validation

- Required: `bun run css:ornaments:check`
- Required: `bun run css:bg-stack:check`
- Optional combined gate: `bun run css:hard-gates:check`

## Reporting Contract

- Final report must state: pass/fail for ornament URL gate and background stack gate.
- If any exception markers were used, list file references and reason text.
