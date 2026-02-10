import { describe, expect, test } from "bun:test";

import {
  normalize_text_fx_token,
  resolve_text_fx_class,
  split_text_fx_tokens,
} from "../public/js/modules/text_effects.js";
import {
  normalize_text_fx_name,
  split_text_fx_markers,
} from "../src/utils/text_effects_markdown.js";

describe("text_effects runtime normalization", () => {
  test("normalizes legacy and canonical effect tokens", () => {
    expect(normalize_text_fx_token("glow")).toBe("glow");
    expect(normalize_text_fx_token("fx-glow")).toBe("glow");
    expect(normalize_text_fx_token("text_fx_glow")).toBe("glow");
    expect(normalize_text_fx_token("unknown")).toBeNull();
  });

  test("resolves effect class from token", () => {
    expect(resolve_text_fx_class("neon")).toBe("text_fx_neon");
    expect(resolve_text_fx_class("fx-neon")).toBe("text_fx_neon");
    expect(resolve_text_fx_class("bad-token")).toBeNull();
  });

  test("splits token lists from data attributes", () => {
    expect(split_text_fx_tokens("glow, neon|flicker")).toEqual([
      "glow",
      "neon",
      "flicker",
    ]);
  });
});

describe("text_effects markdown marker processing", () => {
  test("normalizes marker effect aliases", () => {
    expect(normalize_text_fx_name("glow")).toBe("glow");
    expect(normalize_text_fx_name("fx_glow")).toBe("glow");
    expect(normalize_text_fx_name("text_fx_glow")).toBe("glow");
  });

  test("converts marker syntax to html node payload", () => {
    const nodes = split_text_fx_markers("before {{fx:glow}}sigil{{/fx}} after");

    expect(nodes).toEqual([
      { type: "text", value: "before " },
      {
        type: "html",
        value: '<span class="text_fx text_fx_glow">sigil</span>',
      },
      { type: "text", value: " after" },
    ]);
  });

  test("keeps unknown marker syntax as plain text", () => {
    const nodes = split_text_fx_markers("{{fx:unknown}}x{{/fx}}");

    expect(nodes).toEqual([{ type: "text", value: "{{fx:unknown}}x{{/fx}}" }]);
  });
});
