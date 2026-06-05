import { describe, expect, test } from "bun:test";

import { derive_chapter_slug } from "../src/data/rubedo/chapter_slug.js";

// Note: book_timeline_runtime.js itself welds import.meta.glob at module load
// (a Vite/build construct), so it is exercised by the build, not Bun. The pure
// slug logic lives in chapter_slug.js precisely so it can be tested here in
// isolation — the same testability seam the shared book/ core uses.
describe("derive_chapter_slug", () => {
  test("zero-pads to a minimum of three digits", () => {
    expect(derive_chapter_slug(0)).toBe("000");
    expect(derive_chapter_slug(7)).toBe("007");
    expect(derive_chapter_slug(42)).toBe("042");
    expect(derive_chapter_slug(100)).toBe("100");
    expect(derive_chapter_slug(1000)).toBe("1000");
  });

  test("floors fractional positions and clamps negatives to zero", () => {
    expect(derive_chapter_slug(3.9)).toBe("003");
    expect(derive_chapter_slug(-5)).toBe("000");
  });

  test("defaults to 000 when called with no argument", () => {
    expect(derive_chapter_slug()).toBe("000");
  });
});
