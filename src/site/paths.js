const base_path = import.meta.env.BASE_URL.replace(/\/+$/, "");

const with_base = (path_value = "") => {
  const normalized_path = String(path_value).replace(/^\/+/, "");
  return normalized_path ? `${base_path}/${normalized_path}` : `${base_path}/`;
};

export { with_base };
