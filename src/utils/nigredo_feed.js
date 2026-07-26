import {
  body_to_measure_text,
  body_to_preview_source,
  estimate_entry_sizes,
  markdown_to_plain_text,
  markdown_to_preview_text,
  truncate_preview,
} from "./feed_text.js";
import { NIGREDO_STATE_TO_CONTAINER } from "../data/nigredo_taxonomy.js";

const EXTREME_STATES = new Set(["charon", "rage", "panic", "angst"]);
const NIGREDO_PREVIEW_CHAR_LIMIT = 320;

function redact_length(slug) {
  let hash = 0;
  for (let index = 0; index < slug.length; index++) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }
  return 4 + (hash % 9);
}

function nigredo_body_to_preview_source(body = "") {
  return body_to_preview_source(body);
}

function nigredo_body_to_measure_text(body = "") {
  return body_to_measure_text(body);
}
function derive_nigredo_preview(data, body = "") {
  const source_text =
    nigredo_body_to_preview_source(body) || data.excerpt || "";

  return truncate_preview(source_text, NIGREDO_PREVIEW_CHAR_LIMIT);
}

function derive_nigredo_excerpt(data) {
  return markdown_to_plain_text(data.excerpt ?? "");
}

function derive_nigredo_align(states = []) {
  const primary_state = states[0];
  return EXTREME_STATES.has(primary_state) ? "right" : "left";
}

function estimate_nigredo_entry_sizes(options) {
  return estimate_entry_sizes(options);
}

function derive_nigredo_entry_view({ body = "", data, href, index = 0 }) {
  const states = data.states ?? [];
  const primary_state = states[0] ?? "acedia";
  const primary_container =
    NIGREDO_STATE_TO_CONTAINER[primary_state] ?? "cinder";
  const title = data.title ?? null;
  const preview_source =
    nigredo_body_to_preview_source(body) || data.excerpt || "";
  const excerpt = derive_nigredo_excerpt(data);
  const preview = derive_nigredo_preview(data, body);
  const size_estimates = estimate_nigredo_entry_sizes({
    body,
    excerpt: preview,
    states,
  });

  return {
    slug: data.slug,
    title,
    display_title: title ?? "■".repeat(redact_length(data.slug)),
    title_redacted: !title,
    published_at: data.published_at,
    states,
    primary_container,
    excerpt,
    preview,
    can_expand: preview_source.length > preview.length,
    featured: data.featured ?? false,
    href,
    align: derive_nigredo_align(states, index),
    ...size_estimates,
  };
}

export {
  derive_nigredo_align,
  derive_nigredo_entry_view,
  derive_nigredo_excerpt,
  derive_nigredo_preview,
  estimate_nigredo_entry_sizes,
  markdown_to_plain_text,
  markdown_to_preview_text,
  nigredo_body_to_measure_text,
  nigredo_body_to_preview_source,
  NIGREDO_PREVIEW_CHAR_LIMIT,
  redact_length,
};
