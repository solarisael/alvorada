# Completed Quests

## 2026-04-22 — Nigredo archive: unified document scroll

- **Primary outcome achieved:** fix the "all over the place" scroll behavior on `/nigredo`.
- **Root cause:** `.nigredo-scroll-pane` was a 62vh overflow container with `overscroll-behavior: contain`, creating two separate scroll contexts (window + pane). Wheel events routed by mouse position; edges absorbed by overscroll-contain. Unpredictable feel.
- **Fix:** unified to single document/window scroll via TanStack window observers.
  - `src/scripts/nigredo_archive.js`: imports swapped to `windowScroll` / `observeWindowOffset` / `observeWindowRect`; `getScrollElement: () => window` (must be `window`, not `documentElement` — window observers read `element.innerHeight / scrollY`); filter-reset swapped to `window.scrollTo({ top: 0, behavior: "instant" })`.
  - `src/styles/components/nigredo-page.css`: stripped `.nigredo-scroll-pane` of height / overflow / overscroll-contain / scrollbar styling; removed `--nigredo_scroll_height` variable + mobile `70vh` override (both dead now).
- **Validation:** `bunx prettier --check` pass; `bun run css:hard-gates:check` pass; `bun run build` pass (238 pages in 2.58s). Playwright verification: virtualizer recycles correctly at top (15 rendered, 2026 entries), mid (20 rendered, 2025 entries), and max-scroll (6-8 rendered, 2023 entries). Filter test: grief → 50/208 with doc-height resize 19072→5168 and scroll-reset to 0.
- **Bonus:** browser scroll restoration now works by default on back-navigation; keyboard scroll (PageDown/PageUp/Home/End) works naturally; single mental scroll model.
- **Agent:** Kodo (`anthropic / claude-opus-4-7`), mode `co-pilot`.

## 2026-04-22 — AGENTS.md model-identity refresh

- Updated Kodo identity line from `anthropic / claude-opus-4-6` to `anthropic / claude-opus-4-7`.
- Small drift catch; AGENTS.md now matches current reality.
