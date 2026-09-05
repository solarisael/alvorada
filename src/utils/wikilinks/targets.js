import {
  parse_tag_identity,
  validate_scene_identity_consistency,
} from "../../data/rubedo/scene_identity.js";
import {
  parse_simple_frontmatter,
  clamp_excerpt,
  extract_first_paragraph,
  titlecase_filename_stem,
} from "./frontmatter.js";
import { build_url_for_target } from "./routes.js";
const trimmed_text = (value) => {
  if (typeof value !== "string") return null;
  return value.trim() || null;
};
const first_text = (frontmatter, fields) => {
  for (const field of fields) {
    const value = trimmed_text(frontmatter[field]);
    if (value) return value;
  }
  return null;
};
const has_public_identity = (source, frontmatter) => {
  if (source.url_strategy !== "rubedo_scene") return true;
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  return validate_scene_identity_consistency({
    frontmatter,
    parsed_tag_identity: parse_tag_identity(tags),
  }).is_valid;
};
const target_aliases = (frontmatter) => {
  if (!Array.isArray(frontmatter.aliases)) return [];
  return frontmatter.aliases.filter(
    (alias) => typeof alias === "string" && alias.trim(),
  );
};
const target_title = (frontmatter, file_stem) => {
  return (
    first_text(frontmatter, [
      "title",
      "scene_title",
      "chapter_title",
      "book_title",
      "slug",
      "chapter_id",
      "book_slug",
    ]) ?? titlecase_filename_stem(file_stem)
  );
};
const target_excerpt = (frontmatter, raw_body) => {
  return clamp_excerpt(
    first_text(frontmatter, [
      "excerpt",
      "scene_excerpt",
      "chapter_excerpt",
      "book_synopsis",
      "summary",
    ]) || extract_first_paragraph(raw_body),
  );
};
const build_target = (source, file) => {
  const frontmatter = parse_simple_frontmatter(file.raw_body) || {};
  if (!has_public_identity(source, frontmatter)) return null;
  const url = build_url_for_target({ ...source, ...file, frontmatter });
  if (!url) return null;
  const target = Object.freeze({
    url,
    title: target_title(frontmatter, file.file_stem),
    excerpt: target_excerpt(frontmatter, file.raw_body),
    phase: source.phase,
    source_path: file.file_path,
    file_stem: file.file_stem,
    slug: trimmed_text(frontmatter.slug),
    aliases: Object.freeze([...target_aliases(frontmatter)]),
  });
  return {
    target,
    chapter_id: trimmed_text(frontmatter.chapter_id),
    book_slug: trimmed_text(frontmatter.book_slug),
  };
};
export { build_target };
