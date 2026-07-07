// Rewrites site-root-relative `href`/`src` attributes in rendered markdown
// HTML to include the deployed base subpath.
//
// Why this exists: vault-authored content (codex entries, phase posts) has
// no access to `with_base()` — that's a server-side Astro-component helper,
// and markdown/raw-HTML content is rendered independently of it. An author
// writing `href="/codex/characters/cinza"` or `<img src="/images/x.png">`
// gets a broken link the moment the site deploys under a base subpath
// (GitHub Pages: `/solarisael`) instead of root (Neocities/Nekoweb: `/`).
// Bit us for real 2026-07-02 — a hand-authored codex-entry image and a
// sandbox-page link both 404'd for exactly this reason.
//
// Root-hosted deploys (base === "/") are a no-op here by construction:
// normalized_base ends up "", so nothing gets prepended.
const rehype_base_path = (base_path = "/") => {
  const normalized_base = String(base_path).replace(/\/+$/, "");

  return (tree) => {
    const visit_node = (node) => {
      if (node?.type === "element" && node.properties) {
        for (const attribute_name of ["href", "src"]) {
          const raw_value = node.properties[attribute_name];

          if (typeof raw_value !== "string") {
            continue;
          }

          const is_site_root_relative = raw_value.startsWith("/") && !raw_value.startsWith("//");
          const already_prefixed =
            !normalized_base ||
            raw_value === normalized_base ||
            raw_value.startsWith(`${normalized_base}/`);

          if (is_site_root_relative && !already_prefixed) {
            node.properties[attribute_name] = `${normalized_base}${raw_value}`;
          }
        }
      }

      if (Array.isArray(node?.children)) {
        node.children.forEach(visit_node);
      }
    };

    visit_node(tree);
  };
};

export { rehype_base_path };
