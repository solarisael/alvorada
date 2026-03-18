# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-03-18 05:30
- Updated_by: Kodo (Claude Code)
- preferred_start_style: conversational
- next_session: co-pilot
- primary_outcome: redo timeline, eyes, and chapter reader — rethink how they are structured, navigated, and displayed
- priority: architecture
- edit_breadth: broad
- first_task: read current rubedo timeline, eyes component, and chapter layout in full; map what exists; propose redesign before touching anything
- commit_intent: after_review
- notes: timeline + eyes are currently scaffold-level; chapter navigation via next/prev is functional but raw; the goal is to make this system feel intentional and coherent, not just wired up

## Alias Ledger

- Purpose: capture Sol-defined terms that differ from default model meaning.
- Entry format:
  - `term`:
  - `sol_meaning`:
  - `implementation_impact`:
- Current session aliases:
  - `term`: Kintsu
    `sol_meaning`: assistant's name in this collaboration (GPT model)
    `implementation_impact`: use "Kintsu" when self-identifying to Sol in user-facing replies (GPT); use "Kodo" for Claude
  - `term`: `golden_mystical_tarot` <-> `gilded_arcane`
    `sol_meaning`: ornate black-gold tarot framing language
    `implementation_impact`: map both names to the `gilded_arcane` site theme key
  - `term`: `astrology_themed` <-> `minimal_astral`
    `sol_meaning`: clean celestial symbol linework
    `implementation_impact`: map both names to the `minimal_astral` site theme key
  - `term`: `cosmic_themed` <-> `cosmic_overlay`
    `sol_meaning`: orbital geometric cosmic layouts
    `implementation_impact`: map both names to the `cosmic_overlay` site theme key
  - `term`: `wicca_ornamentation` <-> `witchy_ornate`
    `sol_meaning`: decorative occult motif treatment
    `implementation_impact`: map both names to the `witchy_ornate` site theme key
  - `term`: `gothic_dark_girl` <-> `graveyard_gothic`
    `sol_meaning`: dark feminine gothic collage aesthetics
    `implementation_impact`: map both names to the `graveyard_gothic` site theme key
  - `term`: `relic_gothic` <-> `pixel_relic`
    `sol_meaning`: retro relic HUD look
    `implementation_impact`: map both names to the `pixel_relic` site theme key
  - `term`: `grimdark_tarot` <-> `grimdark_tarot`
    `sol_meaning`: moody narrative tarot panel style
    `implementation_impact`: preserve as shared theme key/name across both vocabularies

## Active Scope

- State: handoff_ready
- Branch: master
- Head: (pending_commit)
- Scope_in: typography system rebuilt, spacing architecture corrected, HTMX routing stabilized
- Scope_out: timeline/eyes/chapter redesign — reserved for next session

## Next (Top 3)

1. [ ] Redesign Rubedo timeline — structure, interaction model, and display (eyes, constellation, state panel)
2. [ ] Redesign Eyes component — currently dead code; needs a real role in the POV/thread switching model
3. [ ] Redesign chapter reader — next/prev navigation, thread switching, layout feel

## Blockers

- None. Foundation is clean after this session's typography and routing work.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-03-18
- Format_touched: pass (`bunx prettier --write` on touched files) — 2026-03-18
- CSS_hard_gates: pass (`bun run css:hard-gates:check`) — 2026-03-18
- Rubedo_scene_identity: not run (scope unchanged)

## Notes

- Long Done/Decisions history moved to `progress.archive.md`.
- Session start guardrail: if any required send-off field is missing, ask for missing fields first regardless of first prompt.
- After kickoff alignment, reset `*_next_session` handoff fields to pending placeholders for the next send-off.

## Launch Reminders

1. [ ] Lock Eyes + Timeline data contracts before implementing storage/rendering behavior.
2. [ ] Validate POV/path resolution with at least one branched chapter example.
3. [ ] Preserve hard-gate compliance (`css:hard-gates:check`) as a required pre-merge validation.

## Session Delta (2026-03-18)

### Typography overhaul

- Removed fluid typography machinery entirely (`--type_fluid_ratio`, `--type_viewport_*`, all `clamp()` on font sizes).
- Collapsed two parallel type scales (`--type_ui_*` and `--type_reading_*`) into one unified scale.
- New scale: Septimal Minor Third (7/6 ≈ 1.1667), base 14px. Tokens: `--text_nano` (9px) through `--text_display` (41px).
- New leading tokens from Pythagorean just intonation: `--leading_display` (1.067, minor second) through `--leading_relaxed` (1.5, perfect fifth).
- Renamed all utility classes: `text_step_*` → `text_display`, `text_large`, `text_main`, `text_mid`, `text_sub`, `text_fine`, `text_body`.
- Updated `rubedo-timeline.css` constellation label from `0.64rem` to `var(--text_nano)`.
- Updated `src/pages/index.astro` class references.

### Spacing architecture

- Removed `display: grid` + `row-gap` workaround from reading container.
- New spacing tokens from Pythagorean em multiples: `--space_prose` (1em, unison), `--space_heading_top` (1.5em, perfect fifth), `--space_heading_bottom` (0.667em, fifth below), `--space_section` (2em, octave).
- Wired tokens to actual margin rules on headings and prose elements inside reading containers.
- Added `:last-child { margin-bottom: 0 }` scoped to reading containers.
- Removed `row-gap: 2rem` from `.reading-layer-body` and `.chapter_content` in `content-shell.css`.
- Removed all POV and route spacing/leading overrides — unified single values throughout.

### HTMX routing fixes

- Removed `hx-boost="true"` from `<body>` — all HTMX-enabled links are now explicit and auditable.
- Removed `hx-select-oob="#content"` from `<body>` — was a redundant double-swap added during morph migration.
- Removed stale `route_rubedo` body class injection from layout — class was never updated on HTMX navigation.
- Fixed footer `<a href="">` — replaced with `<span>` to prevent accidental HTMX interception.
- Added full explicit HTMX attributes (`hx-get`, `hx-target`, `hx-select`, `hx-swap`, `hx-push-url`) to all nav links (desktop + mobile), all home phase card links, and all bare-href links across nigredo, albedo, citrinitas, codex pages.
- Fixed `reading_plane_motion.js` — added `htmx:beforeRequest` listener that resets the Y shift before navigation, preventing reading container from arriving offset from a previous page's scroll state.

## Session Delta (2026-03-17)

- Light CSS audit pass across all component stylesheets.
- Removed 5 orphaned legacy canvas variables from `rubedo-timeline.css`.
- Restructured `filter` transitions off host elements onto `::before` pseudo-elements in `rubedo-timeline.css`; removed `filter` from `transition-property` in `breadcrumbs.css`.
- Moved `block_fx_skill_popup` box-shadow animation to `::before` in `text-effects.css`.
- Lifted 13 combat token raw oklch literals into named `--combat_*` Quick Tune variables; introduced `--block_fx_warning_color` token.
- Converted 6 forbidden `px` sizing values to `rem` across desktop-nav, mobile-nav, home-card-gate, content-shell.
- Fixed `@apply` grouping violations in footer, desktop-nav, mobile-nav, style-switcher.
- Added Quick Tune Variable labels and doc comments across components.
