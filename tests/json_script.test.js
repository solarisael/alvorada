import { describe, expect, test } from "bun:test";
import { serialize_json_for_script } from "../src/utils/json_script.js";

describe("serialize_json_for_script", () => {
  test("preserves data while preventing script termination", () => {
    const value = {
      excerpt: "</script><script>alert('no')</script>",
      separators: "line\u2028paragraph\u2029end",
      symbols: "<&>",
    };

    const serialized = serialize_json_for_script(value);

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(serialized).not.toContain("\u2028");
    expect(serialized).not.toContain("\u2029");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
