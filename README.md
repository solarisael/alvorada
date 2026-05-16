# solarisael

A personal website — **Solarisael rendered in browser, full Sol, no pretenses.** Not a portfolio, not a business site, not a professional surface. Every section is a facet of the same person; visitors experience Sol by moving through the alchemical stages.

Eventually hosts **Absurd Faith** at `/rubedo/`. The Codex is the reading mechanic for the book.

*new day sunlight, a faithful prayer.*

## The five alchemical sections

| Route | Section | Content |
| --- | --- | --- |
| `/nigredo` | Nigredo | Unhinged / drunk / dark quick-thought posts. Raw dumping ground. The thought before it learns to behave. |
| `/albedo` | Albedo | The reflected-cleaned version. Tasteful, thought-out essays. "Nigredo when you wake up and you're not as sad." |
| `/citrinitas` | Citrinitas | Archives of things that landed. Poems, photos, records, moments. The collection of what Sol is actually proud of. |
| `/rubedo` | Rubedo | Long-running works with chapters and continuity. Home of *Absurd Faith*. The ceremonial completion stage. |
| `/codex` | Codex | In-site wiki. LitRPG-style floating system-prompt. Permission-based unlocks (planned). |

## Stack

- **Astro 5** — static generation + component-based pages
- **Tailwind CSS 4** (`@tailwindcss/vite` plugin) + `@tailwindcss/typography`
- **Bun** as runtime, package manager, and test runner (no npm, no yarn)
- **Vanilla JS** (no React, no Vue)
- **HTMX 2.0** + **idiomorph** for progressive-enhanced server-side interactivity
- **TanStack virtual-core** for virtualized long lists
- **Prettier** + `prettier-plugin-astro` + `prettier-plugin-tailwindcss`

Hosting: **GitHub Pages** for now. Future: Nekoweb / Neocities / own domain when the Codex unlock system needs backend.

## Conventions (locked 2026-05-12)

Markup uses **ritualistic custom elements** for structural shells — bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>`. Functional native HTML kept for interactives, forms, media, headings, text formatting, lists, and tables. Landmark tags (`<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>`) dropped in favor of ritualistic shells.

Every page wraps its content in ONE ritualistic outer element with `data-shape="X"`. Inner blocks use plain `<div>` with semantic classes.

- **IDs**: `#sol_foo_bar` (collision-safe namespace marker)
- **Classes**: `.sol__foo_bar` (Sol's classes; Tailwind utilities and vendored classes unprefixed)
- **Attribute roles**: `data-shape` (kind), `data-state` (runtime), `data-tone` (flavor)
- **Snake_case** for all file/dir/id/class names

Full rules live in `.opencode/rules/*.md`. Operational index in `AGENTS.md`.

## Quick start

```bash
bun install
bun run dev
```

Build for production:

```bash
bun run build
```

## Validation

```bash
bun run build                       # 237 pages, expected clean
bunx prettier --check .             # format check
bun run css:hard-gates:check        # ornaments + bg-stack gates
bun run rubedo:scenes:check         # rubedo scene identity (when applicable)
bun test                            # when tests touched
```
