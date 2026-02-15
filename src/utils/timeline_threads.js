const default_thread_key = "cinza";
const default_thread_modifier = "core";

const sort_chapters = (chapters = []) => {
  return [...chapters].sort((left_chapter, right_chapter) => {
    return left_chapter.timeline_position - right_chapter.timeline_position;
  });
};

const get_safe_key = (candidate_key, allowed_keys, fallback_key) => {
  if (typeof candidate_key !== "string") {
    return fallback_key;
  }

  const normalized_key = candidate_key.trim().toLowerCase();

  if (!normalized_key) {
    return fallback_key;
  }

  return allowed_keys.includes(normalized_key) ? normalized_key : fallback_key;
};

const build_chapter_map = (book_timeline) => {
  const sorted_chapters = sort_chapters(book_timeline?.chapters ?? []);
  const chapter_map = new Map();

  for (const chapter of sorted_chapters) {
    chapter_map.set(chapter.chapter_id, chapter);
  }

  return {
    chapter_map,
    sorted_chapters,
  };
};

const get_scene_by_thread = (chapter, thread_key, thread_modifier) => {
  const chapter_scenes = Array.isArray(chapter?.scenes) ? chapter.scenes : [];

  return (
    chapter_scenes.find((scene) => {
      return (
        scene.thread_key === thread_key &&
        scene.thread_modifier === thread_modifier
      );
    }) ?? null
  );
};

const resolve_scene_variant = (
  chapter,
  thread_key,
  thread_modifier,
  fallback_thread_key = default_thread_key,
  fallback_thread_modifier = default_thread_modifier,
) => {
  const exact_scene = get_scene_by_thread(chapter, thread_key, thread_modifier);

  if (exact_scene) {
    return {
      scene: exact_scene,
      resolved_thread_key: thread_key,
      resolved_thread_modifier: thread_modifier,
    };
  }

  const thread_core_scene = get_scene_by_thread(
    chapter,
    thread_key,
    fallback_thread_modifier,
  );

  if (thread_core_scene) {
    return {
      scene: thread_core_scene,
      resolved_thread_key: thread_key,
      resolved_thread_modifier: fallback_thread_modifier,
    };
  }

  const fallback_core_scene = get_scene_by_thread(
    chapter,
    fallback_thread_key,
    fallback_thread_modifier,
  );

  if (fallback_core_scene) {
    return {
      scene: fallback_core_scene,
      resolved_thread_key: fallback_thread_key,
      resolved_thread_modifier: fallback_thread_modifier,
    };
  }

  const chapter_scenes = Array.isArray(chapter?.scenes) ? chapter.scenes : [];
  const first_scene = chapter_scenes[0] ?? null;

  if (!first_scene) {
    return {
      scene: null,
      resolved_thread_key: fallback_thread_key,
      resolved_thread_modifier: fallback_thread_modifier,
    };
  }

  return {
    scene: first_scene,
    resolved_thread_key: first_scene.thread_key,
    resolved_thread_modifier: first_scene.thread_modifier,
  };
};

const collect_thread_keys = (book_timeline = null) => {
  const thread_key_set = new Set([default_thread_key]);

  for (const chapter of book_timeline?.chapters ?? []) {
    for (const scene of chapter?.scenes ?? []) {
      if (typeof scene?.thread_key === "string" && scene.thread_key.trim()) {
        thread_key_set.add(scene.thread_key);
      }
    }
  }

  return [...thread_key_set].sort((left_key, right_key) => {
    if (left_key === default_thread_key) {
      return -1;
    }

    if (right_key === default_thread_key) {
      return 1;
    }

    return left_key.localeCompare(right_key);
  });
};

const collect_thread_modifiers_for_chapter = (
  chapter = null,
  thread_key = "",
) => {
  const modifier_set = new Set([default_thread_modifier]);

  for (const scene of chapter?.scenes ?? []) {
    if (scene?.thread_key !== thread_key) {
      continue;
    }

    if (
      typeof scene?.thread_modifier === "string" &&
      scene.thread_modifier.trim()
    ) {
      modifier_set.add(scene.thread_modifier);
    }
  }

  return [...modifier_set].sort((left_modifier, right_modifier) => {
    if (left_modifier === default_thread_modifier) {
      return -1;
    }

    if (right_modifier === default_thread_modifier) {
      return 1;
    }

    return left_modifier.localeCompare(right_modifier);
  });
};

