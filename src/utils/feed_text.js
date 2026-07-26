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

function body_to_preview_source(body = "") {
  return String(body)
    .split(/\n\s*\n/)
    .map((block) =>
      block.trim().startsWith("#") ? "" : markdown_to_preview_text(block),
    )
    .filter(Boolean)
    .join("\n\n");
}

function body_to_measure_text(body = "") {
  return String(body)
    .split(/\n\s*\n/)
    .map((block) =>
      block.trim().startsWith("#") ? "" : markdown_to_plain_text(block),
    )
    .filter(Boolean)
    .join("\n\n");
}

function truncate_preview(text, limit = 320) {
  const clean_text = String(text).trim();
  if (clean_text.length <= limit) return clean_text;

  return `${clean_text
    .slice(0, limit)
    .trimEnd()
    .replace(/[.,;:!?…-]+$/, "")}...`;
}

function estimate_lines(text, chars_per_line) {
  const length = markdown_to_plain_text(text).length;
  return Math.max(1, Math.ceil(length / chars_per_line));
}

function estimate_entry_sizes({ body = "", excerpt = "", states = [] }) {
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

export {
  body_to_measure_text,
  body_to_preview_source,
  estimate_entry_sizes,
  markdown_to_plain_text,
  markdown_to_preview_text,
  truncate_preview,
};
