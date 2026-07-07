// Shared plumbing for the `{{fx:...}}` / `{{ix:...}}` build-time markdown
// marker transforms (text_effects_markdown.js, interaction_markdown.js).
// Both walk an mdast tree looking for open/close marker pairs that may
// land in the same text node or split across siblings; this is the part
// of that walk with zero marker-specific logic (fx has block/inline
// effect branching, ix doesn't — that divergence stays in each caller,
// not forced into a shared shape it doesn't fit).

const escape_html = (raw_value) => {
  return String(raw_value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

// A marker candidate is either a bare text node, or a paragraph whose only
// child is a bare text node (markdown wraps a lone line in a paragraph).
// Both shapes carry the same open/close marker scan; anything else (rich
// inline content, multiple children) isn't a candidate for holding a
// marker on its own.
const marker_candidate_from_child = (child_node) => {
  if (child_node?.type === "text" && typeof child_node.value === "string") {
    return { text: child_node.value, source_kind: "text" };
  }

  if (
    child_node?.type === "paragraph" &&
    Array.isArray(child_node.children) &&
    child_node.children.length === 1 &&
    child_node.children[0]?.type === "text" &&
    typeof child_node.children[0]?.value === "string"
  ) {
    return { text: child_node.children[0].value, source_kind: "paragraph" };
  }

  return null;
};

export { escape_html, marker_candidate_from_child };
