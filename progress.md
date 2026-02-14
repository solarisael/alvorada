# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-02-13 19:15
- Updated_by: Kintsu (opencode)
- preferred_start_style: conversational
- mode_for_next_session: co-pilot
- primary_outcome_next_session: audit and improve typography scale/readability across `rubedo` pages without visual noise regression
- priority_axis_next_session: polish
- edit_breadth_next_session: focused
- first_task_next_session: measure current heading/body/caption size + line-height on `/rubedo` and `/rubedo/[book_slug]`, then map fixes in `src/styles/typography.css`
- commit_intent_next_session: after_review
- notes_next_session: preserve current cinza hard-gates and avoid touching personal tuning in `src/styles/index.css` unless explicitly requested

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
- Branch: master
- Head: 43b6773
- Scope_in: visual hard-gates are enforced (ornaments-in-HTML + decorative background stack cap), next pass is typography readability for `rubedo`.
- Scope_out: new decorative architecture changes unless required for typography readability fixes.

## Next (Top 3)

1. [ ] Audit current typography scale on `/rubedo` and `/rubedo/[book_slug]` (headings, body, caption, line-height, line-length).
2. [ ] Apply readability-first scale adjustments in `src/styles/typography.css` with minimal route-specific overrides.
3. [ ] Validate readability on desktop/mobile plus reduced-motion and run hard-gate checks.

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

- Build: pass (`bun run build`) - 2026-02-13 19:09
- Format_touched: pass (`bunx prettier --check` on touched files) - 2026-02-13 19:09
- CSS_hard_gates: pass (`bun run css:hard-gates:check`) - 2026-02-13 19:09

## Notes

- Long Done/Decisions history moved to `progress.archive.md`.
- Session start guardrail: if any required send-off field is missing, ask for missing fields first regardless of first prompt.
- After kickoff alignment, reset `*_next_session` handoff fields to pending placeholders for the next send-off.

## Launch Reminders

1. [ ] Run a dedicated readability QA pass for `rubedo` chapter pages on small/medium/large viewports.
2. [ ] Confirm typography scale lock before broader visual polish resumes.
3. [ ] Preserve hard-gate compliance (`css:hard-gates:check`) as a required pre-merge validation.
