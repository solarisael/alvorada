---
name: CSS Size Discipline
description: Enforce layout-first sizing, anti-magic-number transforms, and on-demand CSS size auditing.
alwaysApply: true
---

# CSS Size Discipline Rule

Apply this rule for UI/CSS implementation and CSS refactors.

## Hard Requirements

- Layout-first sizing is mandatory: derive size from parent/container flow first.
- Prefer `%` sizing/offsets when possible.
- `px` is forbidden for width/height/offset/transform unless an explicit exception is documented in-file.
- Transform offsets must be variable-derived and should use `%` when feasible.
- Avoid magic numbers: size math must map to named semantic variables.
- Use `clamp()` when fluid behavior improves the result; do not force it when it harms intent.
- Floating UI may ignore breakpoint inheritance when truly independent from surrounding layout.

Allowed `px` exceptions (default):

- border/hairline stroke widths
- shadow and blur values
- explicitly documented one-off visual exceptions

## Priority Audit Scope

Default priority scope:

1. `src/styles/components/style-switcher.css`
2. `src/styles/index.css` for `#content`
3. `src/styles/index.css` for `.phase_card_link`

## On-Demand Audit Command

Use repository command:

- `bun run css:size:audit`

Optional scope:

- `bun scripts/css_size_audit.js check --scope=priority-a`
- `bun scripts/css_size_audit.js check --scope=all`

## Subagent Workflow (When Deep Review Is Needed)

Use an explore subagent with this prompt contract:

- Task: audit CSS sizing discipline with hard/soft findings.
- Output sections:
  - `hard_violations` (file:line, why invalid, suggested fix)
  - `preferred_improvements`
  - `token_merge_candidates`
  - `safe_autofix_candidates`

Recommended subagent invocation target: the default priority scope first, then full sweep only when requested.
