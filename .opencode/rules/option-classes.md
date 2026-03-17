---
name: UI Option Classes Registry
globs: "src/**/*.{astro,css,js},ui_option_classes.md"
description: Keep switchable UI class options tracked in one central registry file.
alwaysApply: false
---

# UI Option Classes Registry Rule

When creating or changing optional/switchable UI classes, update
`ui_option_classes.md` in the same task.

Required per option set:

- Purpose
- Where to apply the class
- Default class
- Full options list
- Quick switch snippet

Do not spread class-option documentation across multiple files unless explicitly
requested by you.
