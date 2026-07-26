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

  const map_thread_keys = [];

  for (const thread_key of RUBEDO_CONSTELLATION_THREADS.default_keys) {
    if (thread_key_set.has(thread_key)) {
      map_thread_keys.push(thread_key);
    }
  }

  const extra_thread_keys = [];

  for (const thread_key of thread_key_set) {
    if (!RUBEDO_CONSTELLATION_THREADS.default_keys.includes(thread_key)) {
      extra_thread_keys.push(thread_key);
    }
  }

  extra_thread_keys.sort((left_key, right_key) => {
    return left_key.localeCompare(right_key);
  });

  return [...map_thread_keys, ...extra_thread_keys];
};

const build_side_lane_x_map = (side_thread_keys) => {
  const side_lane_x_map = new Map();

  for (
    let side_index = 0;
    side_index < side_thread_keys.length;
    side_index += 1
  ) {
    const thread_key = side_thread_keys[side_index];
    const lane_rank = Math.floor(side_index / 2) + 1;
    const lane_direction = side_index % 2 === 0 ? -1 : 1;
    const lane_x =
      RUBEDO_CONSTELLATION_LAYOUT.center_x +
      lane_direction * lane_rank * RUBEDO_CONSTELLATION_LAYOUT.side_lane_step;

    side_lane_x_map.set(thread_key, lane_x);
  }

  return side_lane_x_map;
};

const build_row_entries = (chapters) => {
  const row_entries = [];

  for (let row_index = 0; row_index < chapters.length; row_index += 1) {
    const chapter_entry = chapters[row_index];
    const thread_key_set = new Set(chapter_entry.thread_keys ?? []);

    row_entries.push({
      chapter: chapter_entry,
      row_index,
      row_y:
        RUBEDO_CONSTELLATION_LAYOUT.base_y +
        row_index * RUBEDO_CONSTELLATION_LAYOUT.vertical_step,
      has_cinza: thread_key_set.has("cinza"),
      thread_keys: [...thread_key_set],
    });
  }

  return row_entries;
};

const build_row_anchor_nodes = (row_entries) => {
  const row_anchor_nodes = [];

  for (const row_entry of row_entries) {
    row_anchor_nodes.push({
      node_id: row_entry.has_cinza
        ? `${row_entry.chapter.chapter_id}:cinza`
        : `${row_entry.chapter.chapter_id}:cinza:phantom`,
      chapter_id: row_entry.chapter.chapter_id,
      chapter_slug: row_entry.chapter.chapter_slug,
      thread_key: "cinza",
      node_kind: row_entry.has_cinza ? "real" : "phantom",
      x: RUBEDO_CONSTELLATION_LAYOUT.center_x,
      y: row_entry.row_y,
      row_index: row_entry.row_index,
      timeline_position: row_entry.chapter.timeline_position,
    });
  }

  return row_anchor_nodes;
};

const build_real_nodes = (row_entries, side_lane_x_map) => {
  const real_nodes = [];

  for (const row_entry of row_entries) {
    for (const thread_key of row_entry.thread_keys) {
      const lane_x =
        thread_key === "cinza"
          ? RUBEDO_CONSTELLATION_LAYOUT.center_x
          : (side_lane_x_map.get(thread_key) ??
            RUBEDO_CONSTELLATION_LAYOUT.center_x);
      const lane_y =
        thread_key === "cinza"
          ? row_entry.row_y
          : row_entry.row_y + RUBEDO_CONSTELLATION_LAYOUT.side_lane_y_nudge;

      real_nodes.push({
        node_id: `${row_entry.chapter.chapter_id}:${thread_key}`,
        chapter_id: row_entry.chapter.chapter_id,
        chapter_slug: row_entry.chapter.chapter_slug,
        thread_key,
        node_kind: "real",
        x: lane_x,
        y: lane_y,
        row_index: row_entry.row_index,
        timeline_position: row_entry.chapter.timeline_position,
      });
    }
  }

  return real_nodes;
};

const build_trunk_edges = (row_anchor_nodes) => {
  const trunk_edges = [];

  for (
    let row_index = 0;
    row_index < row_anchor_nodes.length - 1;
    row_index += 1
  ) {
    const anchor_node = row_anchor_nodes[row_index];
    const next_anchor_node = row_anchor_nodes[row_index + 1];

    trunk_edges.push({
      edge_key: `${anchor_node.node_id}->${next_anchor_node.node_id}`,
      from_node_id: anchor_node.node_id,
      to_node_id: next_anchor_node.node_id,
      from_chapter_id: anchor_node.chapter_id,
      to_chapter_id: next_anchor_node.chapter_id,
      x1: anchor_node.x,
      y1: anchor_node.y,
      x2: next_anchor_node.x,
      y2: next_anchor_node.y,
    });
  }

  return trunk_edges;
};

const build_canonical_edges_by_thread = (side_thread_keys, real_nodes) => {
  const canonical_edges_by_thread = [];

  for (const thread_key of side_thread_keys) {
    const thread_nodes = [];

    for (const node_entry of real_nodes) {
      if (node_entry.thread_key === thread_key) {
        thread_nodes.push(node_entry);
      }
    }

    const edges = [];

    for (
      let node_index = 0;
      node_index < thread_nodes.length - 1;
      node_index += 1
    ) {
      const thread_node = thread_nodes[node_index];
      const next_node = thread_nodes[node_index + 1];

      edges.push({
        edge_key: `${thread_node.node_id}->${next_node.node_id}`,
        thread_key,
        from_chapter_id: thread_node.chapter_id,
        to_chapter_id: next_node.chapter_id,
        x1: thread_node.x,
        y1: thread_node.y,
        x2: next_node.x,
        y2: next_node.y,
      });
    }

    canonical_edges_by_thread.push({ thread_key, edges });
  }

  return canonical_edges_by_thread;
};

