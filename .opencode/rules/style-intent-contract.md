---
name: Style Intent Contract
globs: "src/**/*.{astro,css,js},public/js/**/*.js"
description: Prevent styling misunderstandings by requiring an explicit intent-to-implementation contract.
alwaysApply: false
---

# Style Intent Contract

Use this rule for visual/styling requests.

## Before Editing

State a compact intent contract in one block with:

- Mood target (e.g. ritual, vibrant, arcane).
- Intensity target (subtle, balanced, bold).
- Anti-goals (what should not happen).
- Mapping list from prompt phrases to concrete implementation targets.

Required mapping format:

- Prompt cue -> CSS target(s) -> token/class variable(s).

## During Editing

- Implement mapped targets first before optional polish.
- Keep new styling switchable via classes/tokens when the request implies options.
- Prefer semantic variables over hard-coded palette values for switchable themes.
- For non-trivial effects, state an explicit structure plan first: which effect is rendered by HTML layers vs CSS backgrounds.
- Prefer adding dedicated markup layers for complex FX rather than stacking many gradients in one pseudo-element.
- Keep animation plans simple and readable; prefer `transform`/`opacity` and avoid paint-heavy animated properties by default.

## After Editing

Return an applied checklist with file references proving each mapped prompt cue was addressed.

- Mention any prompt cue that was partially implemented and why.
- If any cue cannot be safely implemented, call it out explicitly with the blocker.
