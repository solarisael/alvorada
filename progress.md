# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-02-15 14:40
- Updated_by: Kintsu (opencode)
- preferred_start_style: conversational
- mode_for_next_session: co-pilot
- primary_outcome_next_session: pass through timeline functionality and layout behavior in the markdown-first Rubedo reader flow
- priority_axis_next_session: polish
- edit_breadth_next_session: focused
- first_task_next_session: run functionality pass on /rubedo/[book_slug]/timeline interactions and adjust layout pain points on desktop/mobile
- commit_intent_next_session: after_review
- notes_next_session: scene data is markdown-only under src/data/rubedo/scenes with strict duplicated tag/frontmatter identity checks; validate reader and timeline parity first

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
- Head: (pending_commit)
- Scope_in: Rubedo markdown-first timeline and reader flow with strict scene identity validation, plus constellation timeline UX.
- Scope_out: broad non-Rubedo refactors and unrelated visual-system rewrites.

## Next (Top 3)

1. [ ] Run timeline functionality pass for chapter switching, POV/modifier state persistence, and fallback badge behavior.
2. [ ] Run layout pass for timeline and reader balance on desktop/mobile.
3. [ ] Decide whether to wire `rubedo:scenes:check` into a single required validation command/workflow.

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

- Build: pass (`bun run build`) - 2026-02-15
- Format_touched: pass (`bunx prettier --check` on touched files) - 2026-02-15
- CSS_hard_gates: pass (`bun run css:hard-gates:check`) - 2026-02-15
- Rubedo_scene_identity: pass (`bun run rubedo:scenes:check`) - 2026-02-15
- JS_focused_tests: pass (`bun test tests/timeline_threads.test.js tests/rubedo_scene_identity.test.js`) - 2026-02-15

## Notes

- Long Done/Decisions history moved to `progress.archive.md`.
- Session start guardrail: if any required send-off field is missing, ask for missing fields first regardless of first prompt.
- After kickoff alignment, reset `*_next_session` handoff fields to pending placeholders for the next send-off.

## Launch Reminders

1. [ ] Lock Eyes + Timeline data contracts before implementing storage/rendering behavior.
2. [ ] Validate POV/path resolution with at least one branched chapter example.
3. [ ] Preserve hard-gate compliance (`css:hard-gates:check`) as a required pre-merge validation.

## Session Delta (2026-02-15)

- Added constellation timeline route and component for Rubedo (`/rubedo/[book_slug]/timeline`) with deterministic chapter node map and optional branch edges.
- Added timeline styling layer and integrated reader/timeline cross-links while preserving query-state (`chapter_id`, `thread_key`, `thread_modifier`).
- Implemented markdown-first Rubedo scene pipeline under `src/data/rubedo/scenes/**` with duplicated identity contract (frontmatter + tags).
- Implemented strict scene identity validation helpers and CLI audit (`bun run rubedo:scenes:check`).
- Extended resolver output with chapter card metadata (`resolved_chapter_title`, `resolved_chapter_description`, `resolved_chapter_snippet`) and thread-variant override precedence.
- Updated reader/timeline panels to show title + description + chapter snippet card content from resolved state.
- Added scene identity tests and expanded timeline resolver tests for metadata override/fallback behavior.
- Completed markdown-only cutover by removing legacy fallback book timeline source and deleting standalone chapter route that duplicated authoring.
