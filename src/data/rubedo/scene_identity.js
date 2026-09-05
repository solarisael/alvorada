const normalize_identity_token = (raw_value = "") => {
  if (typeof raw_value !== "string") {
    return "";
  }

  return raw_value.trim().toLowerCase();
};

const parse_identity_tag = (raw_tag) => {
  if (typeof raw_tag !== "string") return null;
  const [raw_key, ...raw_value_parts] = raw_tag.split(":");
  const key = normalize_identity_token(raw_key);
  const value = normalize_identity_token(raw_value_parts.join(":"));
  if (!key || !value) return null;
  return { key, value };
};

const parse_tag_identity = (tag_values = []) => {
  const parsed_identity = {};
  for (const raw_tag of tag_values) {
    const tag = parse_identity_tag(raw_tag);
    if (tag) parsed_identity[tag.key] = tag.value;
  }
  return parsed_identity;
};

const required_identity_pairs = Object.freeze([
  Object.freeze({ field_label: "book_slug", tag_key: "book" }),
  Object.freeze({ field_label: "chapter_id", tag_key: "chapter" }),
  Object.freeze({ field_label: "thread_key", tag_key: "thread" }),
  Object.freeze({ field_label: "thread_modifier", tag_key: "modifier" }),
]);

const read_identity_token = (source, key) =>
  normalize_identity_token(source?.[key]);

const classify_identity_pair = (
  identity_pair,
  frontmatter,
  parsed_tag_identity,
) => {
  const field_value = read_identity_token(
    frontmatter,
    identity_pair.field_label,
  );
  const tag_value = read_identity_token(
    parsed_tag_identity,
    identity_pair.tag_key,
  );
  if (!field_value || !tag_value) return "missing";
  if (field_value !== tag_value) return "mismatched";
  return "matched";
};

const is_complete_rubedo_identity = (
  missing_pairs,
  mismatched_pairs,
  phase_value,
) => {
  return (
    missing_pairs.length === 0 &&
    mismatched_pairs.length === 0 &&
    phase_value === "rubedo"
  );
};

const validate_scene_identity_consistency = ({
  frontmatter = {},
  parsed_tag_identity = {},
}) => {
  const missing_pairs = [];
  const mismatched_pairs = [];

  for (const identity_pair of required_identity_pairs) {
    const status = classify_identity_pair(
      identity_pair,
      frontmatter,
      parsed_tag_identity,
    );
    if (status === "missing") {
      missing_pairs.push(identity_pair);
      continue;
    }
    if (status === "mismatched") {
      mismatched_pairs.push(identity_pair);
    }
  }

  const phase_value = normalize_identity_token(parsed_tag_identity?.phase);

  return {
    missing_pairs,
    mismatched_pairs,
    has_phase_tag: phase_value === "rubedo",
    is_valid: is_complete_rubedo_identity(
      missing_pairs,
      mismatched_pairs,
      phase_value,
    ),
  };
};

export {
  normalize_identity_token,
  parse_tag_identity,
  required_identity_pairs,
  validate_scene_identity_consistency,
};
