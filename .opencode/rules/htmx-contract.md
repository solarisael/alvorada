---
name: HTMX Contract
globs: "src/layouts/**/*.astro,src/components/mantle/**/*.astro,public/js/vendor/**/*.js"
description: Load-order, swap-target, and per-link contract for htmx + idiomorph. Recurring bug source if any rule is violated — diagnosed 2026-05-14.
alwaysApply: true
---

# HTMX Contract

These rules are LOAD-BEARING. Violations have caused the same bugs to recur across multiple sessions:

- `htmx is not defined` load-order race
- nav-click blanking the whole page
- pages rendering unstyled after htmx-nav
- stale `data-phase` token across navigations
- per-link hx-target drifting away from body defaults

If you change any of the below, verify with playwright before committing (see `workflow.md` → Visual Verification).

## 1. Load Order (do not touch)

In `src/layouts/index.astro` `<head>`:

```astro
{/*
  LOAD-BEARING — DO NOT TOUCH.
  htmx + idiomorph-ext must load as plain sync scripts in this exact order.
*/}
<script is:inline src={with_base("js/vendor/htmx.min.js")}></script>
<script is:inline src={with_base("js/vendor/idiomorph-ext.js")}></script>
<script src={with_base("js/scripts.js")} type="module"></script>
```

- htmx is the **UMD build** (`htmx.min.js`), NOT the ESM build. UMD self-assigns `window.htmx`.
- htmx and idiomorph-ext are **plain synchronous scripts** in this exact order.
- Never add `type="module"`, `defer`, or `async` to either. Module-deferral causes idiomorph-ext to fire before `window.htmx` is defined → recurring "htmx is not defined" error in console + broken swaps.
- `scripts.js` stays `type="module"` — it's user code and is allowed to defer.

## 2. Swap Target = `<container>`

In `<body>`:

```astro
<body
  hx-ext="morph,head-support,preload,sse"
  hx-target="container"
  hx-select="container"
  hx-swap="morph:outerHTML swap:240ms settle:240ms"
  hx-push-url="true"
>
```

- Target the `<container>` ritualistic element, NOT `body` and NOT `#sol_content`.
- `body` target broke the site entirely — `morph:outerHTML` on body confuses htmx's own body-attached extensions and the whole page blanks.
- `#sol_content` is too inner — the page chrome layers (fog/rails) and `data-phase` attribute live OUTSIDE it and stay stale across navigations.
- `morph:outerHTML` replaces the entire `<container>` element so all children + data-attrs swap together cleanly.

## 3. `data-phase` Rides on `<container>`

```astro
<container data-phase={phase || undefined}>
```

- The phase token MUST live on `<container>` (inside the swap zone), NOT `<body>`.
- htmx-nav swaps `<container>`; the new container's `data-phase` arrives with the response. No JS handler needed. **Htmx-native.**
- CSS selectors that key off phase MUST anchor at `container[data-phase="X"]`, never `body[data-phase="X"]`. Body-anchored phase rules go stale across navs because body is outside the swap zone.

## 4. Nav Links: `hx-get` Only

Per-link `hx-target` / `hx-select` / `hx-swap` / `hx-push-url` are **redundant** — the body provides defaults that inherit. Each nav link should only carry:

```astro
<a
  class="sol__nav_pill"
  data-nav-pill
  data-phase="nigredo"
  href={with_base("nigredo")}
  hx-get={with_base("nigredo")}
>
  nigredo
</a>
```

Do NOT restate `hx-target` / `hx-select` / `hx-swap` / `hx-push-url` on individual links. Drift between body-level and link-level values has caused the swap to target inconsistent elements across nav sources.

The body owns the swap contract. Links only declare the destination.

## 5. Page-Scoped CSS = Layout Level

See `styling.md` → CSS Scoping for HTMX-Nav. Brief: any CSS that styles content inside `<container>` MUST be imported at layout level (`src/layouts/index.astro`), not page level. Page-scoped imports inject as `<style>` tags in the response head, which htmx does NOT pull across with `hx-select="container"`.

## Verification Loop

After any change to the htmx contract:

1. Dev server (`bun run dev`).
2. Direct-URL load each phase page — verify content + styling correct.
3. Nav between phases via clicks — verify content swap + `container[data-phase]` updates + accent color flips.
4. Click center home button from each phase — verify home cards render.
5. Console: 0 errors, 0 warnings expected.

Use playwright for this loop (`mcp_Playwright_browser_*`). Eyeball checks miss the subtle bugs (e.g., 14000px-tall inline-anchor cards that still appear roughly "card-shaped" at first glance).
