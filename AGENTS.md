# AGENTS.md

## Purpose

This document is for coding agents working in this repository (`alvorada`).
Follow these instructions unless a human explicitly says otherwise.

## Project Snapshot

- Stack: Astro 5 + Tailwind CSS 4 + vanilla JavaScript.
- Package manager/runtime: Bun.
- Primary source dirs:
  - `src/pages` (Astro pages)
  - `src/layouts` (Astro layouts)
  - `src/components` (Astro components)
  - `src/styles` (global/component CSS)
  - `public/js` (browser JS loaded directly)
- Config files:
  - `package.json`
  - `astro.config.mjs`
  - `tailwind.config.js`
  - `.prettierrc`

---

## Tooling and Commands

## Prerequisites

- Bun installed (preferred and required by project rules).

## Install deps

- `bun install`

## Run dev server

- `bun run dev`

## Build

- `bun run build`

## Preview production build

- `bun run preview`

## Formatting (Prettier)

No dedicated script exists in `package.json`; use Bun + Prettier directly:

- Check formatting:
  - `bunx prettier --check .`
- Apply formatting:
  - `bunx prettier --write .`
- Format a specific file:
  - `bunx prettier --write src/pages/index.astro`

## Linting

- There is currently **no ESLint (or other lint) config** in this repository.
- Treat formatting + Astro build as current quality gates.
- If adding linting, propose it first and keep config minimal.

## Tests

- There is currently **no test script** and no existing `*.test.*` / `*.spec.*` files.
- If/when tests are added, use Bun test runner.

### Single test execution (important)

Use these patterns:

- Run one test file:
  - `bun test path/to/file.test.js`
- Run one test by name pattern:
  - `bun test path/to/file.test.js -t "test name substring"`
- Run tests in watch mode for one file:
  - `bun test path/to/file.test.js --watch`

### Current test policy

- For now, validate changes with:
  - `bun run build`
  - `bunx prettier --check .`

---

## Repo-Specific Rules (from local agent rules)

The repo contains `.opencode/rules/project.md` and `.opencode/rules/separate-apply-rules-by-category.md`.
Honor them when generating code.

### Required

- Use **Bun**, not npm/yarn, for install/run/add.
- Ask before adding new dependencies.
- Load frontend packages from local project dependencies/bundled modules; do not source runtime packages from CDN/script links unless a human explicitly requests it.
- Prefer functional style; avoid classes/OOP.
- Use snake_case naming for **all** identifiers.
- Keep HTML clean; put styling in CSS files using `@apply` instead of long inline utility-class markup.
- In CSS `@apply`, group utilities by category for readability:
  - layout
  - sizing
  - spacing
  - borders/background
  - typography
  - effects/transitions

### Note on legacy code

- Existing files contain mixed naming/style (including camelCase).
- For edits, follow local file style unless doing a deliberate cleanup.
- For new files/modules, follow the rules above.

---

## Code Style Guidelines

## Formatting baseline (from `.prettierrc`)

- Trailing commas: `all`
- Tab width: `2`
- Semicolons: `true`
- Quotes: double quotes (`singleQuote: false`)
- Plugins:
  - `prettier-plugin-astro`
  - `prettier-plugin-tailwindcss`

## Imports

- Keep imports at top of Astro frontmatter / JS module.
- Order imports:
  1. platform/external packages
  2. internal absolute/relative modules
  3. style imports
- Prefer explicit relative paths; avoid deep, unclear path chains when possible.
- Remove unused imports.

## JavaScript/Type usage

- Codebase is JS-first (no TS config currently).
- Do not introduce TypeScript unless requested.
- Prefer small pure functions over class-based abstractions.
- Favor `const`; use `let` only when mutation is required.
- Keep functions focused and composable.
- Avoid global mutation unless required by browser integration.

### Interaction performance (required)

- For constant/repeatable UI interactions that include movement (e.g. `pointermove`, `scroll`, `resize`, drag, rapid input, repeated hover effects), use `throttle` from `public/js/modules/performance.js`.
- For constant/repeatable UI interactions that include buttons or less frequent events (e.g. `click`, `mouseleave`, `mouseout`, `mouseenter`), use debounce from `public/js/modules/performance.js`.
- Before using them, initialize queue state with `queuer_preparator()` once per page lifecycle (guarded to avoid repeated initialization).
- Timing is context-dependent; choose an interval appropriate to the interaction:
  - around `16ms` for pointer-driven visual updates when near-frame responsiveness is needed (throttle),
  - higher values for heavier or non-visual handlers (debounce).
- Agents may skip throttling/debouncing only when:
  - the human explicitly requests no throttle/debounce for that task, or
  - the interaction is demonstrably low-frequency and performance-neutral.
- If skipping, state the reason briefly in the change summary.

## Naming

- Prefer `snake_case` for new variables/functions/files (project rule).
- Keep names descriptive and domain-based.
- Constants: `SCREAMING_SNAKE_CASE` for true constants.
- DOM ids/classes should remain meaningful and stable.

## Error handling and resilience

- Use guard clauses early (e.g., if required DOM nodes are missing, return safely).
- In browser UI code:
  - fail soft (warn and continue when possible)
  - avoid hard crashes for non-critical features
- Wrap async browser APIs (`clipboard`, etc.) with `try/catch` and provide fallback UX.
- Validate external inputs and event-driven values before use.

## Astro + UI patterns

- Keep page/layout structure in `.astro`.
- For component-scoped interactivity, place script logic directly inside the related `.astro` component.
- Use `public/js/**` only for truly global/shared browser behavior used across multiple pages/components.
- Keep reusable non-DOM logic in JS modules.
- Keep styling in `src/styles/**` (or component-local style blocks when justified).
- Prefer HTMX for server-driven fragment interactions.
- Keep `href` fallback when using HTMX attributes on links/buttons.
- Default HTMX navigation swaps to `#content`; allow edge-case overrides via `data-hx-target`, `data-hx-swap`, and `data-hx-select`.
- Re-initialize component-level interactive scripts after HTMX updates (e.g., `htmx:load`).
- Project HTMX extensions in use: `idiomorph`, `head-support`, `preload`, `sse`.
- Prefer accessibility basics:
  - semantic elements
  - labels/aria where needed
  - keyboard-safe interactions

## CSS/Tailwind patterns

- Prefer CSS files with `@apply` utilities over crowded HTML class strings.
- Organize long `@apply` blocks into multiple grouped lines.
- Reuse theme variables and existing utility patterns before adding new ones.
- Keep animations intentional; avoid gratuitous effects on core UX paths.

## Comments and docs

- Add comments only for non-obvious intent.
- Do not restate obvious code behavior.
- Keep README/AGENTS updated when commands or architecture change.

---

## Agent Workflow Checklist (recommended)

1. Read relevant files first; preserve existing style in touched files.
2. Implement minimal, targeted changes.
3. Run format check/fix (`bunx prettier ...`).
4. Run `bun run build` to catch integration issues.
5. If tests exist for changed area, run focused single-file test(s).
6. Summarize changes and any follow-up risks clearly.

---

## Cursor/Copilot Rule Files

- `.cursor/rules/`: not found
- `.cursorrules`: not found
- `.github/copilot-instructions.md`: not found

If these are added later, update this file and treat them as first-class agent instructions.
