import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { remark_text_effects } from "./scripts/remark_text_effects.js";
import { remark_soft_breaks } from "./scripts/remark_soft_breaks.js";

export default defineConfig({
  integrations: [],
  markdown: {
    remarkPlugins: [remark_text_effects, remark_soft_breaks],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
