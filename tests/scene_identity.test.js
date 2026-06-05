import { describe, expect, test } from "bun:test";

import {
  normalize_identity_token,
  parse_tag_identity,
  required_identity_pairs,
  validate_scene_identity_consistency,
} from "../src/data/rubedo/scene_identity.js";

describe("normalize_identity_token", () => {
  test("trims and lowercases a string", () => {
    expect(normalize_identity_token("  Absurd-Faith  ")).toBe("absurd-faith");
  });

  test("returns empty string for non-string or empty input", () => {
    expect(normalize_identity_token(undefined)).toBe("");
    expect(normalize_identity_token(null)).toBe("");
    expect(normalize_identity_token(42)).toBe("");
    expect(normalize_identity_token("")).toBe("");
    expect(normalize_identity_token("   ")).toBe("");
  });
});

describe("parse_tag_identity", () => {
  test("parses key:value tags into a normalized identity map", () => {
    const identity = parse_tag_identity([
      "book:Absurd-Faith",
      "chapter:AF_000",
      "thread:Cinza",
      "modifier:Core",
      "phase:rubedo",
    ]);

    expect(identity).toEqual({
      book: "absurd-faith",
      chapter: "af_000",
      thread: "cinza",
      modifier: "core",
      phase: "rubedo",
    });
  });

  test("rejoins values that themselves contain colons", () => {
    const identity = parse_tag_identity(["ref:https://example.com/x"]);
    expect(identity.ref).toBe("https://example.com/x");
  });

  test("skips tags with no key or no value, and non-string entries", () => {
    const identity = parse_tag_identity([
      "book:af",
      "novalue:",
      ":novalue",
      "plain",
      42,
      null,
    ]);

    expect(identity).toEqual({ book: "af" });
  });

  test("returns an empty object for an empty or missing tag list", () => {
    expect(parse_tag_identity([])).toEqual({});
    expect(parse_tag_identity()).toEqual({});
  });
});

describe("validate_scene_identity_consistency", () => {
  const valid_frontmatter = {
    book_slug: "absurd-faith",
    chapter_id: "af_000",
    thread_key: "cinza",
    thread_modifier: "core",
  };
  const valid_tags = {
    book: "absurd-faith",
    chapter: "af_000",
    thread: "cinza",
    modifier: "core",
    phase: "rubedo",
  };

  test("a fully consistent scene with the rubedo phase tag is valid", () => {
    const result = validate_scene_identity_consistency({
      frontmatter: valid_frontmatter,
      parsed_tag_identity: valid_tags,
    });

    expect(result.is_valid).toBe(true);
    expect(result.has_phase_tag).toBe(true);
    expect(result.missing_pairs).toEqual([]);
    expect(result.mismatched_pairs).toEqual([]);
  });

  test("missing the phase:rubedo tag invalidates an otherwise consistent scene", () => {
    const { phase, ...tags_without_phase } = valid_tags;
    const result = validate_scene_identity_consistency({
      frontmatter: valid_frontmatter,
      parsed_tag_identity: tags_without_phase,
    });

    expect(result.has_phase_tag).toBe(false);
    expect(result.is_valid).toBe(false);
  });

  test("a field present in frontmatter but absent in tags is a missing pair", () => {
    const { chapter, ...tags_missing_chapter } = valid_tags;
    const result = validate_scene_identity_consistency({
      frontmatter: valid_frontmatter,
      parsed_tag_identity: tags_missing_chapter,
    });

    expect(result.is_valid).toBe(false);
    expect(result.missing_pairs.map((pair) => pair.tag_key)).toContain(
      "chapter",
    );
  });

  test("a field/tag disagreement is a mismatched pair, not a missing one", () => {
    const result = validate_scene_identity_consistency({
      frontmatter: { ...valid_frontmatter, thread_key: "suul" },
      parsed_tag_identity: valid_tags,
    });

    expect(result.is_valid).toBe(false);
    expect(result.mismatched_pairs.map((pair) => pair.tag_key)).toContain(
      "thread",
    );
    expect(result.missing_pairs).toEqual([]);
  });

  test("an empty scene reports all four pairs missing and no phase tag", () => {
    const result = validate_scene_identity_consistency({
      frontmatter: {},
      parsed_tag_identity: {},
    });

    expect(result.has_phase_tag).toBe(false);
    expect(result.is_valid).toBe(false);
    expect(result.missing_pairs).toHaveLength(required_identity_pairs.length);
  });
});
