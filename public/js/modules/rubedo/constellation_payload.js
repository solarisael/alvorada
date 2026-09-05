import {
  build_side_lane_x_map,
  build_row_entries,
  build_row_anchor_nodes,
  build_real_nodes,
  build_canvas_nodes,
} from "./payload/nodes.js";
import {
  build_trunk_edges,
  build_canonical_edges_by_thread,
  build_row_connector_edges,
  build_canonical_edge_key_set,
  build_chapter_index_map,
  build_branch_edges,
  flatten_canonical_edges,
} from "./payload/edges.js";
import {
  RUBEDO_CONSTELLATION_LAYOUT,
  RUBEDO_CONSTELLATION_THREADS,
} from "./constellation_config.js";

const empty_constellation_payload = Object.freeze({
  viewbox_width: 100,
  viewbox_height: 44,
  active_chapter_id: "",
  active_thread_key: "cinza",
  nodes: Object.freeze([]),
  edges: Object.freeze({
    branch: Object.freeze([]),
    trunk: Object.freeze([]),
    connectors: Object.freeze([]),
    canonical: Object.freeze([]),
  }),
});

const sort_chapters = (chapters = []) => {
  return [...chapters].sort((left_chapter, right_chapter) => {
    return left_chapter.timeline_position - right_chapter.timeline_position;
  });
};

const resolve_active_chapter = (chapters, active_chapter_slug) => {
  for (const chapter_entry of chapters) {
    if (chapter_entry.chapter_slug === active_chapter_slug) {
      return chapter_entry;
    }
  }

  return chapters[0] ?? null;
};

const collect_map_thread_keys = (chapters) => {
  const thread_key_set = new Set(RUBEDO_CONSTELLATION_THREADS.default_keys);

  for (const chapter_entry of chapters) {
    for (const thread_key of chapter_entry.thread_keys ?? []) {
      if (typeof thread_key === "string" && thread_key.trim()) {
        thread_key_set.add(thread_key);
      }
    }
  }

  const map_thread_keys = [...RUBEDO_CONSTELLATION_THREADS.default_keys];

  const extra_thread_keys = [...thread_key_set].filter((thread_key) => {
    return !RUBEDO_CONSTELLATION_THREADS.default_keys.includes(thread_key);
  });

  extra_thread_keys.sort((left_key, right_key) => {
    return left_key.localeCompare(right_key);
  });

  return [...map_thread_keys, ...extra_thread_keys];
};

const build_constellation_payload_from_json = (
  book_data,
  base_path,
  active_chapter_slug,
) => {
  if (!book_data || !Array.isArray(book_data.chapters)) {
    return empty_constellation_payload;
  }

  const chapters = sort_chapters(book_data.chapters);
  const active_chapter = resolve_active_chapter(chapters, active_chapter_slug);
  const map_thread_keys = collect_map_thread_keys(chapters);
  const side_thread_keys = map_thread_keys.filter(
    (thread_key) => thread_key !== "cinza",
  );

  const side_lane_x_map = build_side_lane_x_map(side_thread_keys);
  const row_entries = build_row_entries(chapters);
  const viewbox_height = Math.max(
    44,
    RUBEDO_CONSTELLATION_LAYOUT.base_y +
      row_entries.length * RUBEDO_CONSTELLATION_LAYOUT.vertical_step +
      10,
  );
  const row_anchor_nodes = build_row_anchor_nodes(row_entries);
  const real_nodes = build_real_nodes(row_entries, side_lane_x_map);
  const trunk_edges = build_trunk_edges(row_anchor_nodes);
  const canonical_edges_by_thread = build_canonical_edges_by_thread(
    side_thread_keys,
    real_nodes,
  );
  const row_connector_edges = build_row_connector_edges(
    real_nodes,
    row_anchor_nodes,
  );
  const canonical_edge_key_set = build_canonical_edge_key_set(
    trunk_edges,
    canonical_edges_by_thread,
  );
  const chapter_index_map = build_chapter_index_map(row_entries);
  const branch_edges = build_branch_edges({
    row_entries,
    row_anchor_nodes,
    chapter_index_map,
    canonical_edge_key_set,
  });
  const all_nodes = row_anchor_nodes.filter(
    (node) => node.node_kind === "phantom",
  );
  for (const node_entry of real_nodes) {
    all_nodes.push(node_entry);
  }

  return {
    viewbox_width: 100,
    viewbox_height,
    active_chapter_id: active_chapter?.chapter_id ?? "",
    active_thread_key: "cinza",
    nodes: build_canvas_nodes({
      all_nodes,
      base_path,
      book_slug: book_data.book_slug,
    }),
    edges: {
      branch: branch_edges,
      trunk: trunk_edges,
      connectors: row_connector_edges,
      canonical: flatten_canonical_edges(canonical_edges_by_thread),
    },
  };
};

export { build_constellation_payload_from_json, empty_constellation_payload };
