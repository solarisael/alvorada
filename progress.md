# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-02-26 01:39
- Updated_by: Kintsu (opencode)
- preferred_start_style: conversational
- next_session: co-pilot
- primary_outcome: audit and correct typography system and navigation behavior for consistency and rule compliance
- priority: polish
- edit_breadth: focused
- first_task: read typography.css and all nav component CSS/JS, identify violations and inconsistencies, present findings before touching anything
- commit_intent: after_review
- notes: scope is typography (scale, leading, measure, token usage) and navigation (desktop + mobile — interaction feel, state correctness, sizing); do not drift into layout or feature work

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
- Scope_in: timeline/map core is implemented; next focus is final interaction polish, text/overlay optimization around map UX, and deployment pipeline prep for GitHub Pages.
- Scope_out: broad visual-system rewrites not directly tied to timeline/map finalization or deployment readiness.

## Next (Top 3)

1. [ ] Finalize timeline + map interactions (edge return feel, hover preview ergonomics, and final mobile/desktop behavior parity).
2. [ ] Optimize text and overlay presentation to complement map-first WebGL runtime without reducing readability.
3. [ ] Start GitHub Pages implementation: define deploy workflow, static output constraints, and first end-to-end deployment check.

## Blockers

- No hard blocker; main risks are over-tuning interaction feel and introducing regressions while preparing deployment wiring.

## GitHub Pages Constraints (next session)

- Treat deployment target as static hosting first; avoid introducing server-only runtime requirements.
- Confirm Astro `site` + `base` strategy early (repo subpath deployment by default unless custom domain is confirmed).
- Verify all critical links/assets/scripts remain base-aware under non-root paths.
- Keep Bun-only workflow in deployment automation and local verification.
- Validate HTMX navigation + deep-link refresh behavior under the final GitHub Pages base path.

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

- Build: pass (`bun run build`) - 2026-03-17
- Format_touched: pass (`bunx prettier --write` on touched files) - 2026-03-17
- CSS_hard_gates: pass (`bun run css:hard-gates:check`) - 2026-03-17
- CSS_tunables: pass (`bun run css:tunables:check`) - 2026-03-17
- Rubedo_scene_identity: not run in this pass (unchanged scope)

## Notes

- Long Done/Decisions history moved to `progress.archive.md`.
- Session start guardrail: if any required send-off field is missing, ask for missing fields first regardless of first prompt.
- After kickoff alignment, reset `*_next_session` handoff fields to pending placeholders for the next send-off.

## Launch Reminders

1. [ ] Lock Eyes + Timeline data contracts before implementing storage/rendering behavior.
2. [ ] Validate POV/path resolution with at least one branched chapter example.
3. [ ] Preserve hard-gate compliance (`css:hard-gates:check`) as a required pre-merge validation.

## Session Delta (2026-03-17)

- Light CSS audit pass across all component stylesheets.
- Removed 5 orphaned legacy canvas variables from `rubedo-timeline.css` (superseded by WebGL `THREAD_RGB` constants).
- Restructured `filter` transitions off host elements onto `::before` pseudo-elements in `rubedo-timeline.css`; removed `filter` from `transition-property` in `breadcrumbs.css` (saturate cannot delegate to pseudo-element).
- Moved `block_fx_skill_popup` box-shadow animation to `::before` in `text-effects.css`.
- Lifted 13 combat token raw oklch literals into a named `--combat_*` Quick Tune variable block; introduced `--block_fx_warning_color` token for system_warning amber.
- Added doc comments to rainbow and chroma aberration intentional fixed-color values.
- Converted 6 forbidden `px` sizing values to `rem` across desktop-nav, mobile-nav, home-card-gate, content-shell.
- Fixed `@apply` grouping violations in footer, desktop-nav, mobile-nav, style-switcher; removed no-op `px-0 py-0` from style-switcher.
- Added `/* Quick Tune Variables (edit here first) */` labels to desktop-nav, home-card-gate, breadcrumbs, rubedo-timeline.
- Documented `clamp()` reading-measure exception in typography.css; marked fog.css as DRAFT.
- Pre-flight HTML/JS audit confirmed zero JS or markup changes required.

## Session Delta (2026-02-21)

- Rebuilt desktop composition around class-driven body contracts (`body_grid`, `compound_body_grid`) and aligned nav/content on shared grid intent.
- Moved footer into `#content` transition scope with a dedicated full-width lane and footer-slot override support.
- Rebalanced shell lighting response by shell intensity: top-light capped and bottom-light boosted for subtle/medium/strong.
- Added shared center-axis controls to align nav center and content line/sigil ornaments to one visual spine.
- Removed logical CSS properties, removed reduced-motion branches, and migrated runtime aria-state behavior to classes/data attributes.
- Reduced non-typography clamp usage and simplified spacing/sizing values while preserving container-proportional percentages where composition-critical.
- Converted text effect animation offsets from percentages to `em` constants with stronger motion amplitude.
- Updated project/rules docs to codify new constraints and prevent regression.
