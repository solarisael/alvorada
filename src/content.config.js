// The rubedo collection files are consumed via import.meta.glob in
// book_timeline_runtime.js — not through Astro's getCollection() API.
// This file declares the collection with an empty loader so Astro does not
// auto-glob the files (which would produce duplicate-id warnings).
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const rubedo = defineCollection({
  loader: async () => [],
});

const NIGREDO_STATES = [
  "grief",
  "dread",
  "shame",
  "guilt",
  "envy",
  "spite",
  "ache",
  "panic",
  "ruin",
  "numb",
  "hunger",
  "rot",
  "doubt",
  "rage",
  "loneliness",
  "exhaustion",
];

const nigredo = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/nigredo" }),
  schema: z.object({
    title: z.string().optional(),
    slug: z.string(),
    published_at: z.string(),
    states: z.array(z.enum(NIGREDO_STATES)).min(1),
    excerpt: z.string().optional(),
    updated_at: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
  }),
});

export const collections = { rubedo, nigredo };
