import { derive_chapter_slug } from "../chapter_slug.js";
import { read_scene_record } from "./scenes.js";
import { append_scene_record } from "./chapters.js";
const get_default_book_title = (book_slug = "") => {
  return String(book_slug)
    .split("-")
    .filter(Boolean)
    .map((slug_part) => {
      return `${slug_part[0]?.toUpperCase() ?? ""}${slug_part.slice(1)}`;
    })
    .join(" ");
};
const freeze_book_map = (markdown_book_accumulator) => {
  const markdown_book_map = {};

  for (const [book_slug, book_entry] of markdown_book_accumulator.entries()) {
    const chapters = [...book_entry.chapter_map.values()]
      .sort((left_chapter, right_chapter) => {
        return left_chapter.timeline_position - right_chapter.timeline_position;
      })
      .map((chapter) => {
        return {
          chapter_id: chapter.chapter_id,
          // Slug baked once here (the chapters are already sorted), so
          // consumers read chapter.chapter_slug instead of re-deriving it at
          // every callsite — mirrors the shared book/ core.
          chapter_slug: derive_chapter_slug(chapter.timeline_position),
          timeline_position: chapter.timeline_position,
          title: chapter.title,
          chapter_description: chapter.chapter_description,
          sol__chapter_snippet: chapter.sol__chapter_snippet,
          branch_edges: Object.freeze([...(chapter.branch_edges ?? [])]),
          scenes: Object.freeze([...chapter.scenes]),
        };
      });

    markdown_book_map[book_slug] = Object.freeze({
      book_slug,
      title: book_entry.title ?? get_default_book_title(book_slug),
      synopsis: book_entry.synopsis ?? "",
      chapters: Object.freeze(chapters),
    });
  }

  return markdown_book_map;
};
const build_markdown_book_map = (scene_module_map) => {
  const books = new Map();
  for (const [scene_file, scene_module] of Object.entries(scene_module_map)) {
    const record = read_scene_record(scene_file, scene_module);
    if (record) append_scene_record(books, record);
  }
  return freeze_book_map(books);
};
export { build_markdown_book_map };
