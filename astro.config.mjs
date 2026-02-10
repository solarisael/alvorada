import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { remark_text_effects } from "./scripts/remark_text_effects.js";

export default defineConfig({
  integrations: [],
  markdown: {
    remarkPlugins: [remark_text_effects],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
