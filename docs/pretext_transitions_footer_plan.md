# Pretext transitions + footer sentence cycle — work contract

Spec author: Kodo (advisor session, 2026-07-17). Executors: W1 (transitions engine), W2 (footer cycler).
This file IS the contract. Where it pins an API name or data shape, follow it exactly — the two
work packages are built in parallel against this page, not against each other's branches.

## Goal

1. A reusable **text transition engine** that animates a pretext-hydrated element from its current
   sentence to a new one, fragment by fragment. Two launch effects: `dust` (scatter into dust and
   remake) and `fog` (blur-drift out, condense back in).
2. A **footer sentence cycler**: the mantle footer rotates through a predetermined, Sol-authorable
   table of sentences, each row carrying its own alignment and text effects, using the transition
   engine between rows.

## Ground truth (verified 2026-07-17)

- `src/components/mantle/footer.astro` — phase-keyed html map, only `nigredo` filled
  ("Made with pure hatred <br />You should all die"). Rendered by `src/layouts/index.astro:168-172`
  inside `#sol_content_footer_lane`, inside `main#sol_page_shell` — **replaced on every htmx morph**.
- `src/scripts/pretext_justify.js` — atomizes a `[data-sol-pretext="justify"]` root into
  `.sol__pretext_line` > `.sol__pretext_fragment` spans (fragments carry `data-sol-pretext-item` and
  inherit fx classes/attrs via `apply_fragment_meta`). Source is cached in a **module-private
  WeakMap (`source_cache`)** keyed by root; re-layout re-renders from cache. Hydrates on
  DOMContentLoaded + `htmx:afterSwap`, observes roots with a shared ResizeObserver.
- fx vocabulary: `public/vendor/fx/js/contract.js` — text effects incl. `glow neon shadow blur
flicker gradient aura etch whisper sigil_pulse veil cadence* wiggle float shake glitch`.
  Inline usage: `class="sol__text_fx sol__text_fx_<name>"` or `data-text-fx="name name"`, intensity
  via `data-text-fx-intensity` / `data-text-fx-<name>-intensity` (clamp 0.2–5).
- Site-wide motion scaling: `--site_fx_motion_mult` on `:root` (`data-site-fx` subtle .82 /
  balanced 1 / bold 1.18). All new durations multiply by it.
- Tests: `bun:test` + `@happy-dom/global-registrator`, canvas measureText shim
  (see `tests/pretext_justify.test.js:15-44`). happy-dom has no WAAPI — the engine must degrade.
- Lifecycle contract (project lesson): hydrators idempotent across DOMContentLoaded and htmx
  afterSwap/afterSettle; animation loops self-stop when their DOM leaves the document.

## W1 — transitions engine

**Files:** new `src/scripts/pretext_transitions.js`; edit `src/scripts/pretext_justify.js`
(one export); extend `tests/pretext_justify.test.js` or new `tests/pretext_transitions.test.js`.
Do NOT touch layout, footer, or CSS imports.

1. Add to `pretext_justify.js`:

   ```js
   export const reset_pretext_source = (root) => {
     source_cache.delete(root);
   };
   ```

   Without this the WeakMap replays the old sentence forever after a content swap.

