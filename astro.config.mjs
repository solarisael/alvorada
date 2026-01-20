import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  // …your other config …
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
  },
})
