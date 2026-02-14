const split_text_node_with_breaks = (text_value) => {
  const raw_value = String(text_value);

  if (!raw_value.includes("\n")) {
    return [{ type: "text", value: raw_value }];
  }

  const segments = raw_value.split("\n");
  const next_nodes = [];

  segments.forEach((segment_value, segment_index) => {
    if (segment_value.length) {
      next_nodes.push({ type: "text", value: segment_value });
    }

    if (segment_index < segments.length - 1) {
      next_nodes.push({ type: "break" });
    }
  });

  return next_nodes.length ? next_nodes : [{ type: "text", value: "" }];
};

const transform_soft_breaks_in_tree = (tree_node) => {
  if (!tree_node || !Array.isArray(tree_node.children)) {
    return;
  }

  const next_children = [];

  for (const child_node of tree_node.children) {
    if (child_node?.type === "text" && typeof child_node.value === "string") {
      next_children.push(...split_text_node_with_breaks(child_node.value));
      continue;
    }

    next_children.push(child_node);
  }

  tree_node.children = next_children;

  for (const child_node of tree_node.children) {
    transform_soft_breaks_in_tree(child_node);
  }
};

const remark_soft_breaks = () => {
  return (tree) => {
    transform_soft_breaks_in_tree(tree);
  };
};

export { remark_soft_breaks, transform_soft_breaks_in_tree };
