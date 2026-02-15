const normalize_identity_token = (raw_value = "") => {
  if (typeof raw_value !== "string") {
    return "";
  }

  return raw_value.trim().toLowerCase();
};

const parse_tag_identity = (tag_values = []) => {
  const parsed_identity = {};

  for (const raw_tag of tag_values) {
    if (typeof raw_tag !== "string") {
      continue;
    }

    const [raw_key, ...raw_value_parts] = raw_tag.split(":");
    const tag_key = normalize_identity_token(raw_key);
    const tag_value = normalize_identity_token(raw_value_parts.join(":"));

    if (!tag_key || !tag_value) {
      continue;
    }

    parsed_identity[tag_key] = tag_value;
  }

  return parsed_identity;
};

const required_identity_pairs = Object.freeze([
  Object.freeze({ field_label: "book_slug", tag_key: "book" }),
  Object.freeze({ field_label: "chapter_id", tag_key: "chapter" }),
  Object.freeze({ field_label: "thread_key", tag_key: "thread" }),
  Object.freeze({ field_label: "thread_modifier", tag_key: "modifier" }),
]);

const validate_scene_identity_consistency = ({
  frontmatter = {},
  parsed_tag_identity = {},
}) => {
  const missing_pairs = [];
  const mismatched_pairs = [];

  for (const identity_pair of required_identity_pairs) {
    const field_value = normalize_identity_token(
      frontmatter?.[identity_pair.field_label],
    );
    const tag_value = normalize_identity_token(
      parsed_tag_identity?.[identity_pair.tag_key],
    );

    if (!field_value || !tag_value) {
      missing_pairs.push(identity_pair);
      continue;
    }

    if (field_value !== tag_value) {
      mismatched_pairs.push(identity_pair);
    }
  }

  const phase_value = normalize_identity_token(parsed_tag_identity?.phase);

  return {
    missing_pairs,
    mismatched_pairs,
    has_phase_tag: phase_value === "rubedo",
    is_valid:
      missing_pairs.length === 0 &&
      mismatched_pairs.length === 0 &&
      phase_value === "rubedo",
  };
};

export {
  normalize_identity_token,
  parse_tag_identity,
  required_identity_pairs,
  validate_scene_identity_consistency,
};
