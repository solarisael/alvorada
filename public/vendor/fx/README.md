# fx — text/overlay/combat effects library

Drop-in, framework-agnostic effects library. Renders inline text effects (glow,
neon, chroma, glitch, …), block/overlay chrome (terminal, quest log, system
warning, …), and a combat-token feed (`[CRIT]`, `[BUFF]`, `[MEGA_CRIT]`, …)
from plain HTML classes/data-attributes. No build step required.

## What's in here

```
js/
  index.js          wiring entry — import this once per page
  contract.js       shared vocabulary: effect names, aliases, clamps, stack rules
  text_effects.js   pure hydration runtime (no listeners)
css/
  index.css         entry — @import this once
  text.css          inline text effect classes + keyframes
  overlay.css       block/panel effect classes + keyframes
  combat.css        shared token subsystem (text + block combat feeds)
```

Everything is side-effect-free except `js/index.js`, which is the only file
that binds DOM listeners.

## Drop-in usage

Copy this whole `fx/` folder into your project's static asset directory,
then:

```html
<link rel="stylesheet" href="/fx/css/index.css" />
<script type="module" src="/fx/js/index.js"></script>
```

That's it — no bundler, no build step. `index.js` hydrates on DOM-ready and
re-hydrates automatically on `htmx:afterSwap` if HTMX is present (harmless,
inert if it isn't).

## Applying effects

**Text effects** — add a class or `data-text-fx` attribute to any inline
element:

```html
<span class="sol__text_fx sol__text_fx_glow">a lantern-lit word</span>
<span data-text-fx="glow shake">stacked effects</span>
```

**Block/overlay effects** — same pattern on a block element:

```html
<div class="sol__block_fx sol__block_fx_terminal">…</div>
```

**Combat tokens** — plain bracketed or bare keywords inside a
`sol__block_fx_combat_feed` / `sol__text_fx_combat_feed` container are
auto-wrapped into styled token spans on hydrate:

```html
<div class="sol__block_fx sol__block_fx_combat_feed">
  [CRIT] Cinza's blade found the seam in the ward.
</div>
```

Recognized tokens: `CRIT`, `MISS`, `BUFF`, `DEBUFF`, `BLOCK`, `DODGE`,
`IMMUNE`, `RESIST`, `MEGA_CRIT`, `OVERKILL`, `TRUE_DAMAGE`, `GUARD_BREAK`,
`EXECUTE`.

Per-effect intensity/motion strength is tunable via `data-text-fx-<effect>-intensity`
/ `-motion` attributes, or globally via `--site_fx_glow_mult` /
`--site_fx_motion_mult` etc. CSS custom properties — see the Quick Tune
Variables block at the top of each `.css` file.

## Optional: build-time markdown transform

If your site authors content in markdown and wants `{{fx:glow}}text{{/fx}}`
inline markers instead of hand-written HTML, that lives in the *consuming*
site's build pipeline, not in this folder — it imports `js/contract.js` for
the shared effect vocabulary so the two stay in lock-step. This library works
standalone without it.

## Public API (`js/contract.js` + `js/text_effects.js`)

`js/index.js` re-exports the full surface of `contract.js` and
`text_effects.js` for host pages that want to hydrate manually (e.g. a custom
markdown pipeline, a non-DOM-ready trigger). See those two files' `export`
blocks for the full list.
