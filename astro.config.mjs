import { defineConfig } from "astro/config";

const SITE = process.env.SOLARISAEL_SITE ?? "https://solarisael.github.io";
const BASE = process.env.SOLARISAEL_BASE ?? "/solarisael";

export default defineConfig({
  site: SITE,
  base: BASE,
  publicDir: "./src/site/public",
});
