// wikilink_registry — build-time index of every markdown target reachable
// by obsidian-style `[[filename]]` lookup.
//
// Honours obsidian's contract: filenames are unique vault-wide. If two files
// share a filename (case-insensitive), the registry build FAILS with a clear
// pointer to both — making the constraint explicit in the build instead of
// silently picking one and shadowing the other.
//
// Resolution model:
//   - posts (nigredo/albedo) are indexed by frontmatter `slug` and filename
//     stem; slug is canonical while filename keeps Obsidian lookup working.
//   - Citrinitas metadata registers the booklet slug and chapters register
//     filename stem + chapter_id, both pointing at their rendered routes.
//   - Rubedo scenes are indexed only when the renderer's duplicated
//     field/tag identity is complete and equal; refs are excluded.
//   - Codex entries are indexed by relative path, filename stem, and aliases.
//   - target value = { url, title, excerpt, phase, source_path }
//   - URL paths always begin with the configured deploy base.
//
// Sources scanned (all walked sync via node:fs at module load):
//   - obsidian/z_nigredo/**/YYYY-*.md       → phase=nigredo
//   - obsidian/zz_albedo/**/YYYY-*.md       → phase=albedo
//   - obsidian/zzz_citrinitas/**/*.md      → phase=citrinitas booklets
//   - obsidian/zzzz_rubedo/**/*.md         → phase=rubedo (validated, no refs)
//   - src/content/rubedo/**/*.md           → phase=rubedo (legacy, transition)
//   - obsidian/codex/**/*.md                → phase=codex (path-routed)
//
// The base URL prefix comes from SOLARISAEL_BASE, matching astro.config.mjs.
// The registry is built lazily on first access and cached. Returns a frozen
// snapshot of the underlying Map.
//
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolve_obsidian_vault_root } from "../config/obsidian_vault_root.js";
import { derive_chapter_slug } from "../data/book/book_runtime.js";
import {
  normalize_identity_token,
  parse_tag_identity,
  validate_scene_identity_consistency,
} from "../data/rubedo/scene_identity.js";
import {
  citrinitas_booklet_path,
  citrinitas_chapter_path,
} from "../data/citrinitas/route_data.js";

const SOLARISAEL_BASE_URL = String(
  process.env.SOLARISAEL_BASE ?? "/solarisael",
).replace(/\/+$/, "");

const OBSIDIAN_VAULT_ROOT = resolve_obsidian_vault_root();

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));

// The vault root is shared with Astro's content loaders and Vite alias.
// URL paths use the same deploy base configured by astro.config.mjs.

// Source descriptors. `scan_root` is the absolute filesystem root; `phase`
// is the alchemical-phase label; `pattern_kind` controls which subset of
// files counts as a wikilink target (date-prefix posts, booklet records,
// valid Rubedo scenes, or any Codex markdown).
const REGISTRY_SOURCES = [
  {
    phase: "nigredo",
    scan_root: path.join(OBSIDIAN_VAULT_ROOT, "z_nigredo"),
    pattern_kind: "dated_post",
    url_strategy: "post_slug",
  },
  {
    phase: "albedo",
    scan_root: path.join(OBSIDIAN_VAULT_ROOT, "zz_albedo"),
    pattern_kind: "dated_post",
    url_strategy: "post_slug",
  },
  {
    phase: "citrinitas",
    scan_root: path.join(OBSIDIAN_VAULT_ROOT, "zzz_citrinitas"),
    pattern_kind: "citrinitas_booklet",
    url_strategy: "citrinitas_booklet",
  },
  {
    phase: "rubedo",
    scan_root: path.join(OBSIDIAN_VAULT_ROOT, "zzzz_rubedo"),
    pattern_kind: "any_markdown",
    url_strategy: "rubedo_scene",
  },
  {
    phase: "rubedo",
    scan_root: path.join(PROJECT_ROOT, "src", "content", "rubedo"),
    pattern_kind: "any_markdown",
    url_strategy: "rubedo_scene",
  },
  {
    phase: "codex",
    scan_root: path.join(OBSIDIAN_VAULT_ROOT, "codex"),
    pattern_kind: "any_markdown",
    url_strategy: "codex_entry_path",
  },
];

