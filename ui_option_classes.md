# UI Option Classes

This file is the single registry for switchable UI class options.

When new optional class variants are introduced, add them here in the same change.

## Changelog

- 2026-02-08: Added initial registry with `navbar-preset-*`,
  `route-active-tone-*`, and `page-transition-breath-*` option sets.
- 2026-02-08: Added `home_theme_*` and `home_fx_*` option sets for `/` card-gate visuals.
- 2026-02-08: Migrated `home_theme_*` to `site_theme_*` and `home_fx_*` to `site_fx_*` for global naming.
- 2026-02-08: Added `site_shell_*` option set for shell intensity control.
- 2026-02-08: Added `verdigris` to `data-site-theme` options.

## Navbar Preset

- Purpose: controls baseline desktop navbar richness (glass blur/light intensity).
- Apply on: `#desktop-nav` in `src/components/navbar.astro`.
- Default: `navbar-preset-rich`.
- Options:
  - `navbar-preset-soft`
  - `navbar-preset-rich`

Quick switch:

```html
<nav id="desktop-nav" class="navbar-preset-rich ..."></nav>
```

## Route Active Tone

- Purpose: controls active-link background tint/saturation and border intensity.
- Apply on: `#desktop-nav` in `src/components/navbar.astro`.
- Default: `route-active-tone-medium`.
- Options:
  - `route-active-tone-subtle`
  - `route-active-tone-medium`
  - `route-active-tone-strong`

Quick switch:

```html
<nav id="desktop-nav" class="route-active-tone-medium ... ..."></nav>
```

## Page Transition Breath

- Purpose: controls fade-out -> gap -> fade-in timing between page swaps.
- Apply on: `body` in `src/layouts/index.astro`.
- Default: `page-transition-breath-subtle`.
- Options:
  - `page-transition-breath-subtle`
  - `page-transition-breath-noticeable`

Quick switch:

```html
<body class="page-transition-breath-subtle" ...></body>
```

## Add New Option Sets

For each new option set, document:

1. Purpose
2. Where to apply the class
3. Default class
4. Full options list
5. One-line quick switch example

## Site Theme

- Purpose: controls global site visual language (ritual/vibrant/arcane).
- Apply on: `html` via `data-site-theme` and globally via style switcher cookies.
- Default: `ritual`.
- Options:
  - `ritual`
  - `vibrant`
  - `arcane`
  - `verdigris`

Quick switch:

```html
<html data-site-theme="ritual"></html>
```

## Site Effects Intensity

- Purpose: controls global interaction intensity (motion, glow, lift) independent of theme.
- Apply on: `html` via `data-site-fx` and globally via style switcher cookies.
- Default: `balanced`.
- Options:
  - `subtle`
  - `balanced`
  - `bold`

Quick switch:

```html
<html data-site-fx="bold"></html>
```

## Site Shell Strength

- Purpose: controls global shell intensity for `#content` border/gradient/decorative overlays.
- Apply on: `html` via `data-site-shell` and style switcher cookies.
- Default: `medium`.
- Options:
  - `subtle`
  - `medium`
  - `strong`

Quick switch:

```html
<html data-site-shell="strong"></html>
```