2. `pretext_transitions.js` exports:

   ```js
   export const PRETEXT_TRANSITION_EFFECTS; // Object.freeze({ dust: {...}, fog: {...} })
   export const transition_pretext_content = async (
     root,
     next_html,
     options = {},
   ) => boolean;
   ```

   - `options`: `{ effect = "dust", out_ms = 520, in_ms = 560, stagger_ms = 14, on_swap = null }`.
   - Behavior: collect current `.sol__pretext_fragment` spans → animate OUT (per-fragment WAAPI,
     staggered by index) → `root.innerHTML = next_html` → `reset_pretext_source(root)` →
     `on_swap(root)` if provided (the swap-moment hook — callers update root attributes here,
     e.g. the footer's `data-cycle-align`, so the new sentence never paints under stale state) →
     `layout_pretext_root(root)` → animate the new fragments IN → resolve `true`.
   - If `layout_pretext_root` returns false (zero width, empty), still swap content; resolve `false`.
   - Effect registry is a data table (architecture-as-visible-data): each entry provides
     `out(fragment, index, total)` / `in(fragment, index, total)` returning
     `{ keyframes, options }` for `element.animate`. Adding an effect = adding a row.
   - `dust`: out — opacity→0, translate(random ±14px x, −10±8px y), rotate ±8deg, blur(0→6px);
     in — reverse from randomized offsets to identity, ease-out with slight overshoot.
   - `fog`: out — blur(0→10px), opacity→0, slow +x drift, scale→1.04;
     in — from blur(8px)/opacity 0 drifting back to identity.
   - Durations × `--site_fx_motion_mult` (read once per transition via getComputedStyle on
     documentElement, default 1).
   - **Instant-swap path** (no animation, content still swaps, resolves true) when ANY of:
     `matchMedia("(prefers-reduced-motion: reduce)").matches`; `element.animate` missing
     (happy-dom); zero fragments. This is the tested path.
   - Add `sol__pretext_transitioning` class on root for the duration (will-change hint,
     styled in W2's CSS — W1 only toggles the class).
   - Re-entrancy: a second call on a root mid-transition cancels the first (track per-root via
     WeakMap of AbortController or generation counter; stale phase checks generation and bails).

3. Tests (only your new/extended test file — no full suite, no lint):
   - `reset_pretext_source`: hydrate a root, replace innerHTML, reset, re-layout → fragments show
     the NEW text (without reset they'd show the old — assert the contract, not the plumbing).
   - `transition_pretext_content` under happy-dom: resolves, content swapped, fx classes from
     `next_html` present on new fragments, `sol__pretext_transitioning` removed after resolve.
   - Unknown effect name → falls back to `dust` (or rejects — pick one, test it; prefer fallback
     with a `console.warn`).

## W2 — footer sentence cycler

**Files:** new `src/data/footer_sentences.js`; rewrite `src/components/mantle/footer.astro`;
new `src/scripts/footer_cycle.js`; edit `src/layouts/index.astro` (script block line ~100-104 only);
append to `src/styles/components/footer.css`; new `tests/footer_cycle.test.js`.
Import the engine per the W1 signatures above — do not modify W1's files.

1. `src/data/footer_sentences.js` — the Sol-authorable table. Shape:

   ```js
   export const FOOTER_SENTENCES = Object.freeze({
     shared: [
       { html: "…", align: "center", effect: "dust" },
     ],
     nigredo: [
       { html: "Made with pure hatred <br />You should all die", align: "center", effect: "dust" },
       // …
     ],
     // albedo / citrinitas / rubedo / codex: [] → falls back to shared
   });
   export const resolve_footer_sentences = (phase) => …; // phase rows, else shared, else []
   ```

   - `align`: `"start" | "center" | "end"`. `effect`: key of `PRETEXT_TRANSITION_EFFECTS`.
   - Seed content: keep the hatred couplet as nigredo row 0. Add 4–6 more rows across
     shared/nigredo drawn from EXISTING site copy voice (e.g. threshold/cup/gate imagery from
     `src/pages/index.astro`), varying align and inline fx spans
     (`sol__text_fx sol__text_fx_whisper`, `_etch`, `_glow` with modest intensities ≤1.5).
     Mark the table with a comment: `// Sol-authorable: rows are data, add/edit freely.`

2. `footer.astro`: keep the `phase` prop and the empty-state contract
   (`data-state="filled" | "empty"`). Render row 0 server-side (progressive enhancement — no JS
   = static row 0). Change root element `<mantle>` → `<footer>` (keep `id="sol_footer"`,
   `data-shape`, `data-phase`, `data-state`). Inner sentence element:
   ```html
   <span
     data-footer-cycle
     data-sol-pretext="justify"
     data-cycle-align="{row.align}"
     set:html="{row.html}"
   />
   ```
3. `footer_cycle.js` runtime:
   - Boot on DOMContentLoaded + `htmx:afterSettle` (settle, not swap — don't animate mid-morph).
     Idempotent via a module WeakMap keyed on the root node + phase (idiomorph can preserve the
     footer node across page swaps; a same-phase survivor is left alone, a phase change retires
     the old cycle and rebuilds — attributes are not a reliable guard under morph).
   - Timer: default 12s per row (row may override with `duration_ms`), advances
     index → `transition_pretext_content(root, row.html, { effect: row.effect })`, then sets
     `data-cycle-align` to the new row's align.
   - Manual step arrows: `data-footer-cycle-step="prev|next"` buttons flank the sentence
     (rendered only with 2+ rows); a delegated click listener drives the same transition path.
     Manual steps skip the visibility gates (a click IS the visibility proof) and re-arm the timer.
   - Cost refusal: cycle ONLY while the footer is on-screen (IntersectionObserver) AND
     `!document.hidden` (visibilitychange). Loop self-stops when the root leaves the document
     (`isConnected` check each tick — the htmx morph replaces the footer).
   - Single-row or empty table → no timer at all.
4. CSS (append to `footer.css`, follow its var conventions; rem not px per size audit):
   - `[data-cycle-align]` → `.sol__pretext_line { margin-inline: … }` for start/center/end.
   - `.sol__pretext_transitioning .sol__pretext_fragment { will-change: transform, opacity, filter; }`
5. Layout wiring: add `import "../scripts/footer_cycle.js";` to the module script block in
   `index.astro` (after pretext_justify import). Nothing else in layout changes.
6. Tests (`tests/footer_cycle.test.js` only): `resolve_footer_sentences` fallback behavior;
   every row validates (non-empty html, align in enum, effect in engine registry — import
   `PRETEXT_TRANSITION_EFFECTS` and assert); index advance wraps and skips nothing.

## Out of scope (both packages)

- No formatter runs, no lint, no full test suite, no build — the advisor runs those once at the end.
- Don't touch navbars/side menu (semantic-element fix is handled separately).
- Don't fix known-gaps items (duplicate-id warning, codex 404s, Escape-close).

## Acceptance

- `bun test tests/pretext_transitions.test.js tests/footer_cycle.test.js tests/pretext_justify.test.js` green.
- Dev server at localhost:4321: footer shows row 0 statically, cycles with dust/fog transitions,
  alignment shifts per row, reduced-motion swaps instantly, htmx nav to /writing and back leaves
  exactly one live cycler (no double-timers, no orphan loops).