const build_row_connector_edges = (real_nodes, row_anchor_nodes) => {
  const row_connector_edges = [];

  for (const node_entry of real_nodes) {
    if (node_entry.thread_key === "cinza") {
      continue;
    }

    const anchor_node = row_anchor_nodes[node_entry.row_index] ?? null;

    if (!anchor_node) {
      continue;
    }

    row_connector_edges.push({
      edge_key: `${anchor_node.node_id}->${node_entry.node_id}`,
      thread_key: node_entry.thread_key,
      x1: anchor_node.x,
      y1: anchor_node.y,
      x2: node_entry.x,
      y2: node_entry.y,
    });
  }

  return row_connector_edges;
};

const build_canonical_edge_key_set = (
  trunk_edges,
  canonical_edges_by_thread,
) => {
  const canonical_edge_key_set = new Set();

  for (const edge_entry of trunk_edges) {
    canonical_edge_key_set.add(
      `${edge_entry.from_chapter_id}:${edge_entry.to_chapter_id}`,
    );
  }

  for (const thread_entry of canonical_edges_by_thread) {
    for (const edge_entry of thread_entry.edges) {
      canonical_edge_key_set.add(
        `${edge_entry.from_chapter_id}:${edge_entry.to_chapter_id}`,
      );
    }
  }

  return canonical_edge_key_set;
};

const build_chapter_index_map = (row_entries) => {
  const chapter_index_map = new Map();

  for (const row_entry of row_entries) {
    chapter_index_map.set(row_entry.chapter.chapter_id, row_entry.row_index);
  }

  return chapter_index_map;
};

const build_branch_edges = ({
  row_entries,
  row_anchor_nodes,
  chapter_index_map,
  canonical_edge_key_set,
}) => {
  const branch_edges = [];

  for (let row_index = 0; row_index < row_entries.length; row_index += 1) {
    const row_entry = row_entries[row_index];

    for (const branch_edge of row_entry.chapter.branch_edges ?? []) {
      const target_row_index = chapter_index_map.get(
        branch_edge?.to_chapter_id,
      );

      if (typeof target_row_index !== "number") {
        continue;
      }

      const source_anchor = row_anchor_nodes[row_index] ?? null;
      const target_anchor = row_anchor_nodes[target_row_index] ?? null;

      if (!source_anchor || !target_anchor) {
        continue;
      }

      const edge_key = `${source_anchor.chapter_id}:${target_anchor.chapter_id}`;

      if (canonical_edge_key_set.has(edge_key)) {
        continue;
      }

      branch_edges.push({
        edge_key,
        condition_label: branch_edge?.condition_label ?? "optional_path",
        x1: source_anchor.x,
        y1: source_anchor.y,
        x2: target_anchor.x,
        y2: target_anchor.y,
      });
    }
  }

  return branch_edges;
};

const build_canvas_nodes = ({ all_nodes, base_path, book_slug }) => {
  const canvas_nodes = [];

  for (const node_entry of all_nodes) {
    const is_clickable = node_entry.node_kind === "real";
    const core_radius = node_entry.thread_key === "cinza" ? 2.7 : 1.95;
    const highlight_radius = core_radius + 0.22;
    const halo_radius = highlight_radius + 0.04;
    const neon_rgb =
      RUBEDO_CONSTELLATION_THREADS.neon_rgb[node_entry.thread_key] ??
      "214 217 226";
    const trail_rotation =
      RUBEDO_CONSTELLATION_THREADS.trail_rotation[node_entry.thread_key] ?? 18;
    const image_src_rel =
      RUBEDO_CONSTELLATION_THREADS.image_src[node_entry.thread_key] ?? null;
    const image_src = image_src_rel ? `${base_path}${image_src_rel}` : null;

    if (!is_clickable) {
      canvas_nodes.push({
        ...node_entry,
        is_clickable: false,
        link: null,
        image_src: null,
        neon_rgb,
        trail_rotation,
        core_radius: 2,
        highlight_radius: 2.2,
        halo_radius: 2.34,
        label: node_entry.chapter_id,
        hover_preview: null,
      });
      continue;
    }

    const chapter_href = `${base_path}/rubedo/${book_slug}/${node_entry.chapter_slug}`;

    canvas_nodes.push({
      ...node_entry,
      is_clickable: true,
      link: {
        href: chapter_href,
        hx_get: chapter_href,
        hx_target: "#sol_content",
        hx_select: "#sol_content",
        hx_swap: "morph swap:220ms settle:260ms",
        hx_push_url: "true",
      },
      hover_preview: null,
      image_src,
      neon_rgb,
      trail_rotation,
      core_radius,
      highlight_radius,
      halo_radius,
      label: node_entry.chapter_id,
    });
  }

  return canvas_nodes;
};

const flatten_canonical_edges = (canonical_edges_by_thread) => {
  const canonical_edges = [];

  for (const thread_entry of canonical_edges_by_thread) {
    for (const edge_entry of thread_entry.edges) {
      canonical_edges.push({
        ...edge_entry,
        thread_key: thread_entry.thread_key,
      });
    }
  }

  return canonical_edges;
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
  const side_thread_keys = [];

  for (const thread_key of map_thread_keys) {
    if (thread_key !== "cinza") {
      side_thread_keys.push(thread_key);
    }
  }

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
  const all_nodes = [];

  for (const anchor_node of row_anchor_nodes) {
    if (anchor_node.node_kind === "phantom") {
      all_nodes.push(anchor_node);
    }
  }

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
