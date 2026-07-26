import {
  body_to_measure_text,
  body_to_preview_source,
  estimate_entry_sizes,
  markdown_to_plain_text,
  markdown_to_preview_text,
  truncate_preview,
} from "./feed_text.js";
import { ALBEDO_STATE_TO_CONTAINER } from "../data/albedo_taxonomy.js";

// Albedo entries lean toward the open, expansive states — the washed side.
// Where nigredo pushed "extreme" states to the right lane, albedo leans the
// quietest, most-settled states left and lets the more outward-reaching ones
// (wonder, hope, anticipation) take the right lane. Purely a layout cadence.
const REACHING_STATES = new Set(["wonder", "hope", "anticipation", "belonging"]);
const ALBEDO_PREVIEW_CHAR_LIMIT = 320;

function albedo_body_to_preview_source(body = "") {
  return body_to_preview_source(body);
}

function albedo_body_to_measure_text(body = "") {
  return body_to_measure_text(body);
}
function derive_albedo_preview(data, body = "") {
  const source_text = albedo_body_to_preview_source(body) || data.excerpt || "";

  return truncate_preview(source_text, ALBEDO_PREVIEW_CHAR_LIMIT);
}

function derive_albedo_excerpt(data) {
  return markdown_to_plain_text(data.excerpt ?? "");
}

function derive_albedo_align(states = []) {
  const primary_state = states[0];
  return REACHING_STATES.has(primary_state) ? "right" : "left";
}

function estimate_albedo_entry_sizes(options) {
  return estimate_entry_sizes(options);
}

function derive_albedo_entry_view({ body = "", data, href, index = 0 }) {
  const states = data.states ?? [];
  const primary_state = states[0] ?? "calm";
  const primary_container =
    ALBEDO_STATE_TO_CONTAINER[primary_state] ?? "morning-dew";
  const title = data.title ?? null;
  const preview_source =
    albedo_body_to_preview_source(body) || data.excerpt || "";
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
    primary_container,
    excerpt,
    preview,
    can_expand: preview_source.length > preview.length,
    featured: data.featured ?? false,
    href,
    align: derive_albedo_align(states, index),
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