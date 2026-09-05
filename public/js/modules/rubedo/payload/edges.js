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

const resolve_branch_target = (
  branch_edge,
  chapter_index_map,
  row_anchor_nodes,
) => {
  const target_row_index = chapter_index_map.get(branch_edge?.to_chapter_id);
  if (typeof target_row_index !== "number") {
    return null;
  }
  return row_anchor_nodes[target_row_index] ?? null;
};

const create_branch_edge = (
  branch_edge,
  source_anchor,
  target_anchor,
  edge_key,
) => ({
  edge_key,
  condition_label: branch_edge?.condition_label ?? "optional_path",
  x1: source_anchor.x,
  y1: source_anchor.y,
  x2: target_anchor.x,
  y2: target_anchor.y,
});

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
      const target_anchor = resolve_branch_target(
        branch_edge,
        chapter_index_map,
        row_anchor_nodes,
      );
      const source_anchor = row_anchor_nodes[row_index];

      if (!source_anchor || !target_anchor) {
        continue;
      }

      const edge_key = `${source_anchor.chapter_id}:${target_anchor.chapter_id}`;

      if (canonical_edge_key_set.has(edge_key)) {
        continue;
      }

      branch_edges.push(
        create_branch_edge(branch_edge, source_anchor, target_anchor, edge_key),
      );
    }
  }

  return branch_edges;
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

export {
  build_trunk_edges,
  build_canonical_edges_by_thread,
  build_row_connector_edges,
  build_canonical_edge_key_set,
  build_chapter_index_map,
  build_branch_edges,
  flatten_canonical_edges,
};
