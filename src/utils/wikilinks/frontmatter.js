const FRONTMATTER_BLOCK_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const EXCERPT_MAX_CHARS = 240;

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

const parse_scalar_value = (value) => {
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((token) => unquote_yaml_scalar(token.trim()))
      .filter(Boolean);
  }
  return unquote_yaml_scalar(value);
};
const parse_frontmatter_line = (out, active_array_key, raw_line) => {
  if (!raw_line.trim()) return null;
  const array_item_match = raw_line.match(/^\s+-\s+(.*)$/);
  if (active_array_key && array_item_match) {
    const arr = out[active_array_key] || [];
    arr.push(unquote_yaml_scalar(array_item_match[1]));
    out[active_array_key] = arr;
    return active_array_key;
  }
  const scalar_match = raw_line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/);
  if (!scalar_match) return null;
  const [, key, raw_value] = scalar_match;
  const value = raw_value.trim();
  if (!value) {
    out[key] = [];
    return key;
  }
  out[key] = parse_scalar_value(value);
  return null;
};
const parse_simple_frontmatter = (raw_body) => {
  if (typeof raw_body !== "string") return null;
  const block_match = raw_body.match(FRONTMATTER_BLOCK_RE);
  if (!block_match) return null;
  const out = {};
  let active_array_key = null;
  for (const raw_line of block_match[1].split(/\r?\n/)) {
    active_array_key = parse_frontmatter_line(out, active_array_key, raw_line);
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

export {
  parse_simple_frontmatter,
  clamp_excerpt,
  extract_first_paragraph,
  titlecase_filename_stem,
};
