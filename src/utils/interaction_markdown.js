// Build-time markdown transform for `{{ix:trigger:action:payload}}text{{/ix}}`
// — sibling of `{{fx:...}}` (text_effects_markdown.js), same remark pipeline
// position, same general tree-walking shape. Deliberately simpler: no
// stacking/intensity/blacklist system, since ix payload is a single
// trigger/action/payload triplet, not a composable effect stack.

import {
  IX_BASE_CLASS,
  parse_ix_descriptor,
} from "../../public/vendor/fx/js/contract.js";
import {
  escape_html,
  marker_candidate_from_child,
} from "./marker_tree_utils.js";

const escape_attribute = (raw_value) => escape_html(raw_value);

const emit_ix_sanitization_warning = (raw_descriptor, warn, warning_cache) => {
  if (typeof warn !== "function" || warning_cache.has(raw_descriptor)) {
    return;
  }

  warning_cache.add(raw_descriptor);
  warn(
    `{{ix:${raw_descriptor}}} is not a valid interaction descriptor ` +
      `("trigger:action:payload" — trigger \u2208 {hover, click}, ` +
      `action \u2208 {preview, reveal, fetch}); left as literal text.`,
  );
};

const build_ix_span_html = (
  descriptor,
  text_content,
  { door_href = null } = {},
) => {
  const attribute_value = `${descriptor.trigger}:${descriptor.action}:${descriptor.payload}`;
  const door_attribute = door_href
    ? ` data-ix-href="${escape_attribute(door_href)}"`
    : "";

  return (
    `<span class="${IX_BASE_CLASS}" data-ix="${escape_attribute(attribute_value)}"` +
    `${door_attribute}>${escape_html(text_content)}</span>`
  );
};

// Descriptor grammar also allows an optional trailing `|door_href` segment on
// the payload for word-meaning popups that want a "go deeper" link once
// pinned: {{ix:hover:preview:a lantern kept lit past its oil|/codex/lantern}}
const split_payload_and_door_href = (raw_payload) => {
  const pipe_index = raw_payload.indexOf("|");

  if (pipe_index === -1) {
    return { payload: raw_payload, door_href: null };
  }

  return {
    payload: raw_payload.slice(0, pipe_index),
    door_href: raw_payload.slice(pipe_index + 1).trim() || null,
  };
};

const parse_ix_marker_descriptor = (raw_descriptor) => {
  const descriptor = parse_ix_descriptor(raw_descriptor);

  if (!descriptor) {
    return null;
  }

  const { payload, door_href } = split_payload_and_door_href(
    descriptor.payload,
  );

  return { ...descriptor, payload, door_href };
};

const marker_regex = /\{\{ix:([^}]+)\}\}([\s\S]*?)\{\{\/ix\}\}/gi;

const open_marker_only_regex = /^\s*\{\{ix:([^}]+)\}\}\s*$/i;
const close_marker_only_regex = /^\s*\{\{\/ix\}\}\s*$/i;

const parse_open_marker_only = (raw_text) => {
  if (typeof raw_text !== "string") {
    return null;
  }

  const match = raw_text.match(open_marker_only_regex);

  if (!match) {
    return null;
  }

  return {
    raw_descriptor: match[1],
    descriptor: parse_ix_marker_descriptor(match[1]),
  };
};

const is_close_marker_only = (raw_text) => {
  return typeof raw_text === "string" && close_marker_only_regex.test(raw_text);
};

// Single text node containing one or more complete `{{ix:...}}...{{/ix}}`
// spans — splits into interleaved text/html mdast nodes.
const split_ix_markers = (raw_text = "", options = {}) => {
  const warning_cache =
    options.warning_cache instanceof Set ? options.warning_cache : new Set();
  const result_nodes = [];
  let cursor = 0;

  marker_regex.lastIndex = 0;

  for (const marker_match of raw_text.matchAll(marker_regex)) {
    const match_start = marker_match.index ?? 0;
    const match_end = match_start + marker_match[0].length;
    const raw_descriptor = marker_match[1];
    const inner_text = marker_match[2];

    if (match_start > cursor) {
      result_nodes.push({
        type: "text",
        value: raw_text.slice(cursor, match_start),
      });
    }

    const descriptor = parse_ix_marker_descriptor(raw_descriptor);

    if (!descriptor) {
      emit_ix_sanitization_warning(raw_descriptor, options.warn, warning_cache);
      result_nodes.push({ type: "text", value: marker_match[0] });
    } else {
      result_nodes.push({
        type: "html",
        value: build_ix_span_html(descriptor, inner_text, {
          door_href: descriptor.door_href,
        }),
      });
    }

    cursor = match_end;
  }

  if (!result_nodes.length) {
    return [];
  }

  if (cursor < raw_text.length) {
    result_nodes.push({ type: "text", value: raw_text.slice(cursor) });
  }

  return result_nodes;
};

const transform_ix_markers_in_tree = (tree_node, options = {}) => {
  if (!tree_node || !Array.isArray(tree_node.children)) {
    return;
  }

  const warning_cache =
    options.warning_cache instanceof Set ? options.warning_cache : new Set();
  const next_children = [];

  for (
    let child_index = 0;
    child_index < tree_node.children.length;
    child_index += 1
  ) {
    const child_node = tree_node.children[child_index];
    const marker_candidate = marker_candidate_from_child(child_node);

    if (!marker_candidate) {
      next_children.push(child_node);
      continue;
    }

    const open_marker = parse_open_marker_only(marker_candidate.text);

    if (open_marker) {
      if (!open_marker.descriptor) {
        emit_ix_sanitization_warning(
          open_marker.raw_descriptor,
          options.warn,
          warning_cache,
        );
        next_children.push(child_node);
        continue;
      }

      let close_marker_index = -1;

      for (
        let scan_index = child_index + 1;
        scan_index < tree_node.children.length;
        scan_index += 1
      ) {
        const scan_node = tree_node.children[scan_index];
        const scan_candidate = marker_candidate_from_child(scan_node);

        if (scan_candidate && is_close_marker_only(scan_candidate.text)) {
          close_marker_index = scan_index;
          break;
        }
      }

      if (close_marker_index > child_index) {
        const door_attribute = open_marker.descriptor.door_href
          ? ` data-ix-href="${escape_attribute(open_marker.descriptor.door_href)}"`
          : "";
        const attribute_value =
          `${open_marker.descriptor.trigger}:${open_marker.descriptor.action}:` +
          `${open_marker.descriptor.payload}`;

        next_children.push({
          type: "html",
          value: `<span class="${IX_BASE_CLASS}" data-ix="${escape_attribute(attribute_value)}"${door_attribute}>`,
        });

        for (
          let carry_index = child_index + 1;
          carry_index < close_marker_index;
          carry_index += 1
        ) {
          next_children.push(tree_node.children[carry_index]);
        }

        next_children.push({ type: "html", value: "</span>" });
        child_index = close_marker_index;
        continue;
      }
    }

    if (marker_candidate.source_kind !== "text") {
      next_children.push(child_node);
      continue;
    }

    const transformed_nodes = split_ix_markers(marker_candidate.text, {
      warn: options.warn,
      warning_cache,
    });

    if (transformed_nodes.length) {
      next_children.push(...transformed_nodes);
      continue;
    }

    next_children.push(child_node);
  }

  tree_node.children = next_children;

  for (const child_node of tree_node.children) {
    transform_ix_markers_in_tree(child_node, { ...options, warning_cache });
  }
};

export {
  build_ix_span_html,
  parse_ix_marker_descriptor,
  split_ix_markers,
  transform_ix_markers_in_tree,
};
