---
name: Project Guidelines
---

# Project Architecture

This is a personal website built with Astro, with these specifications:

- Components in `/src/components`
- Components Styles in `/src/styles/components`
- Layouts in `/src/layouts`
- Pages in `/src/pages`
- Layouts and Pages Styles in `/src/styles`
- Shared browser JS in `/public/js`
- Optional component-local scripts can live inside related `.astro` files

## Important Rules

- NEVER use Yarn or NPM
- ALWAYS use Bun

## Coding Standards

- For new UI markup, prefer component CSS with `@apply` over long inline utility strings in HTML.
- When inserting new dependencies, always ask for permission and always use bun, never utilize yarn or npm.
- Always use snake_case for all cases.
- Do not introduce JS/OOP classes for project logic.
- Purely functional paradigm code structure.
- Avoid OOP.
- Do not use logical CSS properties (`inline-size`, `block-size`, `padding-inline`, `margin-block`, `border-inline-*`, etc.). Use physical properties instead.
- Do not add `aria-*` or `role` attributes for runtime state contracts; use classes or `data-*` state hooks.
- Do not add `@media (prefers-reduced-motion: reduce)` branches.
- Body-level composition must be class-driven via `body_grid` and `compound_body_grid`.
