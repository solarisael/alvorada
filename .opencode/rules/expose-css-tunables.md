# Expose CSS Tunables

When a component stylesheet has many custom properties, keep all local tuning variables easy to edit from the top of the file.

## Goal

- Make fast visual tuning possible without searching through long selectors.
- Keep variable defaults and active runtime behavior consistent.

## Required pattern

1. Put component-specific custom properties in the first selector block near the top.
2. Add a short heading comment like `Quick Tune Variables (edit here first)`.
3. Group variables by role with small section comments (geometry, colors, glow, motion, etc.).
4. Keep variable names stable; avoid breaking existing `var(--...)` references.
5. Keep all values ASCII-safe and unit-explicit (`px`, `rem`, `%`, `ms`) when applicable.

## Scope guidance

- Keep theme/global tokens (`--color-*`) outside this workflow.
- Expose component knobs (`--mobile_*`, `--desktop_*`, `--card_*`, etc.).

## Validation

- Run the CSS tunables checker script after edits:
  - `bun run css:tunables:check`

If the checker fails, update the top variable block so every component-local variable referenced in the file is declared there.
