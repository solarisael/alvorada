---
name: Separate Rules By Category
globs: "**/*.css"
description: This rule ensures consistent organization of @apply directives in
  CSS files by categorizing utility classes into meaningful groups rather than
  keeping them as a single monolithic @apply statement.
alwaysApply: false
---

When working with CSS files containing @apply directives, always separate utility classes into logical groups: background/borders, layout, sizing, spacing, shape, typography, effects, and transitions. Group similar TailwindCSS classes together for better readability and maintainability.
