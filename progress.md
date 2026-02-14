# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-02-14 14:46
- Updated_by: Kintsu (opencode)
- preferred_start_style: conversational
- mode_for_next_session: co-pilot
- primary_outcome_next_session: design and scaffold Eyes + Timeline systems for chapter sequencing with POV-based content switching and optional story paths
- priority_axis_next_session: architecture
- edit_breadth_next_session: focused
- first_task_next_session: define canonical Eyes + Timeline data model (chapter nodes, timeline ordering, POV variants, and optional branch transitions)
- commit_intent_next_session: after_review
- notes_next_session: keep POV system independent from route classes; timeline should support deterministic chapter order plus optional branch edges resolved by POV and path choices

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

- State: in_progress
- Branch: master
- Head: (pending_commit)
- Scope_in: Eyes + Timeline architecture for chapter ordering, POV-based content switching, and optional story path branching.
- Scope_out: visual polish refactors unless required to validate timeline/POV behavior.

## Next (Top 3)

1. [ ] Define Eyes + Timeline schema (`chapter_id`, `timeline_position`, `pov_key`, `branch_key`, `next_edges`).
2. [ ] Specify resolution logic for chapter variant selection by POV and path state.
3. [ ] Build a minimal prototype flow to validate timeline navigation and POV/path switching.

## Blockers

- No technical blocker.

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

- Build: pass (`bun run build`) - 2026-02-14 14:43
- Format_touched: pass (`bunx prettier --check` on touched files) - 2026-02-14 14:43
- CSS_hard_gates: pass (`bun run css:hard-gates:check`) - 2026-02-14 14:43

## Notes

- Long Done/Decisions history moved to `progress.archive.md`.
- Session start guardrail: if any required send-off field is missing, ask for missing fields first regardless of first prompt.
- After kickoff alignment, reset `*_next_session` handoff fields to pending placeholders for the next send-off.

## Launch Reminders

1. [ ] Lock Eyes + Timeline data contracts before implementing storage/rendering behavior.
2. [ ] Validate POV/path resolution with at least one branched chapter example.
3. [ ] Preserve hard-gate compliance (`css:hard-gates:check`) as a required pre-merge validation.

## Session Delta (2026-02-14)

- Implemented stacked marker grammar (`fx:a|b|c`) with parser sanitization and deduped warnings.
- Allowed `combat_feed` as inline stack exception and forced it to class-order front for deterministic color priority.
- Added extensive cinematic + extreme-chaos labs coverage in `src/pages/codex/labs/test-texts.md`.
- Added combat-feed color-priority compatibility rules so non-token lines are slightly muted and combat tokens stay dominant.
- Added bracket-aware combat token parsing for explicit `[TOKEN]` forms.
- Moved brackets inside `combat_token` rendering while keeping bracket color neutral and token label color semantic.
- Added bracket style tunables and preview variants (`combat_brackets_soft`, `combat_brackets_text_weight`) in labs.
- Modularized component inline scripts into component-local runtime modules (`navbar`, `mobile_navbar`, `breadcrumbers`, `style_switcher`).
- Refactored `src/styles/typography.css` to canonical token families (`type`, `leading`, `measure`, `space`, `weight`) with section headers and mini TOC.
- Collapsed rubedo route typography overrides into `route_rubedo` only and removed nested rubedo route-class dependency.
- Added layout-level auto-derivation for `route_rubedo` from pathname while keeping POV classes explicit/manual.
