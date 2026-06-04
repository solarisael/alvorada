import { ALBEDO_STATE_TO_CONTAINER } from "../data/albedo_taxonomy.js";

// Albedo entries lean toward the open, expansive states — the washed side.
// Where nigredo pushed "extreme" states to the right lane, albedo leans the
// quietest, most-settled states left and lets the more outward-reaching ones
// (wonder, hope, anticipation) take the right lane. Purely a layout cadence.
const REACHING_STATES = new Set(["wonder", "hope", "anticipation", "belonging"]);
const ALBEDO_PREVIEW_CHAR_LIMIT = 320;

function markdown_to_plain_text(markdown = "") {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[>*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function markdown_to_preview_text(markdown = "") {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[>*_~]/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, "").replace(/[ \t]+/g, " "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function albedo_body_to_preview_source(body = "") {
  return String(body)
    .split(/\n\s*\n/)
    .map((block) =>
      block.trim().startsWith("#") ? "" : markdown_to_preview_text(block),
    )
    .filter(Boolean)
    .join("\n\n");
}

function albedo_body_to_measure_text(body = "") {
  return String(body)
    .split(/\n\s*\n/)
    .map((block) =>
      block.trim().startsWith("#") ? "" : markdown_to_plain_text(block),
    )
    .filter(Boolean)
    .join("\n\n");
}

function truncate_preview(text, limit = ALBEDO_PREVIEW_CHAR_LIMIT) {
  const clean_text = String(text).trim();
  if (clean_text.length <= limit) return clean_text;

  return `${clean_text
    .slice(0, limit)
    .trimEnd()
    .replace(/[.,;:!?…-]+$/, "")}...`;
}

function derive_albedo_preview(data, body = "") {
  const source_text = albedo_body_to_preview_source(body) || data.excerpt || "";

  return truncate_preview(source_text);
}

function derive_albedo_excerpt(data) {
  return markdown_to_plain_text(data.excerpt ?? "");
}

function derive_albedo_align(states = []) {
  const primary_state = states[0];
  return REACHING_STATES.has(primary_state) ? "right" : "left";
}

function estimate_lines(text, chars_per_line) {
  const length = markdown_to_plain_text(text).length;
  return Math.max(1, Math.ceil(length / chars_per_line));
}

function estimate_albedo_entry_sizes({ body = "", excerpt = "", states = [] }) {
  const state_rows = Math.max(1, Math.ceil(states.length / 3));
  const mobile_state_rows = Math.max(1, Math.ceil(states.length / 2));
  const excerpt_lines = estimate_lines(excerpt, 74);
  const mobile_excerpt_lines = estimate_lines(excerpt, 42);
  const body_lines = estimate_lines(body, 74);
  const mobile_body_lines = estimate_lines(body, 42);

  return {
    collapsed_size: 82 + state_rows * 19 + excerpt_lines * 20,
    collapsed_size_mobile:
      96 + mobile_state_rows * 21 + mobile_excerpt_lines * 21,
    expanded_size: 92 + state_rows * 19 + body_lines * 24,
    expanded_size_mobile: 112 + mobile_state_rows * 21 + mobile_body_lines * 26,
  };
}

function derive_albedo_entry_view({ body = "", data, href, index = 0 }) {
  const states = data.states ?? [];
  const primary_state = states[0] ?? "calm";
  const primary_container =
    ALBEDO_STATE_TO_CONTAINER[primary_state] ?? "morning-dew";
  const title = data.title ?? null;
  const preview_source =
    albedo_body_to_preview_source(body) || data.excerpt || "";
  const body_text = albedo_body_to_measure_text(body);
  const excerpt = derive_albedo_excerpt(data);
  const preview = derive_albedo_preview(data, body);
  const size_estimates = estimate_albedo_entry_sizes({
    body,
    excerpt: preview,
    states,
  });

  return {
    slug: data.slug,
    title,
    // Albedo does not redact. Untitled entries fall back to the slug, gently
    // de-emphasized in CSS rather than masked.
    display_title: title ?? data.slug,
    title_untitled: !title,
    published_at: data.published_at,
    states,
    primary_state,
    primary_container,
    excerpt,
    preview,
    body_text,
    can_expand: preview_source.length > preview.length,
    featured: data.featured ?? false,
    href,
    align: derive_albedo_align(states, index),
    body_present: Boolean(String(body).trim()),
    ...size_estimates,
  };
}

export {
  derive_albedo_align,
  derive_albedo_entry_view,
  derive_albedo_excerpt,
  derive_albedo_preview,
  estimate_albedo_entry_sizes,
  markdown_to_plain_text,
  markdown_to_preview_text,
  albedo_body_to_measure_text,
  albedo_body_to_preview_source,
  ALBEDO_PREVIEW_CHAR_LIMIT,
};