// remark_wikilinks — obsidian-style `[[target]]` and `![[target]]` rewriter.
//
// Operates on the mdast tree during markdown processing. Walks every text
// node and rewrites bracket-pair patterns into HTML nodes the markdown
// pipeline emits as-is (matching the `remark_text_effects` convention).
//
// Syntax supported:
//   [[token]]            → link, display text = token
//   [[token|alias]]      → link, display text = alias
//   ![[token]]           → embed card, header = target title
//   ![[token|alias]]     → embed card, header = alias
//
// Token may contain `#heading` or `^block-ref` suffix; both are stripped
// during resolution (links to the page; heading/block deep-linking is a
// later phase if Sol wants it).
//
// Resolution uses `src/utils/wikilink_registry.js`, which honours
// obsidian's unique-filename-vault-wide contract. Broken links render
// as visible-but-marked anchors so authoring catches them at preview
// time.
//
// Output shape:
//   link        <a class="sol__wikilink" ...>display</a>
//   broken link <a class="sol__wikilink sol__wikilink--broken" ...>token</a>
//   embed       <aside class="sol__wikilink_embed" ...>...</aside>
//   broken embed <aside class="sol__wikilink_embed sol__wikilink_embed--broken" ...>...</aside>
//
// Data attributes on the anchor carry popup metadata so the client-side
// hover-popup script doesn't need a server roundtrip.
import { resolve_wikilink_token } from "../src/utils/wikilink_registry.js";

// CACHING GOTCHA (2026-05-23 lesson): if wikilinks render as `--broken` for
// targets you KNOW exist in the registry, astro/vite has cached the markdown
// transform from before the registry could resolve them. Cache layers to
// clear (any subset usually doesn't reach the deepest one):
//   - `.astro/`                  (project root, content cache)
//   - `.vite/`                   (project root)
//   - `dist/`                    (build output — not strictly cache but rebuilt)
//   - `node_modules/.astro/`     ← the sneaky deep one; .astro project-root
//                                  clear does NOT clear this
//   - `node_modules/.vite/`      ← same shape
// One-liner: rm all five then `bun run build`. After that the registry change
// or new vault file gets seen by the markdown pipeline.

// Matches both link `[[...]]` and embed `![[...]]` forms.
// Inner content is captured greedy-up-to-closing-brackets. Aliasing pipe
// is parsed in JS since regex character class limits make the split nicer
// outside the pattern.
const WIKILINK_PATTERN = /(!?)\[\[([^\]\n]+)\]\]/g;

