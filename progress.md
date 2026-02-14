# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-02-14 03:06
- Updated_by: Kintsu (opencode)
- preferred_start_style: conversational
- mode_for_next_session: co-pilot
- primary_outcome_next_session: complete typography pass for readability and hierarchy across /rubedo routes while preserving combat_feed token behavior
- priority_axis_next_session: polish
- edit_breadth_next_session: focused
- first_task_next_session: run rubedo typography audit on mobile/desktop, then adjust scale, line-height, and measure in `src/styles/typography.css`
- commit_intent_next_session: after_review
- notes_next_session: combat_feed bracket-inside-token rendering is live; brackets stay neutral while token labels keep semantic color; soft/body-weight bracket preview options are available in labs

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
- Scope_in: rubedo typography readability pass (scale, hierarchy, line-height, line-length) with no regressions to text-fx/combat_feed token rendering.
- Scope_out: new text-effect feature expansion unless explicitly requested during typography pass.

## Next (Top 3)

1. [ ] Audit typography on `/rubedo` and `/rubedo/[book_slug]` at mobile/tablet/desktop breakpoints.
2. [ ] Apply readability-first typography adjustments in `src/styles/typography.css` (scale, line-height, measure, emphasis hierarchy).
3. [ ] Re-validate text effects in codex labs to ensure combat_feed bracket styling remains stable.

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

- Build: pass (`bun run build`) - 2026-02-14 02:58
- Format_touched: pass (`bunx prettier --check` on touched files) - 2026-02-14 02:58
- CSS_hard_gates: pass (`bun run css:hard-gates:check`) - 2026-02-14 02:58

## Notes

- Long Done/Decisions history moved to `progress.archive.md`.
- Session start guardrail: if any required send-off field is missing, ask for missing fields first regardless of first prompt.
- After kickoff alignment, reset `*_next_session` handoff fields to pending placeholders for the next send-off.

## Launch Reminders

1. [ ] Run a dedicated readability QA pass for `rubedo` chapter pages on small/medium/large viewports.
2. [ ] Confirm typography scale lock before broader visual polish resumes.
3. [ ] Preserve hard-gate compliance (`css:hard-gates:check`) as a required pre-merge validation.

## Session Delta (2026-02-14)

- Implemented stacked marker grammar (`fx:a|b|c`) with parser sanitization and deduped warnings.
- Allowed `combat_feed` as inline stack exception and forced it to class-order front for deterministic color priority.
- Added extensive cinematic + extreme-chaos labs coverage in `src/pages/codex/labs/test-texts.md`.
- Added combat-feed color-priority compatibility rules so non-token lines are slightly muted and combat tokens stay dominant.
- Added bracket-aware combat token parsing for explicit `[TOKEN]` forms.
- Moved brackets inside `combat_token` rendering while keeping bracket color neutral and token label color semantic.
- Added bracket style tunables and preview variants (`combat_brackets_soft`, `combat_brackets_text_weight`) in labs.
