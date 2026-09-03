const base_path = import.meta.env.BASE_URL.replace(/\/+$/, "");

export const with_base = (path_value = ""): string => {
  const normalized_path = path_value.replace(/^\/+/, "");
  return normalized_path ? `${base_path}/${normalized_path}` : `${base_path}/`;
};