const escape_html = (raw_value) => {
  return String(raw_value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const split_token_and_alias = (inner) => {
  const pipe_index = inner.indexOf("|");
  if (pipe_index < 0) {
    return { token: inner.trim(), alias: null };
  }
  return {
    token: inner.slice(0, pipe_index).trim(),
    alias: inner.slice(pipe_index + 1).trim() || null,
  };
};

const build_link_html = ({ token, alias, target }) => {
  if (!target) {
    const display = escape_html(alias || token);
    const safe_token = escape_html(token);
    return (
      `<a class="sol__wikilink sol__wikilink--broken" data-shape="link" ` +
      `data-broken-target="${safe_token}" title="missing target: ${safe_token}">${display}</a>`
    );
  }
  const display = escape_html(alias || target.title || token);
  const safe_url = escape_html(target.url);
  const safe_phase = escape_html(target.phase);
  const safe_title = escape_html(target.title);
  const safe_excerpt = escape_html(target.excerpt);
  return (
    `<a class="sol__wikilink" data-shape="link" data-phase="${safe_phase}" ` +
    `href="${safe_url}" data-popup-title="${safe_title}" ` +
    `data-popup-excerpt="${safe_excerpt}" data-popup-phase="${safe_phase}" ` +
    `hx-get="${safe_url}" hx-target="#sol_content" hx-select="#sol_content" ` +
    `hx-swap="morph swap:160ms settle:160ms">${display}</a>`
  );
};

const build_embed_html = ({ token, alias, target }) => {
  if (!target) {
    const safe_token = escape_html(token);
    return (
      `<aside class="sol__wikilink_embed sol__wikilink_embed--broken" ` +
      `data-shape="embed" data-broken-target="${safe_token}">` +
      `<p class="sol__wikilink_embed_missing">missing embed target: ` +
      `<code>${safe_token}</code></p></aside>`
    );
  }
  const header_display = escape_html(alias || target.title || token);
  const safe_url = escape_html(target.url);
  const safe_phase = escape_html(target.phase);
  const safe_excerpt = escape_html(target.excerpt);
  // Embed renders an inline card with title + excerpt + read-more link.
  // Phase-tinted via data-phase. Full transclusion of body content is a
  // future phase — this v1 lands the syntax + the visual card.
  return (
    `<aside class="sol__wikilink_embed" data-shape="embed" data-phase="${safe_phase}">` +
    `<a class="sol__wikilink_embed_header" href="${safe_url}" ` +
    `hx-get="${safe_url}" hx-target="#sol_content" hx-select="#sol_content" ` +
    `hx-swap="morph swap:160ms settle:160ms">` +
    `<span class="sol__text_kicker">~/ ${safe_phase}</span>` +
    `<span class="sol__wikilink_embed_title">${header_display}</span>` +
    `</a>` +
    `<p class="sol__wikilink_embed_excerpt">${safe_excerpt}</p>` +
    `<a class="sol__wikilink_embed_more" href="${safe_url}" ` +
    `hx-get="${safe_url}" hx-target="#sol_content" hx-select="#sol_content" ` +
    `hx-swap="morph swap:160ms settle:160ms">Read full →</a>` +
    `</aside>`
  );
};

const split_text_for_wikilinks = (raw_text) => {
  const source_text = String(raw_text);
  WIKILINK_PATTERN.lastIndex = 0;
  const output_nodes = [];
  let cursor = 0;
  let any_match = false;

  for (const match of source_text.matchAll(WIKILINK_PATTERN)) {
    any_match = true;
    const [full_match, embed_marker, inner] = match;
    const match_start = match.index ?? 0;
    if (cursor < match_start) {
      output_nodes.push({
        type: "text",
        value: source_text.slice(cursor, match_start),
      });
    }
    const { token, alias } = split_token_and_alias(inner);
    if (!token) {
      // Empty token — emit the raw markup unchanged so the author sees
      // their typo rather than losing the characters silently.
      output_nodes.push({ type: "text", value: full_match });
      cursor = match_start + full_match.length;
      continue;
    }
    const target = resolve_wikilink_token(token);
    const is_embed = embed_marker === "!";
    const html_value = is_embed
      ? build_embed_html({ token, alias, target })
      : build_link_html({ token, alias, target });
    output_nodes.push({ type: "html", value: html_value });
    cursor = match_start + full_match.length;
  }

  if (!any_match) {
    return null;
  }

  if (cursor < source_text.length) {
    output_nodes.push({ type: "text", value: source_text.slice(cursor) });
  }
  return output_nodes;
};

const transform_wikilinks_in_tree = (tree_node) => {
  if (!tree_node || !Array.isArray(tree_node.children)) {
    return;
  }
  const next_children = [];
  for (const child_node of tree_node.children) {
    if (child_node?.type === "text" && typeof child_node.value === "string") {
      const replacement_nodes = split_text_for_wikilinks(child_node.value);
      if (replacement_nodes) {
        next_children.push(...replacement_nodes);
        continue;
      }
    }
    next_children.push(child_node);
  }
  tree_node.children = next_children;
  for (const child_node of tree_node.children) {
    transform_wikilinks_in_tree(child_node);
  }
};

const remark_wikilinks = () => {
  return (tree) => {
    transform_wikilinks_in_tree(tree);
  };
};

export {
  remark_wikilinks,
  split_text_for_wikilinks,
  transform_wikilinks_in_tree,
};
