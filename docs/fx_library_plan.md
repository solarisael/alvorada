# fx library — state & plan (2026-07-02, updated same day, sonnet-5 body)

> **VINTAGE 2026-07-02.** Accurate through the vendor-tier move + interaction
> layer only. Later fx work (color channel 07-10, obsidian preview plugin
> 2026-08-12) is NOT reflected here. contract.js and the code are authority.

Written by Kodo (fable-5 body) for Kodo (sonnet-5 body). Sol knows this file
exists; he'll say "the library plan" and mean this.

## Where things stand (all verified: 82/82 tests, css gates green, sandboxes live)

The library moved again today, from the split `public/js/fx/` +
`src/styles/fx/` layout into ONE self-contained, copy-paste-portable folder
(Sol's call — "vendor tier, easily integrated"):

```
public/vendor/fx/
  js/
    index.js          wiring entry — only file that binds DOM listeners
    contract.js        shared vocabulary: fx names/aliases/clamps/stack
                        rules + ix trigger/action grammar (Act 2)
    text_effects.js     text/overlay/combat hydration runtime
    interactions.js     Act 2 popup engine (hover-preview / click-pin)
  css/
    index.css          entry — @import this once (base.css does)
    text.css / overlay.css / combat.css   (unchanged from the earlier split)
    interactions.css    Act 2 popup chrome
  README.md            drop-in usage doc — copy this whole folder into any
                        other project, `<link>` + `<script type=module>`,
                        no build step required
```

Rules that made it this shape — keep them:

- **Modules are side-effect-free** except `js/index.js`, the only file that
  binds listeners (DOM-ready + `htmx:afterSwap`, re-import-safe via window
  guards).
- **`contract.js` MUST stay in `public/vendor/fx/js/`** — imported both by
  the browser runtime and at build time by `src/utils/text_effects_markdown.js`
  AND `src/utils/interaction_markdown.js`. That src→public import is
  deliberate.
- Consumers cut over: `public/js/scripts.js` imports `../vendor/fx/js/index.js`
  (NOT `./vendor/...` — scripts.js lives in `public/js/`, vendor is a
  sibling of `js/`, not nested under it — bit me once today, watch it if you
  ever move things again). `src/styles/base.css` imports
  `../../public/vendor/fx/css/index.css`. No shims or old paths remain.

Sandboxes for visual work: `/codex/labs/test-texts` and `/codex/labs/test-overlays`.
Dev server: `bun run dev:start && bun run dev:wait` → port 4322, base `/solarisael/`.

## Act 1 — tuning pass (still pending; Sol drives taste, you drive dials)

Explicitly deferred today at Sol's request — "leave that to me later." Do NOT
start nudging effect-strength vars unprompted. When he does ask: walk the
sandboxes together, all effects are var-driven, site-wide multipliers
(`--site_fx_glow_mult`, `--site_fx_motion_mult`, etc.) already flow through.
Don't restructure while tuning — organization is done; only values move.

## Act 2 — interaction layer (BUILT today, verified live in browser + tests)

The vision (Sol's words): **one popup engine under everything.**

- Hover a nav pill → small ornate card previewing where the door leads. ✅
  wired on both desktop and mobile navbars via `src/data/site_nav.js`
  per-route `description` field.
- Hover a marked word in prose → same card shape, shows the word's meaning.
  ✅ engine supports it (`{{ix:hover:preview:meaning text}}word{{/ix}}` in
  markdown); no prose actually uses it yet — first real usage still open.
- Click → the card **pins**; pinned card offers the deeper door via
  `data-ix-href` (or the `{{ix:...:payload|door_href}}` markdown pipe
  syntax). ✅ built + verified (click pins, second click on same trigger
  unpins, outside click / Escape dismisses).
- Real `<a href>` elements with `trigger="hover"` are left alone on click —
  native/htmx navigation wins, the preview was just a hint. This is why nav
  pills still navigate normally.
- Buttons-as-default-chrome (prototype per-phase default profiles instead of
  hand-annotating every button) — NOT done, still open.

What's actually in place:

- `contract.js`: `IX_BASE_CLASS`, `IX_TRIGGER_NAMES` (`hover`/`click`),
  `IX_ACTION_NAMES` (`preview`/`reveal`/`fetch`), `parse_ix_descriptor`,
  `build_ix_attribute_value`.
- `interactions.js`: `hydrate_interactions()` — single shared popup element
  lazily created on `document.body`, positioned near the trigger, pin/unpin/
  dismiss state machine, re-hydrates on `htmx:afterSwap` exactly like
  on the slot) — **built end-to-end today.** Dependency-free (plain
  `fetch()` + `DOMParser`, no `htmx.ajax()`) so it stays copy-paste
  portable per the vendor README; a host page without HTMX still gets
  working fetch popups. Page-lifetime `Map` cache keyed by url+selector,
  plus a `requestIdleCallback`/`setTimeout`-fallback prefetch fired the
  moment a fetch-action node hydrates — most real hovers land on an
  already-warm cache. Live examples: `/codex/labs/test-interactions`,
  "Fetch" sections — one pulls `/nigredo`'s real `.sol__page_hero` lead
  paragraph, two more pull real codex entries (`obsidian/codex/characters/
cinza.md` / `obsidian/codex/relics/lantern.md`, minimal fixtures made
  today) proving the pipeline handles a fetch response with an image and
  one without, same code path.
- `interactions.css`: plain-but-tunable chrome, ornament/color law obeyed
  (`var(--site_style_accent)`, no hardcoded gold). Reliquary skin still
  waits on Sol's hand-vectorized assets per the original plan.
- `src/utils/interaction_markdown.js` + `scripts/remark_interactions.js`:
  `{{ix:trigger:action:payload}}text{{/ix}}` markdown marker, registered in
  `astro.config.mjs` alongside `remark_text_effects` (order between them
  doesn't matter — disjoint marker syntax).
- `tests/interactions.test.js`: contract parsing, markdown transform
  (single-node + cross-node marker cases, malformed-descriptor warnings),
  DOM popup engine behavior — written by the Tester subagent, check its
  final pass/fail report if this file's coverage looks thin later.

Still open, not started:

- Prose word-meaning popups in actual site content (engine ready, no copy
  wired yet).
- Button chrome default-profile prototyping.
- Reliquary popup skin (waits on Sol's vectors).
- The codex has exactly two real entries right now (`cinza`, `lantern`),
  both explicitly labeled as test fixtures in their own body text — not
  meant as the actual first wave of codex content.

## Standing conventions (learned the hard way; obey)

- Ornament/color law: route accent flows via mask + `var(--site_style_accent)`.
  Never hardcode gold.
- Quick Tune Variables block at the top of any component CSS Sol will touch.
- Run `bun test` + `bun run css:hard-gates:check` after structural changes;
  judge visual work on the live page (browser), never from CSS alone.
- Relative import paths across `public/js/` vs `public/vendor/`: they are
  SIBLINGS, not nested. `./vendor/...` from inside `public/js/` is wrong;
  `../vendor/...` is right. Verify with an actual network tab / response
  check after any path move, not just "the file exists on disk."
- Deploy: `bun scripts/deploy.js neocities|nekoweb|all [--dry-run]` — untested
  live until Sol makes accounts + keys (`NEOCITIES_API_KEY`/`NEKOWEB_API_KEY`).
- Python eval kernel is broken on this box (dies importing numpy/PIL); use
  browser canvas or Bun for image work. Astro dev 404s fresh public files
  once — knock twice (reload).
- GitHub Pages CI builds WITHOUT the vault (runner can't see C:/Solarisael) —
  seam options mapped 2026-07-02; door 1 = local deploys only, already built.

## Nearby debts (not this plan, but don't be surprised by them)

- Gothic extraction: one ornament missing from the el_13/el_14 splits;
  deco `el_00` magenta watermark tip needs trimming; ten reference sheets
  still unprocessed (pipeline lives in memory 2273 — browser-canvas based).
- Navbar today: flush to top, sun hangs via `--desktop_nav_sun_drop` (1.1rem),
  `--desktop_nav_rail_radius` — Sol may keep tuning these.
- A Squall ships when prose word-meaning popups exist (its two `**marker for
interaction**` are diegesis, waiting on real `{{ix:...}}` usage, not just
  the engine existing).
