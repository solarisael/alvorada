---
name: JS Reliability
globs: "public/js/**/*.js,src/**/*.{astro,js}"
description: Require resilient, testable JavaScript behavior for user-facing interactions.
alwaysApply: false
---

# JS Reliability Rules

Use this rule whenever JavaScript behavior is added or changed.

## Required

- Add or update focused tests for changed JS behavior.
- Prefer pure helper functions and small side-effect wrappers.
- Validate fallback behavior for invalid input/state (missing cookie, bad value, absent node).
- Keep HTMX lifecycle listeners idempotent and guarded against duplicate bindings.
- Use Bun test runner (`bun test`) for touched JS areas.

## Scope Expectations

- Cookie/state modules: test parsing, sanitization, and persistence string building.
- DOM behavior modules: test at least one class/state transition path with lightweight stubs.
- Do not ship behavior-only JS changes without tests unless explicitly approved by Sol.

## Do / Do Not

Do:

- Export testable helpers from modules.
- Keep runtime initialization minimal and deterministic.

Do not:

- Hide business logic inside event listeners only.
- Rely solely on manual browser testing for JS behavior changes.
