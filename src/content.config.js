// The rubedo collection files are consumed via import.meta.glob in
// book_timeline_runtime.js — not through Astro's getCollection() API.
// This file declares the collection with an empty loader so Astro does not
// auto-glob the files (which would produce duplicate-id warnings).
import { defineCollection } from "astro:content";

const rubedo = defineCollection({
  loader: async () => [],
});

export const collections = { rubedo };
