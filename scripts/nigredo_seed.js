/**
 * nigredo_seed.js
 * Deterministic Nigredo content generator.
 * Usage: bun scripts/nigredo_seed.js [--count=N] [--seed=N]
 *
 * Generates markdown files under src/content/nigredo/YYYY/MM/
 * with deterministic pseudo-random content derived from a seed.
 * Safe to re-run — skips existing files.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// ─── Args ─────────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const TARGET_COUNT = parseInt(args.count ?? "120", 10);
const SEED = parseInt(args.seed ?? "4242", 10);

// ─── PRNG (mulberry32) ────────────────────────────────────────────────────────
function make_prng(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = make_prng(SEED);

function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function maybe(prob) {
  return rng() < prob;
}

function pick_n(arr, n) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

// ─── Lexicon ──────────────────────────────────────────────────────────────────

const ALL_STATES = [
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

// Weighted toward inward states
const WEIGHTED_PRIMARY = [
  ...Array(4).fill("grief"),
  ...Array(4).fill("numb"),
  ...Array(4).fill("exhaustion"),
  ...Array(3).fill("dread"),
  ...Array(3).fill("shame"),
  ...Array(3).fill("guilt"),
  ...Array(3).fill("doubt"),
  ...Array(3).fill("ache"),
  ...Array(2).fill("loneliness"),
  ...Array(2).fill("panic"),
  ...Array(2).fill("ruin"),
  ...Array(2).fill("hunger"),
  ...Array(2).fill("rot"),
  ...Array(1).fill("envy"),
  ...Array(1).fill("spite"),
  ...Array(1).fill("rage"),
];

const TITLE_WORDS = [
  "Inventory",
  "Weather",
  "Report",
  "Notes",
  "Log",
  "Weight",
  "Distance",
  "Silence",
  "Mirror",
  "Threshold",
  "Residue",
  "Archive",
  "Ledger",
  "Signal",
  "Dispatch",
  "Fragment",
  "Record",
  "Trace",
  "Margin",
  "Index",
  "Account",
  "Reckoning",
  "Passage",
  "Entry",
  "Draft",
  "Register",
  "Condition",
  "Statement",
  "Notation",
];

const TITLE_PREFIXES = [
  "The",
  "A",
  "On",
  "Against",
  "In spite of",
  "Toward",
  "Before",
  "After",
  "Without",
  "Between",
  "During",
  "Instead of",
  "Beyond",
];

const EXCERPTS = [
  "Something settled in the wrong place today and I cannot relocate it.",
  "I am doing the inventory again. The inventory does not improve.",
  "There is a version of this day where I handled it better. I don't live in that version.",
  "The silence has texture now. I have started categorizing it.",
  "Everyone thinks I'm holding it together. I am holding the shape of something that isn't here anymore.",
  "Did the things. Said the right words. Came home. Sat down. Stayed there.",
  "I have been fine for three days in a row. I am deeply suspicious.",
  "It is not the big things. It is never the big things. It is the small precise things that arrive without warning.",
  "Rescheduled my own feelings for later. Later has not arrived.",
  "The tiredness is not physical. Physical tiredness responds to rest. This does not respond to rest.",
  "I would explain it if I could find the words. The words are somewhere. I cannot reach them today.",
  "It arrived in the morning. I carried it all day. I put it down at night. It was there in the morning.",
  "Three people asked if I was okay. I said yes with increasing conviction.",
  "The function continues. The operator is having a difficult session.",
  "I kept going because stopping required a decision I did not have the energy to make.",
  "Something is accumulating. I don't know the name of it yet.",
  "I have been patient with myself. The patience is wearing the same face for too long.",
  "Wrote half of something. Deleted the second half. Kept the first half in a drawer.",
  "The ordinary cruelty of ordinary days.",
  "It is not that I am falling apart. It is that I am very tired of holding myself together.",
  "I watched it happen and said nothing. I have been saying nothing about it for some time.",
  "The weight is not in the heavy things. The weight is in the carrying.",
  "I did not sleep well. I have not slept well. I do not know when I last slept well.",
  "There is a room inside me where the lights are off. I know the way but I keep not going.",
  "I smiled when I was supposed to. The smile worked. This is its own kind of loss.",
  "Still here. Still doing it. Still not sure what it is I am doing.",
  "The feeling has no name in this language. Possibly it has no name in any language.",
  "I am learning to be more honest about the gap between what I feel and what I say.",
  "The gap is significant.",
  "I ate well. I moved my body. I did the maintenance. The maintenance does not fix the thing.",
];

const BODY_LINES = [
  "This is the record of it. That is all this is.",
  "I keep making these entries because stopping feels like something I am not prepared to name.",
  "Nothing about this is dramatic. That is part of what makes it hard to talk about.",
  "I am not looking for solutions. I am looking for somewhere to put the weight for a moment.",
  "The feeling is legitimate. I have decided to stop arguing with it about that.",
  "It will pass. It always passes. It always comes back. These two things are both true.",
  "I noted it down because I was here and it happened and that deserves a record.",
  "Some things don't resolve. They just become familiar.",
  "Still present. Still accounting for myself. That counts.",
  "I am allowed to find this hard. I keep forgetting that.",
  "The record continues.",
  "I do not need this to make sense right now.",
  "Logging it. Moving on. Carrying it anyway.",
  "The inventory is ongoing. The surplus is accumulating.",
  "This is what it looked like from inside.",
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

// Generate dates spread across 2023-01 to 2024-10 (avoiding existing months)
function gen_dates(count) {
  const dates = new Set();
  const year_range = [
    [2023, 1, 12],
    [2024, 1, 10],
  ];

  while (dates.size < count) {
    const [year, min_month, max_month] = pick(year_range);
    const month = min_month + Math.floor(rng() * (max_month - min_month + 1));
    const day = 1 + Math.floor(rng() * 28);
    const str = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dates.add(str);
  }

  return [...dates].sort();
}

// ─── Slug helper ──────────────────────────────────────────────────────────────

function to_slug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
}

function gen_slug(primary_state, date, index) {
  if (maybe(0.45)) {
    // titled slug
    const prefix = maybe(0.5) ? pick(TITLE_PREFIXES) + " " : "";
    const word = pick(TITLE_WORDS);
    return to_slug(`${prefix}${word}`);
  }
  // state-based slug
  return to_slug(`${primary_state}-${date.slice(5, 7)}-${index}`);
}

// ─── Entry generator ──────────────────────────────────────────────────────────

function gen_entry(date, index) {
  const primary = pick(WEIGHTED_PRIMARY);

  // Pick 1–3 additional states
  const extra_count = Math.floor(rng() * 3);
  const extras =
    extra_count > 0
      ? pick_n(
          ALL_STATES.filter((s) => s !== primary),
          extra_count,
        )
      : [];

  const states = [primary, ...extras];
  const has_title = maybe(0.55);
  const has_excerpt = maybe(0.75);
  const is_featured = maybe(0.06);

  let title = null;
  let slug;

  if (has_title) {
    const prefix = maybe(0.45) ? pick(TITLE_PREFIXES) + " " : "";
    title = `${prefix}${pick(TITLE_WORDS)}`;
    slug = to_slug(title) + `-${index}`;
  } else {
    slug = gen_slug(primary, date, index);
  }

  const excerpt = has_excerpt ? pick(EXCERPTS) : null;

  const body_lines = [pick(BODY_LINES)];
  if (maybe(0.6)) body_lines.push(pick(BODY_LINES));

  const frontmatter_lines = [
    "---",
    title ? `title: "${title}"` : null,
    `slug: "${slug}"`,
    `published_at: "${date}"`,
    `states: [${states.map((s) => `"${s}"`).join(", ")}]`,
    has_excerpt ? `excerpt: "${excerpt}"` : null,
    is_featured ? "featured: true" : null,
    "---",
  ].filter(Boolean);

  const content = [
    frontmatter_lines.join("\n"),
    "",
    has_excerpt ? excerpt : body_lines[0],
    "",
    body_lines.join("\n\n"),
  ].join("\n");

  return { slug, date, content };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const base = new URL(
  "../src/content/nigredo",
  import.meta.url,
).pathname.replace(/^\/([A-Z]:)/, "$1"); // fix Windows path

const dates = gen_dates(TARGET_COUNT);
let written = 0;
let skipped = 0;

for (let i = 0; i < dates.length; i++) {
  const date = dates[i];
  const { slug, content } = gen_entry(date, i);

  const [year, month] = date.split("-");
  const dir = join(base, year, month);
  const filename = `${date}_${slug}.md`;
  const filepath = join(dir, filename);

  if (existsSync(filepath)) {
    skipped++;
    continue;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(filepath, content, "utf8");
  written++;
}

console.log(
  `[nigredo-seed] Done. Written: ${written}, Skipped: ${skipped}, Total requested: ${TARGET_COUNT}`,
);