const DATE_PREFIX_RE = /^[0-9]{4}-/;
const FRONTMATTER_BLOCK_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const EXCERPT_MAX_CHARS = 240;

// Tiny YAML-frontmatter reader. We only need string scalars + the `tags`
// array (for rubedo validation). Avoids a full YAML dep — keeps the
// registry build dependency-free. Multi-line strings + nested objects are
// not parsed; we look up named scalars only.
//
// Returns a flat object: { [key]: string | string[] }. Unknown shapes
// (numbers, booleans) are coerced to strings — good enough for our use
// (title, slug, excerpt are all strings; tags are an array of strings).
const parse_simple_frontmatter = (raw_body) => {
  if (typeof raw_body !== "string") {
    return null;
  }
  const block_match = raw_body.match(FRONTMATTER_BLOCK_RE);
  if (!block_match) {
    return null;
  }
  const block_body = block_match[1];
  const lines = block_body.split(/\r?\n/);
  const out = {};
  let active_array_key = null;
  for (const raw_line of lines) {
    if (!raw_line.trim()) {
      active_array_key = null;
      continue;
    }
    // Array item line: `  - value`
    const array_item_match = raw_line.match(/^\s+-\s+(.*)$/);
    if (active_array_key && array_item_match) {
      const arr = out[active_array_key] || [];
      arr.push(unquote_yaml_scalar(array_item_match[1]));
      out[active_array_key] = arr;
      continue;
    }
    // Scalar or array-opening line: `key:` or `key: value`
    const scalar_match = raw_line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/);
    if (!scalar_match) {
      active_array_key = null;
      continue;
    }
    const [, key, raw_value] = scalar_match;
    const trimmed_value = raw_value.trim();
    if (!trimmed_value) {
      // Opening an array — subsequent indented `- foo` lines accumulate.
      out[key] = [];
      active_array_key = key;
      continue;
    }
    // Inline-list form: `tags: [a, b, c]`
    if (trimmed_value.startsWith("[") && trimmed_value.endsWith("]")) {
      out[key] = trimmed_value
        .slice(1, -1)
        .split(",")
        .map((token) => unquote_yaml_scalar(token.trim()))
        .filter(Boolean);
      active_array_key = null;
      continue;
    }
    out[key] = unquote_yaml_scalar(trimmed_value);
    active_array_key = null;
  }
  return out;
};

const unquote_yaml_scalar = (raw_value) => {
  if (typeof raw_value !== "string") {
    return "";
  }
  const trimmed = raw_value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const file_matches_source_pattern = (source, file_name) => {
  if (source.pattern_kind === "dated_post") {
    return DATE_PREFIX_RE.test(file_name) && file_name.endsWith(".md");
  }
  return file_name.endsWith(".md");
};

const normalized_path = (file_path) =>
  path.resolve(file_path).replaceAll("\\", "/").toLowerCase();

const is_rubedo_ref_file = (source, file_path) => {
  if (source.url_strategy !== "rubedo_scene") {
    return false;
  }

  const relative_path = path
    .relative(source.scan_root, file_path)
    .replaceAll(path.sep, "/")
    .toLowerCase();

  return relative_path.split("/").includes("refs");
};

const is_wikilink_registry_source = (file_path = "") => {
  if (typeof file_path !== "string" || !file_path.trim()) {
    return false;
  }

  const changed_path = normalized_path(file_path);
  return REGISTRY_SOURCES.some((source) => {
    const source_root = normalized_path(source.scan_root);
    if (
      source.url_strategy === "rubedo_scene" &&
      is_rubedo_ref_file(source, file_path)
    ) {
      return false;
    }
    return (
      changed_path === source_root || changed_path.startsWith(`${source_root}/`)
    );
  });
};

const walk_markdown_files = (scan_root) => {
  if (!fs.existsSync(scan_root)) {
    return [];
  }
  const out = [];
  const stack = [scan_root];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const child_path = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(child_path);
        continue;
      }
      if (entry.isFile()) {
        out.push(child_path);
      }
    }
  }
  return out;
};

