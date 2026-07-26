import { describe, expect, test } from "bun:test";

import {
  derive_albedo_entry_view,
  markdown_to_plain_text,
  albedo_body_to_measure_text,
} from "../src/utils/albedo_feed.js";
import {
  entry_matches_states,
  filter_entries,
  toggle_container_states,
} from "../src/scripts/albedo_archive.js";

describe("albedo feed helpers", () => {
  test("filters entries by any active state", () => {
    const entries = [
      { slug: "a", states: ["calm", "hope"] },
      { slug: "b", states: ["still"] },
      { slug: "c", states: ["wonder"] },
    ];

    expect(filter_entries(entries, new Set(["wonder", "hope"]))).toEqual([
      entries[0],
      entries[2],
    ]);
  });

  test("empty filters and grouped toggles preserve the filter contract", () => {
    const active_states = new Set(["calm"]);

    expect(entry_matches_states(["still"], new Set())).toBe(true);
    expect(toggle_container_states(active_states, ["calm", "hope"])).toBe(
      true,
    );
    expect([...active_states].sort()).toEqual(["calm", "hope"]);

    expect(toggle_container_states(active_states, ["calm", "hope"])).toBe(
      false,
    );
    expect([...active_states]).toEqual([]);
  });

  test("derives an unredacted view with phase-specific alignment", () => {
    const view = derive_albedo_entry_view({
      body: "# Heading\n\nThere are gardens beneath the ice.",
      data: {
        slug: "morning-garden",
        published_at: "2026-06-01",
        states: ["wonder", "calm"],
        excerpt: "A quiet opening.",
      },
      href: "/albedo/morning-garden",
    });

    expect(view.display_title).toBe("morning-garden");
    expect(view.title_untitled).toBe(true);
    expect(view.primary_container).toBe("dawn-light");
    expect(view.align).toBe("right");
    expect(view.excerpt).toBe("A quiet opening.");
    expect(view.preview).toBe("There are gardens beneath the ice.");
    expect(view.can_expand).toBe(false);
  });

  test("shared markdown and measurement algorithms preserve feed paragraphs", () => {
    expect(markdown_to_plain_text("**one** [cup](/x) `first`")).toBe(
      "one cup first",
    );
    expect(albedo_body_to_measure_text("# Title\n\nOne.\n\nTwo.")).toBe(
      "One.\n\nTwo.",
    );
  });
});
