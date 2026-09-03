# lessons_map — solarisael website

Curated index of the House lessons that govern work in this repo. **Postgres is
authoritative; this file is a pointer surface, not a second copy.** Query by ID
via the lessons organ (`type=project project=solarisael`, or `type=coding`).
First lessons_map of the House (2026-08-12); shape borrowed for future repos.

- Vintage: 2026-08-12 (Kodo). Re-stamp when the lesson set or repo shape moves.
- Rule inherited from coding lesson #337: point at IDs, never paraphrase bodies.

## Tier 1 — posture (read before any work here)

| id | title |
| --- | --- |
| P42 | Alvorada Is Sol Rendered In Browser |
| P43 | The Alchemical Mapping Is Load-Bearing |
| P44 | Taste Is Correctness Here |
| P45 | Bun Astro Vanilla Is The Stack Contract |
| P90 | Compiled atlas and coverage universe (vintage 2026-07-14) |
| P100 | Build, deploy, and verification contract |

## Tier 2 — subsystem contracts (read when touching that seam)

| seam | project lessons | coding/design lessons |
| --- | --- | --- |
| routes / HTMX / base path | P91, P47, P49 | C186 (state ownership) |
| components | P94 | D304 (layering) |
| styles / tokens / typography | P93 | C191, D298, D299, D300, D302, D303 |
| ornaments / visual language | P99, P124, P46 | C176 (svg extraction), C185 (webgl-first) |
| nigredo + albedo archives | P95, P48, P71 | — |
| citrinitas + rubedo books | P96 | — |
| codex / wikilinks / labs | P97 | — |
| browser lifecycle / preferences | P98, P105 | — |
| fx marker system | P108, P53 | C181 (two error registers) |
| accessibility / state honesty | P101 (gaps) | D295, D296, D297, D301 |
| deploy verification | P100 | house C4 (chunk existence, never hash equality) |

Prefix key: P = project lesson, C = coding lesson, D = design lesson (house
sol-craft design-system family, general taste blessed by Sol).

## Tier 2.5 — house execution discipline (workflow, not subsystem)

Always retrieved via the lessons organ before the matching situation; listed
here because this repo's work keeps hitting them: census-then-batch fanout,
workers wake at the project root (this repo, not the vault), quest register
(A Squall, 350-word cap), bulk sweeps preserve whitespace + per-file syntax
gate, no tests during development (live proof first; seals only on frozen
contracts), orphan sweep after every port/rename, supersede every layer that
indexes a renamed thing, zero inference at execution time, STE100 for docs.

## Tier 3 — dated atlas layer

P90–P101 were compiled 2026-07-14 from a full source + browser census. Their
**contracts** remain authoritative orientation; their **counts** are vintage
(57 pages then; 62 by 2026-07-17; vault has grown since — 16 nigredo, 6 albedo
posts as of 2026-08-12). Never cite an atlas count as current: run
`bun run build` and read the route output.

## Corrections queue (stale facts found 2026-08-12 — ALL EXECUTED same day)

| id | defect | disposition |
| --- | --- | --- |
| P47 | said base `/alvorada`; actual default is `/solarisael` | updated (retitled "Base Path Must Be Systemic") |
| P53 | clamp 0.2–3 was stale (contract.js: 0.2–5); grammar grew stacks, per-effect values, color + speed | updated; P108 is the channel model |
| P46 | cited removed `visual-hard-gates.md` | proof updated to `bun run css:hard-gates:check` |
| P49 | proof cited the idiomorph race as open | proof updated: race resolved, principle kept |
| P50 | pointed at dead `questbook/active.md` | rewritten to the docs/ spine (Sol ruling) |
| P51 | encoded removed `.opencode`-era send-off fields | RETIRED via delete_lesson (Sol ruling) |

## Docs dispositions (delete/store-first sweep — EXECUTED 2026-08-12)

| file | state | proposal |
| --- | --- | --- |
| `progress.md` + `progress.archive.md` (root) | superseded 2026-05-23 snapshot | DELETED (git history is the store) |
| `docs/pretext_transitions_footer_plan.md` | plan for work shipped 2026-07-17 | DELETED (history/2026-07-17.md carries the record) |
| `docs/fx_library_plan.md` | state doc, current through 2026-07-02 only | kept, vintage banner stamped |
| `ui_option_classes.md` (root) | registry with known stale entries (AGENTS.md flag) | keep; needs a verify-against-code pass (unscheduled) |
| `docs/progress.md`, `docs/roadmap.md`, `docs/history/*` | living spine | keep, refresh after each shipped pass |

## Standing invalidation notice

The diary/collections vault collapse (ruled 2026-08-12: diary = nigredo+albedo,
collections = citrinitas+rubedo, phases become tags) will invalidate every
mention of `z_nigredo` / `zz_albedo` / `zzz_citrinitas` / `zzzz_rubedo` source
paths in P90, P95, P96, P100, and the vault-side READMEs. Sweep those when the
cutover lands, and record the new loader contract as a fresh project lesson.
