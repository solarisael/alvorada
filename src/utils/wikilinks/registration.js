const register_key = ({ map, key, target, conflicts, key_kind }) => {
  const normalized = String(key || "")
    .trim()
    .toLowerCase();
  if (!normalized) {
    return;
  }
  const existing = map.get(normalized);
  if (existing && existing.source_path !== target.source_path) {
    conflicts.push({
      lookup_key: normalized,
      key_kind,
      first: existing.source_path,
      second: target.source_path,
    });
    return;
  }
  map.set(normalized, target);
};
const register_distinct_key = (state, target, key, key_kind) => {
  if (key && key.toLowerCase() !== target.file_stem.toLowerCase()) {
    register_key({ ...state, target, key, key_kind });
  }
};
const register_target = (state, source, record) => {
  const { target, chapter_id, book_slug } = record;
  const is_booklet_meta =
    source.url_strategy === "citrinitas_booklet" && !chapter_id;
  if (!is_booklet_meta)
    register_key({
      ...state,
      target,
      key: target.file_stem,
      key_kind: "filename",
    });
  if (is_booklet_meta && book_slug)
    register_key({
      ...state,
      target,
      key: book_slug,
      key_kind: "booklet_slug",
    });
  register_distinct_key(state, target, target.slug, "slug");
  register_distinct_key(state, target, chapter_id, "chapter_id");
  for (const alias of target.aliases)
    register_key({ ...state, target, key: alias, key_kind: "alias" });
};
const reject_conflicts = (conflicts) => {
  if (conflicts.length) {
    const lines = conflicts.map(
      (c) =>
        `  • "${c.lookup_key}" (via ${c.key_kind}) — ${c.first}\n                                   ${c.second}`,
    );
    throw new Error(
      "[wikilink_registry] Duplicate lookup keys detected — obsidian's `[[name]]` " +
        "resolution requires unique filenames, slugs, chapter ids, and aliases. Rename one of " +
        "each pair to disambiguate:\n" +
        lines.join("\n"),
    );
  }
};
export { register_target, reject_conflicts };