const get_preferred_text = (...candidate_values) => {
  for (const candidate_value of candidate_values) {
    if (typeof candidate_value === "string" && candidate_value.trim()) {
      return candidate_value;
    }
  }

  return null;
};

const resolve_chapter_card_metadata = (
  active_chapter,
  resolved_scene,
  fallback_thread_key = default_thread_key,
  fallback_thread_modifier = default_thread_modifier,
) => {
  const chapter_core_scene = get_scene_by_thread(
    active_chapter,
    fallback_thread_key,
    fallback_thread_modifier,
  );

  const base_chapter_title = get_preferred_text(
    active_chapter?.title,
    chapter_core_scene?.chapter_title,
    active_chapter?.chapter_id,
  );
  const base_chapter_description = get_preferred_text(
    active_chapter?.chapter_description,
    chapter_core_scene?.chapter_description,
  );
  const base_chapter_snippet = get_preferred_text(
    active_chapter?.chapter_snippet,
    chapter_core_scene?.chapter_snippet,
  );

  return {
    resolved_chapter_title: get_preferred_text(
      resolved_scene?.chapter_title_override,
      base_chapter_title,
      active_chapter?.chapter_id,
    ),
    resolved_chapter_description: get_preferred_text(
      resolved_scene?.chapter_description_override,
      base_chapter_description,
    ),
    resolved_chapter_snippet: get_preferred_text(
      resolved_scene?.chapter_snippet_override,
      base_chapter_snippet,
    ),
  };
};

const resolve_book_view_state = (
  book_timeline,
  {
    chapter_id = "",
    thread_key = default_thread_key,
    thread_modifier = default_thread_modifier,
  } = {},
) => {
  const { chapter_map, sorted_chapters } = build_chapter_map(book_timeline);
  const first_chapter = sorted_chapters[0] ?? null;
  const allowed_thread_keys = collect_thread_keys(book_timeline);
  const safe_thread_key = get_safe_key(
    thread_key,
    allowed_thread_keys,
    default_thread_key,
  );
  const safe_chapter_id = chapter_map.has(chapter_id)
    ? chapter_id
    : (first_chapter?.chapter_id ?? "");
  const active_chapter = chapter_map.get(safe_chapter_id) ?? null;
  const modifier_options = collect_thread_modifiers_for_chapter(
    active_chapter,
    safe_thread_key,
  );
  const safe_thread_modifier = get_safe_key(
    thread_modifier,
    modifier_options,
    default_thread_modifier,
  );
  const resolved_scene_variant = resolve_scene_variant(
    active_chapter,
    safe_thread_key,
    safe_thread_modifier,
  );
  const resolved_chapter_card = resolve_chapter_card_metadata(
    active_chapter,
    resolved_scene_variant.scene,
  );
  const chapter_index = sorted_chapters.findIndex((chapter) => {
    return chapter.chapter_id === safe_chapter_id;
  });
  const previous_chapter =
    chapter_index > 0 ? sorted_chapters[chapter_index - 1] : null;
  const next_chapter =
    chapter_index >= 0 && chapter_index < sorted_chapters.length - 1
      ? sorted_chapters[chapter_index + 1]
      : null;

  return {
    chapter_id: safe_chapter_id,
    active_chapter,
    sorted_chapters,
    scene: resolved_scene_variant.scene,
    requested_thread_key: safe_thread_key,
    requested_thread_modifier: safe_thread_modifier,
    resolved_thread_key: resolved_scene_variant.resolved_thread_key,
    resolved_thread_modifier: resolved_scene_variant.resolved_thread_modifier,
    resolved_chapter_title: resolved_chapter_card.resolved_chapter_title,
    resolved_chapter_description:
      resolved_chapter_card.resolved_chapter_description,
    resolved_chapter_snippet: resolved_chapter_card.resolved_chapter_snippet,
    thread_options: allowed_thread_keys,
    modifier_options,
    previous_chapter_id: previous_chapter?.chapter_id ?? null,
    next_chapter_id: next_chapter?.chapter_id ?? null,
  };
};

export {
  collect_thread_keys,
  collect_thread_modifiers_for_chapter,
  default_thread_key,
  default_thread_modifier,
  get_safe_key,
  resolve_book_view_state,
  resolve_scene_variant,
};
