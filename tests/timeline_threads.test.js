import { describe, expect, test } from "bun:test";

import { rubedo_book_map } from "../src/data/rubedo/book_timeline.js";
import {
  default_thread_key,
  default_thread_modifier,
  resolve_book_view_state,
} from "../src/utils/timeline_threads.js";

const absurd_faith_timeline = rubedo_book_map["absurd-faith"];

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
});
