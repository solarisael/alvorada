---
name: Commit Message Tail Required
description: Require a Sol-provided commit tail check for every commit.
alwaysApply: true
---

# Commit Message Tail Rule

Before creating any git commit, ask Sol for an optional commit-message tail.

- If Sol provides text, append it to the commit message using `//`.
- If Sol does not provide text, create the commit without a tail.
- Do not skip this question unless Sol explicitly says to skip it for that
  commit.
- Do not push unless Sol explicitly asks.