const extract_first_paragraph = (raw_body) => {
  if (typeof raw_body !== "string") {
    return "";
  }
  const stripped = raw_body.replace(FRONTMATTER_BLOCK_RE, "");
  const paragraphs = stripped.split(/\r?\n\r?\n/);
  for (const paragraph of paragraphs) {
    const cleaned = paragraph
      .trim()
      .replace(/^#+\s+/, "") // drop heading hashes
      .replace(/\s+/g, " ");
    if (cleaned) {
      return cleaned;
    }
  }
  return "";
};

const clamp_excerpt = (raw_value, max_chars = EXCERPT_MAX_CHARS) => {
  const source = String(raw_value || "").trim();
  if (source.length <= max_chars) {
    return source;
  }
  return `${source.slice(0, max_chars - 1).trimEnd()}…`;
};

const titlecase_filename_stem = (stem) => {
  return String(stem || "")
    .replace(/^[0-9]{4}-[0-9]{2}-[0-9]{2}[_-]+/, "") // drop date prefix
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (m, ch) => ch.toUpperCase());
};

const derive_scene_chapter_slug = (timeline_position) => {
  const numeric = Number(timeline_position);
  return derive_chapter_slug(Number.isFinite(numeric) ? numeric : 0);
};

const build_url_for_target = ({
  url_strategy,
  phase,
  frontmatter,
  file_path,
  scan_root,
  file_stem,
}) => {
  if (url_strategy === "post_slug") {
    const slug =
      typeof frontmatter?.slug === "string" && frontmatter.slug.trim()
        ? frontmatter.slug.trim()
        : file_stem;
    return `${SOLARISAEL_BASE_URL}/${phase}/${slug}`;
  }
  if (url_strategy === "citrinitas_booklet") {
    const book_slug = normalize_identity_token(frontmatter?.book_slug);
    if (!book_slug) {
      return null;
    }

    const chapter_id = normalize_identity_token(frontmatter?.chapter_id);
    if (!chapter_id) {
      return `${SOLARISAEL_BASE_URL}${citrinitas_booklet_path(book_slug)}`;
    }

    const chapter_slug = derive_chapter_slug(
      Number.isFinite(Number(frontmatter?.position))
        ? Number(frontmatter.position)
        : 0,
    );
    return `${SOLARISAEL_BASE_URL}${citrinitas_chapter_path(book_slug, chapter_slug)}`;
  }
  if (url_strategy === "rubedo_scene") {
    const book_slug = normalize_identity_token(frontmatter?.book_slug);
    const thread_key = normalize_identity_token(frontmatter?.thread_key);
    const chapter_slug = derive_scene_chapter_slug(
      frontmatter?.timeline_position,
    );
    if (!book_slug || !thread_key || !chapter_slug) {
      // Scene is missing required identity — wikilinks shouldn't point at
      // a route the rubedo loader will skip. Return null; caller will mark
      // the registry entry skipped.
      return null;
    }
    // The cinza-core scene is the "canonical" chapter view; non-cinza
    // scenes get the per-thread route.
    if (thread_key === "cinza") {
      return `${SOLARISAEL_BASE_URL}/rubedo/${book_slug}/${chapter_slug}`;
    }
    return `${SOLARISAEL_BASE_URL}/rubedo/${book_slug}/${thread_key}/${chapter_slug}`;
  }
  if (url_strategy === "codex_entry_path") {
    // URL mirrors the relative-to-codex path, dropping the `.md` extension.
    // e.g. obsidian/codex/characters/cinza.md → /codex/characters/cinza
    const relative_path = path
      .relative(scan_root, file_path)
      .replaceAll(path.sep, "/")
      .replace(/\.md$/i, "");
    return `${SOLARISAEL_BASE_URL}/codex/${relative_path}`;
  }
  return null;
};

