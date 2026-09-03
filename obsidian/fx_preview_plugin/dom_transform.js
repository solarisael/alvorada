// dom_transform.js — DOM-side fx marker transform for the Obsidian reading
// view. The grammar, refusals, and HTML shapes all come from the site parser
// (src/utils/text_effects_markdown.js); this file only walks DOM. Parity rule
// (coding lesson 181): anything the site leaves literal stays literal here —
// a refused marker is visible text, never a half-applied effect.

import { TEXT_FX_INLINE_BLOCK_EFFECT_NAMES } from "../../public/vendor/fx/js/contract.js";
import {
  build_block_fx_open_html,
  build_text_fx_span_html,
  find_next_text_fx_open_marker,
  is_close_marker_only,
  marker_boundary_regex,
  parse_marker_effect_descriptor,
  parse_open_marker_only,
  split_text_fx_markers,
  text_fx_block_effect_names,
} from "../../src/utils/text_effects_markdown.js";

const MARKER_HINT = "{{fx:";
const HIDDEN_MARKER_CLASS = "sol__fx_marker_hidden";
const SKIP_SELECTOR = "code, pre";
const SHOW_TEXT = 4; // NodeFilter.SHOW_TEXT

const descriptor_span_options = (descriptor) => ({
  visual_intensity: descriptor.visual_intensity,
  motion_intensity: descriptor.motion_intensity,
  speed_intensity: descriptor.speed_intensity,
  color: descriptor.color,
  effect_settings: descriptor.effect_settings,
});

const is_inline_stack_effect = (effect_name) => {
  return (
    !text_fx_block_effect_names.includes(effect_name) ||
    TEXT_FX_INLINE_BLOCK_EFFECT_NAMES.includes(effect_name)
  );
};

const descriptor_is_inline = (descriptor) => {
  const [first_effect] = descriptor.effect_names;
  const is_single_block_effect =
    descriptor.effect_names.length === 1 &&
    text_fx_block_effect_names.includes(first_effect) &&
    !TEXT_FX_INLINE_BLOCK_EFFECT_NAMES.includes(first_effect);

  if (is_single_block_effect) {
    return false;
  }

  return descriptor.effect_names.every(is_inline_stack_effect);
};

const collect_marker_text_nodes = (root) => {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, SHOW_TEXT);
  const text_nodes = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;

    if (parent && parent.closest(SKIP_SELECTOR)) {
      continue;
    }

    text_nodes.push(node);
  }

  return text_nodes;
};

const html_to_fragment = (doc, html) => {
  const template = doc.createElement("template");
  template.innerHTML = html;
  return template.content;
};

// Pass A — marker pairs fully contained in one text node. The site's own
// splitter does all the work; we only translate its node list into DOM.
const split_markers_in_text_node = (text_node) => {
  const raw_text = text_node.nodeValue ?? "";

  if (!raw_text.includes(MARKER_HINT)) {
    return;
  }

  const output_nodes = split_text_fx_markers(raw_text);

  if (!output_nodes.some((node) => node.type === "html")) {
    return;
  }

  const doc = text_node.ownerDocument;
  const fragment = doc.createDocumentFragment();

  for (const node of output_nodes) {
    if (node.type === "html") {
      fragment.append(html_to_fragment(doc, node.value));
    } else {
      fragment.append(doc.createTextNode(node.value));
    }
  }

  text_node.replaceWith(fragment);
};

const boundary_matches = (text) => {
  const matches = [];
  marker_boundary_regex.lastIndex = 0;

  for (const match of text.matchAll(marker_boundary_regex)) {
    matches.push({
      is_open: match[1] !== undefined,
      index: match.index ?? 0,
      length: match[0].length,
    });
  }

  return matches;
};

// Pass B — one inline marker pair split across sibling nodes inside a block
// (open in one text node, close in a later one, formatting elements between).
// Range extraction handles boundaries that cross inline elements.
const find_cross_node_pair = (text_nodes) => {
  for (let open_index = 0; open_index < text_nodes.length; open_index += 1) {
    const open_text = text_nodes[open_index].nodeValue ?? "";

    if (!open_text.includes(MARKER_HINT)) {
      continue;
    }

    let search_from = 0;

    while (search_from < open_text.length) {
      const open_marker = find_next_text_fx_open_marker(open_text, search_from);

      if (!open_marker) {
        break;
      }

      search_from = open_marker.end_index;
      const descriptor = parse_marker_effect_descriptor(
        open_marker.raw_descriptor,
      );

      if (!descriptor || !descriptor_is_inline(descriptor)) {
        continue; // refusal: the raw marker stays visible
      }

      let depth = 1;

      for (
        let close_index = open_index;
        close_index < text_nodes.length;
        close_index += 1
      ) {
        const close_text = text_nodes[close_index].nodeValue ?? "";
        const from =
          close_index === open_index ? open_marker.end_index : 0;

        for (const match of boundary_matches(close_text.slice(from))) {
          if (match.is_open) {
            depth += 1;
            continue;
          }

          depth -= 1;

          if (depth === 0) {
            if (close_index === open_index) {
              // A same-node pair belongs to Pass A; reaching here means the
              // splitter refused it, so honor the refusal.
              break;
            }

            return {
              descriptor,
              open_node: text_nodes[open_index],
              open_marker,
              close_node: text_nodes[close_index],
              close_start: from + match.index,
              close_end: from + match.index + match.length,
            };
          }
        }

        if (depth === 0) {
          break;
        }
      }
    }
  }

  return null;
};

