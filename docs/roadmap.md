# Roadmap

Tracks, not phases — content ships on its own clock; the heal runs beside it and never gates the door.

## Track A — Release gates (content-shaped)

1. [ ] **Host choice**: neocities / nekoweb / own-host (sober decision). Affects `base: /solarisael` path config + upload method. Delete `deploy-pages.yml` once chosen — local build + upload `dist/` replaces CI entirely.
2. [ ] Resolve `**marker for interaction**` ×2 in A Squall (scaffolding or diegesis?) → **ship A Squall as the first rubedo light.**
3. [ ] rubedo/codex: minimum content or gate the routes (a handful of codex entries also fixes unresolvable `[[wikilinks]]`).
4. [ ] `example-garden` placeholder booklet: gate or remove before public.
5. [ ] Per-phase home card visuals (all four currently reuse the cinza ornament set — `index.astro:29-48`).
6. [x] Image weight — DONE 2026-07-01: `public/images` ~4.9MB → ~360KB.

## Track B — CSS heal (velocity, not shame)

Context: 7,566 lines / 19 files, written pre-lessons, read by post-lessons taste. The *mechanism* is already right — `data-site-theme` / `data-site-shell` / `data-site-fx` on the site root (`side_menu.js:117`). The accretion is in discipline, not architecture.

**The one rule: themes set tokens; components read tokens; a component file that mentions a theme name is a bug.** (Cross-cutting concern expressed once, not at N call sites.)

1. [ ] One sitting: `src/styles/tokens.css` — every design decision as `--sol_*` custom properties — **plus an in-repo conventions doc** (rules file at root, the wdaag pattern: put the lessons where the code lives).
2. [ ] Strangler migration, file-by-file, **pixel-identical** (screenshot before/after each file; zero visual diff is the contract). Order = biggest/hottest first: `text_effects.css` (993 — the roadmap builds on it) → `nigredo_page.css` (813) → `albedo_page.css` (807) → onward.
3. [ ] Ratchet: every migrated file joins the `css_size_audit` priority-a gates. Accretion cannot re-enter a guarded room.
4. [ ] Last act: delete legacy theme-alias maps (`astrology_themed`, `gothic_dark_girl`, `ritual` → `solarisael`) and their tests.

No rewrite. No redesign. The June-3 wdaag refactor is the proven playbook.

## Track C — Effects & low-end perf (measure before machinery)

Governing rule: capability claims need measurement, not vibes.

1. [ ] fx tiers: `data-site-fx = off / lite / full` — the side-menu cookie prefs already persist this seam; `lite` rides the existing intensity clamp as a global multiplier.
2. [ ] Honor `prefers-reduced-motion` globally (accessibility + perf in one media query).
3. [ ] `IntersectionObserver` pauses effects that aren't on screen.
4. [ ] **Measure**: Lighthouse 4× CPU throttle minimum, ideally a real cheap Android, against the current build.
5. [ ] Canvas/WASM overlay: **DEFERRED pending #4.** Prediction on record (2026-07-01, Kodo): static site + fx tiers passes; a full-viewport canvas repaints on the main thread and runs *hotter* on low-end phones than compositor-thread CSS transforms/opacity; WASM accelerates compute and text effects are paint-bound. Canvas stays legitimate for **bounded set-pieces only** — the rubedo WebGL constellation is already the correct shape. If measurement disagrees, the prediction loses and this reopens.

## Track D — Docs & hygiene

1. [ ] Fold root `progress.md` (2026-05-23 handoff snapshot) into `docs/` — single progress surface.
2. [x] README page count corrected (237 → 52, 2026-07-01).
3. [ ] A Squawk copyedit pass — the ~10-item list + vote-payoff + POV notes are banked in the kodo substrate (memory 2269); apply during Sol's 01+ pass.
4. [ ] `references/` holds unshipped design assets (5 moved in 2026-07-01); prune when stale.
5. [ ] `eyes/solarisael.jpg` — `constellation_config.js:42` references it; file doesn't exist. Needs a content decision (Sol's eyes), not a code fix.
