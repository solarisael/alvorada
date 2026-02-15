import { describe, expect, test } from "bun:test";

import {
  default_thread_key,
  default_thread_modifier,
  resolve_book_view_state,
} from "../src/utils/timeline_threads.js";

const absurd_faith_timeline = {
  book_slug: "absurd-faith",
  title: "Absurd Faith",
  synopsis: "Timeline test fixture",
  chapters: [
    {
      chapter_id: "af_000",
      timeline_position: 0,
      title: "Awakening",
      chapter_description:
        "Cinza opens his eyes inside stone silence, with no memory and too much unease.",
      chapter_snippet:
        "Morning arrives carefully, as if the world is afraid to startle him.",
      scenes: [
        {
          thread_key: "cinza",
          thread_modifier: "core",
          scene_title: "Cinza Wakes",
        },
        {
          thread_key: "suul",
          thread_modifier: "core",
          scene_title: "Suul Watches",
        },
      ],
    },
    {
      chapter_id: "af_001",
      timeline_position: 1,
      title: "Edge of the Cliff",
      chapter_description:
        "Awe and panic collide as Cinza sees the scale of the world and the depth below.",
      chapter_snippet:
        "A cliff can look like freedom until you need to climb down alive.",
      scenes: [
        {
          thread_key: "cinza",
          thread_modifier: "core",
          scene_title: "Cinza at the Ledge",
        },
        {
          thread_key: "cinza",
          thread_modifier: "memory",
          scene_title: "Cinza Memory Echo",
          chapter_description_override:
            "A memory echo reframes the cliff as threshold, not dead end.",
        },
        {
          thread_key: "alvorada",
          thread_modifier: "core",
          scene_title: "Alvorada Thread",
          chapter_title_override: "Collapse Signatures",
          chapter_snippet_override:
            "The mountain is not a place here; it is a warning mapped in light.",
        },
      ],
    },
    {
      chapter_id: "af_002",
      timeline_position: 2,
      title: "First Descent",
      chapter_description:
        "Decision hardens into movement as Cinza commits to the unknown path down.",
      chapter_snippet:
        "No map, no certainty, only one last attempt that still counts.",
      scenes: [
        {
          thread_key: "cinza",
          thread_modifier: "core",
          scene_title: "Cinza Begins",
        },
        {
          thread_key: "suul",
          thread_modifier: "core",
          scene_title: "Suul Response",
          chapter_description_override:
            "Suul records the descent as both risk event and miracle window.",
        },
      ],
    },
  ],
};

describe("timeline thread resolver", () => {
  test("falls back to first chapter and cinza/core on invalid input", () => {
    const resolved_state = resolve_book_view_state(absurd_faith_timeline, {
      chapter_id: "missing_chapter",
      thread_key: "missing_thread",
      thread_modifier: "missing_modifier",
    });

    expect(resolved_state.chapter_id).toBe("af_000");
    expect(resolved_state.requested_thread_key).toBe(default_thread_key);
    expect(resolved_state.requested_thread_modifier).toBe(
      default_thread_modifier,
    );
    expect(resolved_state.resolved_thread_key).toBe("cinza");
    expect(resolved_state.resolved_thread_modifier).toBe("core");
    expect(resolved_state.scene?.scene_title).toBe("Cinza Wakes");
  });

  test("uses exact thread+modifier scene when available", () => {
    const resolved_state = resolve_book_view_state(absurd_faith_timeline, {
      chapter_id: "af_001",
      thread_key: "cinza",
      thread_modifier: "memory",
    });

    expect(resolved_state.resolved_thread_key).toBe("cinza");
    expect(resolved_state.resolved_thread_modifier).toBe("memory");
    expect(resolved_state.scene?.scene_title).toBe("Cinza Memory Echo");
  });

  test("falls back to same thread core before cinza/core", () => {
    const resolved_state = resolve_book_view_state(absurd_faith_timeline, {
      chapter_id: "af_000",
      thread_key: "suul",
      thread_modifier: "memory",
    });

    expect(resolved_state.requested_thread_key).toBe("suul");
    expect(resolved_state.requested_thread_modifier).toBe("core");
    expect(resolved_state.resolved_thread_key).toBe("suul");
    expect(resolved_state.resolved_thread_modifier).toBe("core");
    expect(resolved_state.scene?.scene_title).toBe("Suul Watches");
  });

  test("falls back to cinza/core when requested thread has no chapter scene", () => {
    const resolved_state = resolve_book_view_state(absurd_faith_timeline, {
      chapter_id: "af_001",
      thread_key: "suul",
      thread_modifier: "core",
    });

    expect(resolved_state.requested_thread_key).toBe("suul");
    expect(resolved_state.resolved_thread_key).toBe("cinza");
    expect(resolved_state.resolved_thread_modifier).toBe("core");
    expect(resolved_state.scene?.scene_title).toBe("Cinza at the Ledge");
  });

  test("returns deterministic canonical previous and next chapters", () => {
    const resolved_state = resolve_book_view_state(absurd_faith_timeline, {
      chapter_id: "af_001",
      thread_key: "cinza",
      thread_modifier: "core",
    });

    expect(resolved_state.previous_chapter_id).toBe("af_000");
    expect(resolved_state.next_chapter_id).toBe("af_002");
  });

  test("resolves chapter card metadata from chapter defaults", () => {
    const resolved_state = resolve_book_view_state(absurd_faith_timeline, {
      chapter_id: "af_000",
      thread_key: "cinza",
      thread_modifier: "core",
    });

    expect(resolved_state.resolved_chapter_title).toBe("Awakening");
    expect(resolved_state.resolved_chapter_description).toBe(
      "Cinza opens his eyes inside stone silence, with no memory and too much unease.",
    );
    expect(resolved_state.resolved_chapter_snippet).toBe(
      "Morning arrives carefully, as if the world is afraid to startle him.",
    );
  });

  test("applies chapter metadata overrides from resolved thread scene", () => {
    const resolved_state = resolve_book_view_state(absurd_faith_timeline, {
      chapter_id: "af_001",
      thread_key: "alvorada",
      thread_modifier: "core",
    });

    expect(resolved_state.resolved_chapter_title).toBe("Collapse Signatures");
    expect(resolved_state.resolved_chapter_description).toBe(
      "Awe and panic collide as Cinza sees the scale of the world and the depth below.",
    );
    expect(resolved_state.resolved_chapter_snippet).toBe(
      "The mountain is not a place here; it is a warning mapped in light.",
    );
  });
});
