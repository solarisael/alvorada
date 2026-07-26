import { derive_chapter_slug } from "./chapter_slug.js";
import {
  normalize_identity_token,
  parse_tag_identity,
  validate_scene_identity_consistency,
} from "./scene_identity.js";

// Rubedo scene sources — dual-glob during the obsidian-migration window.
//
// Historically rubedo scenes lived under `src/content/rubedo/` (project-side).
// As of 2026-05-23 the canonical home is `obsidian/zzzz_rubedo/<book>/...`
// matching the nigredo/albedo/citrinitas pattern (vault = single source of
// truth). The project-side glob stays during transition so Sol can move
// books over carefully without breaking the build mid-way. Once the
// project-side `src/content/rubedo/` is empty, the first glob can be
// dropped — keeping it costs ~0 for empty dirs.
//
// `@vault` alias resolves to the obsidian root (see astro.config.mjs).
// Vite's static analyzer requires alias usage at the glob callsite — do
// not interpolate or precompute the pattern string.
const scene_module_map = {
  ...import.meta.glob(
    ["../../content/rubedo/**/*.md", "!../../content/rubedo/**/refs/**/*.md"],
    { eager: true },
  ),
  ...import.meta.glob(["@vault/zzzz_rubedo/**/*.md", "!@vault/zzzz_rubedo/**/refs/**/*.md"], { eager: true }),
};

const resolve_identity_value = ({
  field_label,
  field_value,
  tag_key,
  parsed_tag_identity,
}) => {
  const normalized_field_value = normalize_identity_token(field_value);
  const normalized_tag_value = normalize_identity_token(
    parsed_tag_identity[tag_key],
  );

  if (normalized_field_value && normalized_tag_value) {
    return normalized_field_value;
  }

  return normalized_field_value || normalized_tag_value;
};

const resolve_timeline_position = ({
  raw_position,
  chapter_id,
  scene_file,
}) => {
  const numeric_position = Number(raw_position);

  if (Number.isFinite(numeric_position)) {
    return numeric_position;
  }

  console.warn(
    `[rubedo-scenes] Missing timeline_position for ${chapter_id} in ${scene_file}. Using 0.`,
  );

  return 0;
};

const get_scene_component = (scene_module) => {
  if (typeof scene_module?.Content === "function") {
    return scene_module.Content;
  }

  if (typeof scene_module?.default === "function") {
    return scene_module.default;
  }

  return null;
};

const get_default_book_title = (book_slug = "") => {
  return String(book_slug)
    .split("-")
    .filter(Boolean)
    .map((slug_part) => {
      return `${slug_part[0]?.toUpperCase() ?? ""}${slug_part.slice(1)}`;
    })
    .join(" ");
};

