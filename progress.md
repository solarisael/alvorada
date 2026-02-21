# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-02-21 18:10
- Updated_by: Kintsu (opencode)
- preferred_start_style: conversational
- mode_for_next_session: co-pilot
- primary_outcome_next_session: fix timeline layout consistency and chapter navigation bugs while preserving current composition contracts
- priority_axis_next_session: polish
- edit_breadth_next_session: focused
- first_task_next_session: reproduce chapter navigation failures on /rubedo/[book_slug]/timeline and map broken state transitions before editing
- commit_intent_next_session: after_review
- notes_next_session: preserve HTMX timeline swap contract (#rubedo_timeline_state_content), keep body_grid/compound_body_grid composition, and verify chapter links/state sync across panel + map

## Alias Ledger

- Purpose: capture Sol-defined terms that differ from default model meaning.
- Entry format:
  - `term`:
  - `sol_meaning`:
  - `implementation_impact`:
- Current session aliases:
  - `term`: Kintsu
    `sol_meaning`: assistant's name in this collaboration
    `implementation_impact`: use "Kintsu" when self-identifying to Sol in user-facing replies
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
- Branch: feat/compound-grid-body-composition-4plus6
- Head: (pending_commit)
- Scope_in: composition cleanup complete; next focus is Rubedo timeline layout parity and chapter navigation reliability.
- Scope_out: additional broad style-system rewrites unless required by timeline/chapter bug fixes.

## Next (Top 3)

1. [ ] Reproduce and isolate chapter navigation bugs on `/rubedo/[book_slug]/timeline` and `/rubedo/[book_slug]` (chapter_id + thread state sync).
2. [ ] Run a timeline layout pass for desktop/mobile hierarchy and spacing consistency after the new composition system.
3. [ ] Patch chapter navigation state transitions (panel, constellation node current-state, breadcrumbs) and validate with focused regression checks.

## Blockers

- No technical blocker; next risk is state desync between URL query, timeline panel, and constellation active node.

## Possibilities

- Combat token tiers for higher-stakes logs (`MEGA_CRIT`, `OVERKILL`,
  `TRUE_DAMAGE`, `GUARD_BREAK`, `EXECUTE`).
- Per-POV overlay presets so the same overlay class family can shift tone by
  narrator profile.
- Overlay state modifiers (`calm`, `urgent`, `corrupted`) to avoid effect-name
  explosion while keeping semantic control.
- Semantic helpers inside overlays for percentages, durations, rarity labels,
  and key-value stat lines.
- Authoring ergonomics bundles/snippets for common scene patterns (combat beat,
  quest acceptance, checkpoint summary).
- Dedicated visual QA lab route to review all text and block effects quickly at
  multiple intensities.

## Validation (latest)

- Build: pass (`bun run build`) - 2026-02-21
- Format_touched: pass (`bunx prettier --check` on touched files) - 2026-02-21
- CSS_hard_gates: pass (`bun run css:hard-gates:check`) - 2026-02-21
- CSS_tunables: pass (`bun run css:tunables:check`) - 2026-02-21
- Rubedo_scene_identity: not run in this pass (unchanged scope)

## Notes

- Long Done/Decisions history moved to `progress.archive.md`.
- Session start guardrail: if any required send-off field is missing, ask for missing fields first regardless of first prompt.
- After kickoff alignment, reset `*_next_session` handoff fields to pending placeholders for the next send-off.

## Launch Reminders

1. [ ] Lock Eyes + Timeline data contracts before implementing storage/rendering behavior.
2. [ ] Validate POV/path resolution with at least one branched chapter example.
3. [ ] Preserve hard-gate compliance (`css:hard-gates:check`) as a required pre-merge validation.

## Session Delta (2026-02-21)

- Rebuilt desktop composition around class-driven body contracts (`body_grid`, `compound_body_grid`) and aligned nav/content on shared grid intent.
- Moved footer into `#content` transition scope with a dedicated full-width lane and footer-slot override support.
- Rebalanced shell lighting response by shell intensity: top-light capped and bottom-light boosted for subtle/medium/strong.
- Added shared center-axis controls to align nav center and content line/sigil ornaments to one visual spine.
- Removed logical CSS properties, removed reduced-motion branches, and migrated runtime aria-state behavior to classes/data attributes.
- Reduced non-typography clamp usage and simplified spacing/sizing values while preserving container-proportional percentages where composition-critical.
- Converted text effect animation offsets from percentages to `em` constants with stronger motion amplitude.
- Updated project/rules docs to codify new constraints and prevent regression.