const is_doc_file_to_skip = (file_stem) => {
  // README and _template files are convention-doc files, not posts.
  // They live alongside content but should never resolve via wikilinks.
  const stem_lower = file_stem.toLowerCase();
  return stem_lower === "readme" || stem_lower.startsWith("_template");
};

const register_key = ({ map, key, target, conflicts, key_kind }) => {
  const normalized = String(key || "")
    .trim()
    .toLowerCase();
  if (!normalized) {
    return;
  }
  const existing = map.get(normalized);
  if (existing && existing.source_path !== target.source_path) {
    conflicts.push({
      lookup_key: normalized,
      key_kind,
      first: existing.source_path,
      second: target.source_path,
    });
    return;
  }
  map.set(normalized, target);
};

const build_registry = () => {
  const targets_by_key = new Map();
  const conflicts = [];

  for (const source of REGISTRY_SOURCES) {
    const file_paths = walk_markdown_files(source.scan_root);
    for (const file_path of file_paths) {
      const file_name = path.basename(file_path);
      if (!file_matches_source_pattern(source, file_name)) {
        continue;
      }
      if (is_rubedo_ref_file(source, file_path)) {
        continue;
      }
      const file_stem = file_name.replace(/\.md$/i, "");
      if (is_doc_file_to_skip(file_stem)) {
        continue;
      }

      let raw_body;
      try {
        raw_body = fs.readFileSync(file_path, "utf8");
      } catch {
        continue;
      }
      const frontmatter = parse_simple_frontmatter(raw_body) || {};

      // The renderer accepts only scenes whose duplicated field/tag identity
      // is complete and equal. Reuse its validator so registry and renderer
      // expose exactly the same Rubedo source set.
      if (source.url_strategy === "rubedo_scene") {
        const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
        const parsed_tag_identity = parse_tag_identity(tags);
        if (
          !validate_scene_identity_consistency({
            frontmatter,
            parsed_tag_identity,
          }).is_valid
        ) {
          continue;
        }
      }

      const url = build_url_for_target({
        url_strategy: source.url_strategy,
        phase: source.phase,
        frontmatter,
        file_path,
        scan_root: source.scan_root,
        file_stem,
      });
      if (!url) {
        continue;
      }

      const slug_value =
        typeof frontmatter.slug === "string" && frontmatter.slug.trim()
          ? frontmatter.slug.trim()
          : null;
      const chapter_id_value =
        typeof frontmatter.chapter_id === "string" &&
        frontmatter.chapter_id.trim()
          ? frontmatter.chapter_id.trim()
          : null;
      const book_slug_value =
        typeof frontmatter.book_slug === "string" &&
        frontmatter.book_slug.trim()
          ? frontmatter.book_slug.trim()
          : null;
      const is_citrinitas_booklet_meta =
        source.url_strategy === "citrinitas_booklet" && !chapter_id_value;

      const title =
        (typeof frontmatter.title === "string" && frontmatter.title.trim()) ||
        (typeof frontmatter.scene_title === "string" &&
          frontmatter.scene_title.trim()) ||
        (typeof frontmatter.chapter_title === "string" &&
          frontmatter.chapter_title.trim()) ||
        (typeof frontmatter.book_title === "string" &&
          frontmatter.book_title.trim()) ||
        (slug_value ??
          chapter_id_value ??
          book_slug_value ??
          titlecase_filename_stem(file_stem));

      // Excerpt source order:
      //   1. frontmatter.excerpt        (posts)
      //   2. frontmatter.scene_excerpt  (rubedo scenes)
      //   3. chapter_excerpt/book_synopsis (booklets)
      //   4. frontmatter.summary         (codex entries)
      //   5. first paragraph of body
      const excerpt = clamp_excerpt(
        (typeof frontmatter.excerpt === "string" &&
          frontmatter.excerpt.trim()) ||
          (typeof frontmatter.scene_excerpt === "string" &&
            frontmatter.scene_excerpt.trim()) ||
          (typeof frontmatter.chapter_excerpt === "string" &&
            frontmatter.chapter_excerpt.trim()) ||
          (typeof frontmatter.book_synopsis === "string" &&
            frontmatter.book_synopsis.trim()) ||
          (typeof frontmatter.summary === "string" &&
            frontmatter.summary.trim()) ||
          extract_first_paragraph(raw_body),
      );

      const aliases = Array.isArray(frontmatter.aliases)
        ? frontmatter.aliases.filter(
            (alias) => typeof alias === "string" && alias.trim(),
          )
        : [];
      const target = Object.freeze({
        url,
        title,
        excerpt,
        phase: source.phase,
        source_path: file_path,
        file_stem,
        slug: slug_value,
        aliases: Object.freeze([...aliases]),
      });

      // A booklet's `_book.md` is metadata for the `/citrinitas/:book_slug`
      // index, not a lookup target named `_book` (that filename repeats per
      // booklet). Chapters retain filename lookup and also expose chapter_id.
      if (!is_citrinitas_booklet_meta) {
        register_key({
          map: targets_by_key,
          key: file_stem,
          target,
          conflicts,
          key_kind: "filename",
        });
      }

      if (is_citrinitas_booklet_meta && book_slug_value) {
        register_key({
          map: targets_by_key,
          key: book_slug_value,
          target,
          conflicts,
          key_kind: "booklet_slug",
        });
      }

      if (slug_value && slug_value.toLowerCase() !== file_stem.toLowerCase()) {
        register_key({
          map: targets_by_key,
          key: slug_value,
          target,
          conflicts,
          key_kind: "slug",
        });
      }

      if (
        chapter_id_value &&
        chapter_id_value.toLowerCase() !== file_stem.toLowerCase()
      ) {
        register_key({
          map: targets_by_key,
          key: chapter_id_value,
          target,
          conflicts,
          key_kind: "chapter_id",
        });
      }

      for (const alias of aliases) {
        register_key({
          map: targets_by_key,
          key: alias,
          target,
          conflicts,
          key_kind: "alias",
        });
      }
    }
  }

  if (conflicts.length) {
    const lines = conflicts.map(
      (c) =>
        `  • "${c.lookup_key}" (via ${c.key_kind}) — ${c.first}\n                                   ${c.second}`,
    );
    throw new Error(
      "[wikilink_registry] Duplicate lookup keys detected — obsidian's `[[name]]` " +
        "resolution requires unique filenames, slugs, chapter ids, and aliases. Rename one of " +
        "each pair to disambiguate:\n" +
        lines.join("\n"),
    );
  }

  return targets_by_key;
};

let cached_registry = null;

const get_wikilink_registry = () => {
  if (cached_registry === null) {
    cached_registry = build_registry();
  }
  return cached_registry;
};

const invalidate_wikilink_registry = () => {
  cached_registry = null;
};

const resolve_wikilink_token = (raw_token) => {
  if (typeof raw_token !== "string") {
    return null;
  }
  // Drop heading anchor and block reference from token before lookup —
  // both forms point at the same file in obsidian, deeper-link semantics
  // can come later.
  const clean_token = raw_token
    .replace(/#.*$/, "")
    .replace(/\^.*$/, "")
    .trim()
    .toLowerCase();
  if (!clean_token) {
    return null;
  }

  return get_wikilink_registry().get(clean_token) ?? null;
};

export {
  SOLARISAEL_BASE_URL,
  build_registry,
  clamp_excerpt,
  get_wikilink_registry,
  invalidate_wikilink_registry,
  is_wikilink_registry_source,
  parse_simple_frontmatter,
  resolve_wikilink_token,
  titlecase_filename_stem,
};