const build_markdown_book_map = () => {
  const markdown_book_accumulator = new Map();

  for (const [scene_file, scene_module] of Object.entries(scene_module_map)) {
    const frontmatter = scene_module?.frontmatter ?? {};
    const parsed_tag_identity = parse_tag_identity(frontmatter?.tags ?? []);
    const identity_validation = validate_scene_identity_consistency({
      frontmatter,
      parsed_tag_identity,
    });

    if (!identity_validation.is_valid) {
      if (!identity_validation.has_phase_tag) {
        console.warn(
          `[rubedo-scenes] Skipping ${scene_file}. Missing tag phase:rubedo.`,
        );
      }

      if (identity_validation.missing_pairs.length > 0) {
        const missing_labels = identity_validation.missing_pairs
          .map((identity_pair) => {
            return `${identity_pair.field_label}<->${identity_pair.tag_key}`;
          })
          .join(", ");

        console.warn(
          `[rubedo-scenes] Skipping ${scene_file}. Missing duplicated identity fields/tags for: ${missing_labels}.`,
        );
      }

      if (identity_validation.mismatched_pairs.length > 0) {
        const mismatched_labels = identity_validation.mismatched_pairs
          .map((identity_pair) => {
            return `${identity_pair.field_label}<->${identity_pair.tag_key}`;
          })
          .join(", ");

        console.warn(
          `[rubedo-scenes] Skipping ${scene_file}. Identity mismatch for: ${mismatched_labels}.`,
        );
      }

      continue;
    }

    const book_slug = resolve_identity_value({
      field_label: "book_slug",
      field_value: frontmatter?.book_slug,
      tag_key: "book",
      parsed_tag_identity,
    });
    const chapter_id = resolve_identity_value({
      field_label: "chapter_id",
      field_value: frontmatter?.chapter_id,
      tag_key: "chapter",
      parsed_tag_identity,
    });
    const thread_key = resolve_identity_value({
      field_label: "thread_key",
      field_value: frontmatter?.thread_key,
      tag_key: "thread",
      parsed_tag_identity,
    });
    const thread_modifier = resolve_identity_value({
      field_label: "thread_modifier",
      field_value: frontmatter?.thread_modifier,
      tag_key: "modifier",
      parsed_tag_identity,
    });

    if (!book_slug || !chapter_id || !thread_key || !thread_modifier) {
      console.warn(
        `[rubedo-scenes] Skipping ${scene_file}. Missing identity fields/tags.`,
      );
      continue;
    }

    const timeline_position = resolve_timeline_position({
      raw_position: frontmatter?.timeline_position,
      chapter_id,
      scene_file,
    });

    if (!markdown_book_accumulator.has(book_slug)) {
      markdown_book_accumulator.set(book_slug, {
        book_slug,
        title: frontmatter?.book_title ?? null,
        synopsis: frontmatter?.book_synopsis ?? null,
        chapter_map: new Map(),
      });
    }

    const active_book_entry = markdown_book_accumulator.get(book_slug);

    if (!active_book_entry.chapter_map.has(chapter_id)) {
      active_book_entry.chapter_map.set(chapter_id, {
        chapter_id,
        timeline_position,
        title: frontmatter?.chapter_title ?? null,
        chapter_description: frontmatter?.chapter_description ?? null,
        sol__chapter_snippet: frontmatter?.sol__chapter_snippet ?? null,
        branch_edges: frontmatter?.branch_edges ?? [],
        scenes: [],
      });
    }

    const active_chapter_entry = active_book_entry.chapter_map.get(chapter_id);

    if (active_chapter_entry.title == null && frontmatter?.chapter_title) {
      active_chapter_entry.title = frontmatter.chapter_title;
    }

    if (
      active_chapter_entry.chapter_description == null &&
      frontmatter?.chapter_description
    ) {
      active_chapter_entry.chapter_description =
        frontmatter.chapter_description;
    }

    if (
      active_chapter_entry.sol__chapter_snippet == null &&
      frontmatter?.sol__chapter_snippet
    ) {
      active_chapter_entry.sol__chapter_snippet =
        frontmatter.sol__chapter_snippet;
    }

    if (
      Array.isArray(frontmatter?.branch_edges) &&
      frontmatter.branch_edges.length > 0
    ) {
      active_chapter_entry.branch_edges = frontmatter.branch_edges;
    }

    active_chapter_entry.timeline_position = timeline_position;

    active_chapter_entry.scenes.push({
      thread_key,
      thread_modifier,
      scene_title: frontmatter?.scene_title ?? `${chapter_id} ${thread_key}`,
      scene_excerpt: frontmatter?.scene_excerpt ?? null,
      chapter_title_override: frontmatter?.chapter_title_override ?? null,
      chapter_description_override:
        frontmatter?.chapter_description_override ?? null,
      chapter_snippet_override: frontmatter?.chapter_snippet_override ?? null,
      scene_component: get_scene_component(scene_module),
      scene_lines: [],
    });
  }

  const markdown_book_map = {};

  for (const [book_slug, book_entry] of markdown_book_accumulator.entries()) {
    const chapters = [...book_entry.chapter_map.values()]
      .sort((left_chapter, right_chapter) => {
        return left_chapter.timeline_position - right_chapter.timeline_position;
      })
      .map((chapter) => {
        return {
          chapter_id: chapter.chapter_id,
          // Slug baked once here (the chapters are already sorted), so
          // consumers read chapter.chapter_slug instead of re-deriving it at
          // every callsite — mirrors the shared book/ core.
          chapter_slug: derive_chapter_slug(chapter.timeline_position),
          timeline_position: chapter.timeline_position,
          title: chapter.title,
          chapter_description: chapter.chapter_description,
          sol__chapter_snippet: chapter.sol__chapter_snippet,
          branch_edges: Object.freeze([...(chapter.branch_edges ?? [])]),
          scenes: Object.freeze([...chapter.scenes]),
        };
      });

    markdown_book_map[book_slug] = Object.freeze({
      book_slug,
      title: book_entry.title ?? get_default_book_title(book_slug),
      synopsis: book_entry.synopsis ?? "",
      chapters: Object.freeze(chapters),
    });
  }

  return markdown_book_map;
};
const rubedo_book_map = Object.freeze(build_markdown_book_map());