const wrap_cross_node_pair = (pair) => {
  const doc = pair.open_node.ownerDocument;
  const shell_html = build_text_fx_span_html(
    pair.descriptor.effect_names,
    "",
    descriptor_span_options(pair.descriptor),
  );

  if (!shell_html) {
    return false;
  }

  const span = html_to_fragment(doc, shell_html).firstElementChild;

  if (!span) {
    return false;
  }

  const range = doc.createRange();
  range.setStart(pair.open_node, pair.open_marker.end_index);
  range.setEnd(pair.close_node, pair.close_start);
  span.append(range.extractContents());
  range.insertNode(span);

  pair.open_node.deleteData(
    pair.open_marker.index,
    pair.open_marker.end_index - pair.open_marker.index,
  );
  pair.close_node.deleteData(0, pair.close_end - pair.close_start);
  return true;
};

const transform_fx_in_element = (root) => {
  if (!root || !(root.textContent ?? "").includes(MARKER_HINT)) {
    return;
  }

  for (const text_node of collect_marker_text_nodes(root)) {
    split_markers_in_text_node(text_node);
  }

  for (let guard = 0; guard < 64; guard += 1) {
    const pair = find_cross_node_pair(collect_marker_text_nodes(root));

    if (!pair || !wrap_cross_node_pair(pair)) {
      break;
    }

    for (const text_node of collect_marker_text_nodes(root)) {
      split_markers_in_text_node(text_node);
    }
  }
};

// Pass C — paragraph-spanning markers: a block whose entire text is an open
// marker pairs with a later close-only block; everything between receives the
// effect. Idempotent: re-derived from the (hidden) marker blocks every pass,
// so progressively rendered sections heal on the next call.
// enough: classes are applied per intermediate block instead of one wrapper
// div, so box-chrome block effects repeat their frame per paragraph; a real
// wrapper is the way up if that ever matters (Obsidian owns these divs).
const block_open_descriptor = (block_el) => {
  const text = (block_el.textContent ?? "").trim();

  if (!text.startsWith("{{")) {
    return null;
  }

  return parse_open_marker_only(text);
};

const shell_html_for_block_pair = (descriptor) => {
  const [first_effect] = descriptor.effect_names;
  const is_block_effect =
    descriptor.effect_names.length === 1 &&
    text_fx_block_effect_names.includes(first_effect);

  if (is_block_effect) {
    return build_block_fx_open_html(first_effect, {
      visual_intensity: descriptor.visual_intensity,
      motion_intensity: descriptor.motion_intensity,
      speed_intensity: descriptor.speed_intensity,
    });
  }

  if (!descriptor.effect_names.every(is_inline_stack_effect)) {
    return null;
  }

  return build_text_fx_span_html(
    descriptor.effect_names,
    "",
    descriptor_span_options(descriptor),
  );
};

const apply_shell_to_element = (element, shell_html) => {
  const shell = html_to_fragment(element.ownerDocument, shell_html)
    .firstElementChild;

  if (!shell) {
    return;
  }

  for (const class_name of shell.classList) {
    element.classList.add(class_name);
  }

  for (const attribute of shell.attributes) {
    if (attribute.name === "class") {
      continue;
    }

    if (attribute.name === "style") {
      element.style.cssText += ";" + attribute.value;
      continue;
    }

    element.setAttribute(attribute.name, attribute.value);
  }
};

const pair_block_fx_sections = (sizer) => {
  const children = Array.from(sizer.children);

  for (let open_index = 0; open_index < children.length; open_index += 1) {
    const descriptor = block_open_descriptor(children[open_index]);

    if (!descriptor) {
      continue;
    }

    const shell_html = shell_html_for_block_pair(descriptor);

    if (!shell_html) {
      continue; // refusal: markers stay visible
    }

    let close_index = -1;

    for (let scan = open_index + 1; scan < children.length; scan += 1) {
      if (is_close_marker_only((children[scan].textContent ?? "").trim())) {
        close_index = scan;
        break;
      }
    }

    if (close_index < 0) {
      continue; // close not rendered yet: leave the open marker visible
    }

    children[open_index].classList.add(HIDDEN_MARKER_CLASS);
    children[close_index].classList.add(HIDDEN_MARKER_CLASS);

    for (let between = open_index + 1; between < close_index; between += 1) {
      apply_shell_to_element(children[between], shell_html);
    }

    open_index = close_index;
  }
};

export { pair_block_fx_sections, transform_fx_in_element };
