import { describe, expect, test } from "bun:test";

import {
  parse_tag_identity,
  validate_scene_identity_consistency,
} from "../src/data/rubedo/scene_identity.js";

describe("rubedo scene identity validation", () => {
  test("accepts duplicated identity when fields and tags match", () => {
    const frontmatter = {
      book_slug: "absurd-faith",
      chapter_id: "af_000",
      thread_key: "cinza",
      thread_modifier: "core",
      tags: [
        "phase:rubedo",
        "book:absurd-faith",
        "chapter:af_000",
        "thread:cinza",
        "modifier:core",
      ],
    };

    const parsed_tag_identity = parse_tag_identity(frontmatter.tags);
    const identity_validation = validate_scene_identity_consistency({
      frontmatter,
      parsed_tag_identity,
    });

    expect(identity_validation.is_valid).toBe(true);
    expect(identity_validation.mismatched_pairs.length).toBe(0);
    expect(identity_validation.missing_pairs.length).toBe(0);
  });

  test("fails when duplicated identity diverges", () => {
    const frontmatter = {
      book_slug: "absurd-faith",
      chapter_id: "af_000",
      thread_key: "cinza",
      thread_modifier: "core",
      tags: [
        "phase:rubedo",
        "book:absurd-faith",
        "chapter:af_999",
        "thread:cinza",
        "modifier:core",
      ],
    };

    const parsed_tag_identity = parse_tag_identity(frontmatter.tags);
    const identity_validation = validate_scene_identity_consistency({
      frontmatter,
      parsed_tag_identity,
    });

    expect(identity_validation.is_valid).toBe(false);
    expect(identity_validation.mismatched_pairs.length).toBe(1);
    expect(identity_validation.mismatched_pairs[0].field_label).toBe(
      "chapter_id",
    );
  });
});