const rubedo_book_slugs = Object.freeze(
  Object.keys(rubedo_book_map).sort((left_slug, right_slug) => {
    return left_slug.localeCompare(right_slug);
  }),
);

// Collects the distinct thread keys present in a chapter's scenes,
// with the default cinza thread always first when present.
const collect_chapter_thread_keys = (scenes = [], default_key = "cinza") => {
  const key_set = new Set();

  for (const scene of scenes) {
    if (typeof scene?.thread_key === "string" && scene.thread_key.trim()) {
      key_set.add(scene.thread_key.trim());
    }
  }

  const sorted = [...key_set].sort((left_key, right_key) => {
    if (left_key === default_key) return -1;
    if (right_key === default_key) return 1;

    return left_key.localeCompare(right_key);
  });

  return sorted;
};

// Timeline-specific serializer — chapter-level only, no scene prose.
// Purpose: feed the constellation map with everything it needs to render
// nodes, edges, hover previews, and thread color coding.
// Does NOT include scene body content — chapters own their own content.
const to_timeline_chapter = (chapter = {}) => {
  const thread_keys = collect_chapter_thread_keys(chapter.scenes ?? []);

  return {
    chapter_id: chapter.chapter_id,
    chapter_slug: derive_chapter_slug(chapter.timeline_position),
    timeline_position: chapter.timeline_position,
    title: chapter.title,
    description: chapter.chapter_description,
    snippet: chapter.sol__chapter_snippet,
    branch_edges: [...(chapter.branch_edges ?? [])],
    thread_keys,
    has_branches:
      Array.isArray(chapter.branch_edges) && chapter.branch_edges.length > 0,
    // Per-thread scene excerpts for hover popup — keyed by thread_key.
    // The default cinza/core excerpt is the fallback when no thread is active.
    scene_excerpts: Object.fromEntries(
      (chapter.scenes ?? []).map((scene) => {
        return [scene.thread_key, scene.scene_excerpt ?? null];
      }),
    ),
  };
};

// rubedo_book_json_map — timeline-ready, slim, serializable.
// Consumed by /rubedo/data/[book_slug].json and fetched by the timeline page
// on load. Cached client-side in the constellation module — hover preview
// reads from this cache, no per-hover server roundtrip.
//
// FUTURE: add free_chapter_limit field when paywall is implemented.
// e.g. free_chapter_limit: 50 — client can gate reader access without
// a server roundtrip by checking chapter index against this value.
const rubedo_book_json_map = Object.freeze(
  Object.fromEntries(
    Object.entries(rubedo_book_map).map(([book_slug, book_entry]) => {
      return [
        book_slug,
        {
          book_slug: book_entry.book_slug,
          title: book_entry.title,
          synopsis: book_entry.synopsis,
          chapters: (book_entry.chapters ?? []).map((chapter) => {
            return to_timeline_chapter(chapter);
          }),
        },
      ];
    }),
  ),
);

// Derives chapter slugs for all chapters in a book — used by getStaticPaths
// in chapter pages to generate one page per chapter.
const derive_chapter_slug_map = (book_slug = "") => {
  const book_entry = rubedo_book_map[book_slug];

  if (!book_entry) return {};

  return Object.fromEntries(
    (book_entry.chapters ?? []).map((chapter) => {
      return [
        derive_chapter_slug(chapter.timeline_position),
        chapter.chapter_id,
      ];
    }),
  );
};

export {
  rubedo_book_map,
  rubedo_book_json_map,
  rubedo_book_slugs,
  derive_chapter_slug,
  derive_chapter_slug_map,
};
