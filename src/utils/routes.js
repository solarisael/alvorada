const base_path = import.meta.env.BASE_URL.replace(/\/+$/, "");

const with_base = (path_value = "") => {
  const normalized_path = String(path_value).replace(/^\/+/, "");

  if (!normalized_path) {
    return `${base_path}/`;
  }

  return `${base_path}/${normalized_path}`;
};

const content_link_attrs = (href) => {
  return {
    href,
    hx_get: href,
    hx_target: "#sol_content",
    hx_select: "#sol_content",
    hx_swap: "morph swap:160ms settle:160ms",
  };
};

export { base_path, content_link_attrs, with_base };
