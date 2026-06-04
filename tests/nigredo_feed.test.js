import { describe, expect, test } from "bun:test";

import {
  entry_matches_states,
  filter_entries,
  toggle_container_states,
} from "../src/scripts/nigredo_archive.js";
import {
  derive_nigredo_entry_view,
  markdown_to_plain_text,
  markdown_to_preview_text,
  nigredo_body_to_measure_text,
  NIGREDO_PREVIEW_CHAR_LIMIT,
  redact_length,
} from "../src/utils/nigredo_feed.js";

describe("nigredo feed helpers", () => {
  test("filters entries by any active state", () => {
    const entries = [
      { slug: "a", states: ["grief", "hunger"] },
      { slug: "b", states: ["numb"] },
      { slug: "c", states: ["panic"] },
    ];

    expect(filter_entries(entries, new Set(["panic", "hunger"]))).toEqual([
      entries[0],
      entries[2],
    ]);
  });

  test("empty filters match every entry", () => {
    expect(entry_matches_states(["shame"], new Set())).toBe(true);
  });

  test("container labels toggle every state in their group", () => {
    const active_states = new Set(["grief"]);

    expect(toggle_container_states(active_states, ["grief", "hunger"])).toBe(
      true,
    );
    expect([...active_states].sort()).toEqual(["grief", "hunger"]);

    expect(toggle_container_states(active_states, ["grief", "hunger"])).toBe(
      false,
    );
    expect([...active_states]).toEqual([]);
  });

  test("derives static card view from frontmatter and body", () => {
    const view = derive_nigredo_entry_view({
      body: "# Heading\n\nThere are gardens beneath the ice.",
      data: {
        slug: "god-please",
        published_at: "2026-06-01",
        states: ["panic", "grief"],
        excerpt: "Let me get through this.",
      },
      href: "/nigredo/god-please",
    });

    expect(view.display_title).toBe("■".repeat(redact_length("god-please")));
    expect(view.title_redacted).toBe(true);
    expect(view.primary_container).toBe("smoke");
    expect(view.align).toBe("right");
    expect(view.excerpt).toBe("Let me get through this.");
    expect(view.preview).toBe("There are gardens beneath the ice.");
    expect(view.can_expand).toBe(false);
    expect(view.body_present).toBe(true);
  });

  test("body preview is truncated for feed cards", () => {
    const body = `one ${"long ".repeat(NIGREDO_PREVIEW_CHAR_LIMIT)}`;
    const view = derive_nigredo_entry_view({
      body,
      data: {
        title: "Long one",
        slug: "long-one",
        published_at: "2026-06-01",
        states: ["dread"],
      },
      href: "/nigredo/long-one",
    });

    expect(view.preview.endsWith("...")).toBe(true);
    expect(view.preview.length).toBeLessThan(body.length);
    expect(view.can_expand).toBe(true);
  });

  test("truncated preview does not double ellipses", () => {
    const body = `${"x".repeat(NIGREDO_PREVIEW_CHAR_LIMIT - 2)} … trailing`;
    const view = derive_nigredo_entry_view({
      body,
      data: {
        title: "Ellipsis",
        slug: "ellipsis",
        published_at: "2026-06-01",
        states: ["dread"],
      },
      href: "/nigredo/ellipsis",
    });

    expect(view.preview.endsWith("…...")).toBe(false);
    expect(view.preview.endsWith("...")).toBe(true);
  });

  test("markdown preview text strips links and emphasis", () => {
    expect(markdown_to_plain_text("**one** [cup](/x) `first`")).toBe(
      "one cup first",
    );
  });

  test("preview text preserves author breaks", () => {
    const body = "One line.  \nSecond line.\n\n**Third** paragraph.";

    expect(markdown_to_preview_text(body)).toBe(
      "One line.\nSecond line.\n\nThird paragraph.",
    );
  });

  test("body measurement text preserves paragraph breaks", () => {
    expect(nigredo_body_to_measure_text("# Title\n\nOne.\n\nTwo.")).toBe(
      "One.\n\nTwo.",
    );
  });
});
