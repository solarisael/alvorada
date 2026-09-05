# solarisael

A personal website — **Solarisael rendered in browser, full Sol, no pretenses.** Not a portfolio, not a business site, not a professional surface. Every section is a facet of the same person; visitors experience Sol by moving through the alchemical stages.

Eventually hosts **Absurd Faith** at `/rubedo/`. The Codex is the reading mechanic for the book.

_sun + aris (lion / war / altar) + aleph (breath / threshold) + el (god) — the being placed within the divine architecture._

## The five alchemical sections

| Route         | Section    | Content                                                                                                           |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `/nigredo`    | Nigredo    | Unhinged / drunk / dark quick-thought posts. Raw dumping ground. The thought before it learns to behave.          |
| `/albedo`     | Albedo     | The reflected-cleaned version. Tasteful, thought-out essays. "Nigredo when you wake up and you're not as sad."    |
| `/citrinitas` | Citrinitas | Archives of things that landed. Poems, photos, records, moments. The collection of what Sol is actually proud of. |
| `/rubedo`     | Rubedo     | Long-running works with chapters and continuity. Home of _Absurd Faith_. The ceremonial completion stage.         |
| `/codex`      | Codex      | In-site wiki. LitRPG-style floating system-prompt. Permission-based unlocks (planned).                            |

## Stack

- **Astro 5** — static generation + component-based pages
- **Tailwind CSS 4** (`@tailwindcss/vite` plugin) + `@tailwindcss/typography`
- **Bun** as runtime, package manager, and test runner (no npm, no yarn)
- **Vanilla JS** (no React, no Vue)
- **HTMX 2.0** + **idiomorph** for progressive-enhanced server-side interactivity
- **TanStack virtual-core** for virtualized long lists
- **Prettier** + `prettier-plugin-astro` + `prettier-plugin-tailwindcss`

Hosting: **GitHub Pages** for now. Future: Nekoweb / Neocities / own domain when the Codex unlock system needs backend.

## Conventions

Structural shells use custom elements such as `<mantle>`, `<vessel>`, and `<ornament>`.
Use native landmarks, links, buttons, forms, lists, and tables for their HTML semantics.

Name shell roles with `data-shape`.
Use component classes for internal elements.

- **IDs**: `#sol_foo_bar` (collision-safe namespace marker)
- **Classes**: `.sol__foo_bar` (Sol's classes; Tailwind utilities and vendored classes unprefixed)
- **Attribute roles**: `data-shape` (kind), `data-state` (runtime), `data-tone` (flavor)
- **Snake_case** for all file/dir/id/class names

Use `AGENTS.md` for local conventions.
The current source and browser checks take precedence over archived plans.

## Quick start

```bash
bun install
bun run dev
```

Build for production:

```bash
bun run build
```

## Verification

Set `SOLARISAEL_OBSIDIAN_ROOT` to the absolute `src/content` path to verify the checked-in public snapshot.
Run these checks:

```bash
bun run code:quality
bun run content:check
bun run build
bunx prettier --check .
bun run css:hard-gates:check
bun run rubedo:scenes:check
```

The quality gate checks JavaScript, Astro, and Python source.
It uses the installed TypeScript and Astro compilers, plus the Python standard library.
Python 3.12 is the verified interpreter.

Keep function CCN at 10 or below.
The gate rejects function CCN above 15.
Review each function between 11 and 15 as one atomic operation.

Keep module averages at 4 or below, with at most one function above 10.
Keep each module at 60 decision points or below.
Use file and function length for review.

Existing tests provide optional diagnostics through `bun test`.
Use the production build and browser checks to verify behavior.
Check navigation, history, keyboard controls, responsive layouts, and browser errors.

## Layout

The shared content frame uses `--layout_content_max` in `src/styles/tokens.css`.
Artwork and prose keep separate width rules.

## Navigation

The side menu provides navigation on desktop and mobile.
Route state and page announcements operate independently of the menu.
History snapshots contain only the page shell.
The site has no top navigation bar.
