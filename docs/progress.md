# Progress — current true state

- Updated: 2026-07-17 by Kodo (claude-fable-5)
- Build: **pass** — `bun run build`, 62 pages, zero errors (verified 2026-07-17 after the footer-cycle pass)
- Shipped image weight: `public/images` ≈ **360KB** (was ~4.9MB before 2026-07-01)

## Hosting decision (changes everything)

GitHub will NOT be the public face — Sol wants neocities, nekoweb, or own-host (undecided, sober-day choice). Consequences:

- The `deploy-pages.yml` CI-can't-see-vault blocker is **moot**: build locally (vault present), upload `dist/`. Remove the workflow once the host is chosen.
- The GitHub repo remains a **private offsite vault** only.
- `base: /solarisael` path config must be revisited per chosen host (root-hosted on neocities/own-domain).

## Section readiness (vault = source of truth)

| Section | State |
|---|---|
| /nigredo | **READY** — 12 real posts (2026-05-05 → 2026-06-13) |
| /albedo | thin — 2 posts, live |
| /citrinitas | mostly ready — 20 seraph-collection poems; `example-garden` placeholder still ships (gate or remove) |
| /rubedo | empty — **A Squall is ship-ready** (cold-read confirmed 2026-07-01) pending one question: `**marker for interaction**` markers — scaffolding or diegesis? |
| /codex | empty — wikilink targets unresolvable until first entries land |

## Known broken / stale

- `public/js/modules/rubedo/constellation_config.js:42` references `/images/eyes/solarisael.jpg` — **file does not exist** (pre-existing; needs a content decision, Sol's eyes)
- Root `progress.md` = May-23 snapshot, superseded by this file
- All four home phase cards reuse the same cinza ornament set (`index.astro:29-48`) — per-phase visuals stubbed

## Done 2026-07-01

See `history/2026-07-01.md`.

## Done 2026-07-17

See `history/2026-07-17.md` — footer sentence cycler + pretext dust/fog transitions + nav semantics.
