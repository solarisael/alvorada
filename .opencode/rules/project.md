---
name: Project Guidelines
alwaysApply: true
---

# Project Architecture

`solarisael` is a personal website built with Astro 5 + Tailwind 4 + Bun + vanilla JS + HTMX + idiomorph. Reading-focused, ritualistic in markup, indie-web in spirit.

## Source Layout

```
src/
├── components/        — ritualistic categorized component dirs
│   ├── aether/        — atmospheric layers (fog, etc.)
│   ├── mantle/        — persistent UI shells (navs, breadcrumbs, footer, style switcher)
│   ├── nigredo/       — nigredo-section components (entry, list, pill)
│   ├── ornament/      — decorative SVG components
│   └── rubedo/        — rubedo-section components (timeline, hover preview, state panel)
├── layouts/           — page-shell layouts (index, chapter)
├── pages/             — route files (one per alchemical section + dynamic routes)
├── styles/            — base.css, index.css, typography.css, utils.css + components/*.css (all snake_case)
├── content/           — nigredo content collection (YYYY/MM/*.md)
├── data/              — runtime data (rubedo book/timeline JS)
├── scripts/           — Astro page scripts (e.g. nigredo_archive.js virtualization)
└── utils/             — shared JS helpers
public/js/
├── modules/           — shared browser JS modules (loaded by .astro components)
└── vendor/            — upstream libraries (htmx, idiomorph) — do not modify
```

## Hard Prohibitions

- NEVER use Yarn or NPM — always Bun.
- Do not use classes (JS classes) or OOP. Functional paradigm only.
- Do not use logical CSS properties (`inline-size`, `block-size`, `padding-inline`, `margin-block`, `border-inline-*`). Use physical properties.
- Do not add `aria-*` or `role` attributes for runtime state contracts. Use `data-*` state hooks or classes.
- Do not add `@media (prefers-reduced-motion: reduce)` branches.

## Naming Conventions (locked 2026-05-12)

- **Snake_case** for all file/dir/id/class names.
- **Ritualistic custom elements** for structural/landmark shells: bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>`. No `sol-` prefix on tags (spec-violation accepted; no JS encapsulation needed).
- **ID prefix**: `#sol_foo_bar` — for collision safety and namespace marking.
- **Class prefix**: `.sol__foo_bar` — for Sol's classes. Tailwind utilities and any vendored classes are not prefixed.
- **Attribute roles** on ritualistic outer wrappers:
  - `data-shape="X"` (kind — e.g. `data-shape="entry"` on `<nigredo>`)
  - `data-state="X"` (runtime state)
  - `data-tone="X"` (flavor — e.g. `data-tone="quiet"` vs `"rupture"` for nigredo entries)
- **Internal `<div>`** stays `<div>` for non-semantic structural boxes.

## Landmark Policy

**Functional native HTML kept** (provides real browser behavior, not just AT semantics):

- Interactives: `button`, `a`, `input`, `select`, `textarea`, `form`
- Media: `img`, `video`, `audio`
- Headings: `h1` – `h6`
- Text formatting: `p`, `strong`, `em`, `code`, `pre`
- Lists: `ul`, `ol`, `li`
- Table family

**Landmark HTML dropped** (no functional benefit; replaced by ritualistic shells):

- `<nav>` → `<mantle data-shape="...">`
- `<main>` → `<vessel data-shape="page_main">`
- `<header>` → `<div>` or ritualistic shell
- `<footer>` → `<mantle data-shape="footer">` (via the Footer component)
- `<article>` → ritualistic shell or `<div>`
- `<section>` → ritualistic shell or `<div>`
- `<aside>` → ritualistic shell

**Exception:** `<container>` — bare unprefixed custom element, kept as Sol's existing pattern.

## Page-Identity Pattern

Every page in `src/pages/*` wraps its content in ONE ritualistic outer element with `data-shape="X"`:

- `nigredo.astro` → `<nigredo data-shape="archive_page">`
- `nigredo/[entry_slug].astro` → `<nigredo data-shape="entry_detail">`
- `albedo.astro` → `<albedo data-shape="archive_page">`
- `rubedo.astro` → `<rubedo data-shape="index_page">`
- `index.astro` → `<vessel data-shape="home_gate">` (home is neutral, not a phase)
- etc.

Inner blocks inside the ritualistic outer use plain `<div>` with semantic classes. The OUTER carries identity; inner divs carry structural classes for CSS targeting.

## Footer Architecture

`Footer.astro` accepts a `phase` prop with per-phase content map. The layout passes phase down. Per-page overrides via `<Fragment slot="footer">...custom footer...</Fragment>` inside the page's `<IndexLayout>` invocation.

## Layout Contracts

- Body composition must be class-driven via `body_grid` and `compound_body_grid` (kept as `.sol__body_grid` / `.sol__compound_body_grid` post-rename).
- Primary/compound templates use `fr` tracks in `grid-template-columns`.
- Do not use margin-centering as a substitute for grid placement when composition contracts exist.

## Stack Notes

- Astro 5 + Tailwind 4 (vite plugin, not the old `@astrojs/tailwind`).
- HTMX 2 + idiomorph for progressive enhancement.
- Catppuccin REMOVED (was "temporary baseline" — removed 2026-05-12; replaced with `--color-codex` for the lavender variable previously in use).
- Phase color tokens defined in `base.css` `@theme` block: `--color-nigredo`, `--color-albedo`, `--color-citrinitas`, `--color-rubedo`, `--color-codex`.
