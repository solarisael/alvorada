import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { remark_text_effects } from "./scripts/remark_text_effects.js";
import { remark_soft_breaks } from "./scripts/remark_soft_breaks.js";
import { remark_wikilinks } from "./scripts/remark_wikilinks.js";

// Obsidian vault root — single source of truth for solarisael content
// (nigredo/albedo/citrinitas via astro content collections; rubedo book
// scenes via vite's import.meta.glob through the `@vault` alias below).
//
// Configurable via SOLARISAEL_OBSIDIAN_ROOT env var. Same value used by
// src/content.config.js — keep these in sync if the path changes.
const OBSIDIAN_VAULT_ROOT =
  process.env.SOLARISAEL_OBSIDIAN_ROOT ?? "C:/Solarisael/Obsidian/obsidian";

export default defineConfig({
  site: "https://solarisael.github.io",
  base: "/solarisael",
  integrations: [],
  markdown: {
    // remark_wikilinks runs BEFORE text_effects so that any `[[...]]` token
    // sitting inside an fx-marker body gets resolved first (the fx tree
    // walker treats its inner content as a single text node; the wikilink
    // walker needs to see those text nodes before fx wraps them). Order:
    // wikilinks → text_effects → soft_breaks.
    remarkPlugins: [remark_wikilinks, remark_text_effects, remark_soft_breaks],
  },
  vite: {
    plugins: [tailwindcss()],
    // Allow Vite to read files from the obsidian vault. Required for dev
    // mode; the build pass resolves globs ahead-of-time so this is
    // belt-and-suspender there. `..` includes the conventional escape;
    // the explicit vault path is what authorizes outside-workspace reads.
    server: {
      fs: {
        allow: ["..", OBSIDIAN_VAULT_ROOT],
      },
    },
    // `@vault` resolves to the obsidian vault root. Used by
    // src/data/rubedo/book_timeline_runtime.js's `import.meta.glob` so
    // rubedo book scenes can be authored in obsidian/zzzz_rubedo/
    // alongside the rest of the alchemical content. Vite's glob analyzer
    // expands aliases at build time — keep the alias literal at callsite.
    resolve: {
      alias: {
        "@vault": OBSIDIAN_VAULT_ROOT,
      },
    },
  },
});
