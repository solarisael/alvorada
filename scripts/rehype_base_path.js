// Vault Markdown cannot call Astro's with_base helper.
// Keep its links and media valid on subpath hosts.
const attribute_with_base = (value, base) => {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return value;
  }
  if (!base || value === base || value.startsWith(`${base}/`)) {
    return value;
  }
  return `${base}${value}`;
};

const rewrite_properties = (properties, base) => {
  for (const name of ["href", "src", "hx-get"]) {
    const previous = properties[name];
    const next = attribute_with_base(previous, base);
    if (next !== previous) {
      properties[name] = next;
    }
  }
};

const rehype_base_path = (base_path = "/") => {
  const normalized_base = String(base_path).replace(/\/+$/, "");

  return (tree) => {
    const visit_node = (node) => {
      if (node?.type === "element" && node.properties) {
        rewrite_properties(node.properties, normalized_base);
      }

      if (Array.isArray(node?.children)) {
        node.children.forEach(visit_node);
      }
    };

    visit_node(tree);
  };
};

export { rehype_base_path };
