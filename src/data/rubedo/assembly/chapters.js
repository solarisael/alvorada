import { build_scene } from "./scenes.js";
const get_or_create_book = (books, { book_slug, frontmatter }) => {
  if (!books.has(book_slug))
    books.set(book_slug, {
      book_slug,
      title: frontmatter.book_title ?? null,
      synopsis: frontmatter.book_synopsis ?? null,
      chapter_map: new Map(),
    });
  return books.get(book_slug);
};
const get_or_create_chapter = (
  book,
  { chapter_id, timeline_position, frontmatter },
) => {
  if (!book.chapter_map.has(chapter_id))
    book.chapter_map.set(chapter_id, {
      chapter_id,
      timeline_position,
      title: frontmatter.chapter_title ?? null,
      chapter_description: frontmatter.chapter_description ?? null,
      sol__chapter_snippet: frontmatter.sol__chapter_snippet ?? null,
      branch_edges: frontmatter.branch_edges ?? [],
      scenes: [],
    });
  return book.chapter_map.get(chapter_id);
};
const fill_chapter_text = (chapter, field, value) => {
  if (chapter[field] == null && value) chapter[field] = value;
};
const merge_chapter_metadata = (chapter, frontmatter) => {
  fill_chapter_text(chapter, "title", frontmatter.chapter_title);
  fill_chapter_text(
    chapter,
    "chapter_description",
    frontmatter.chapter_description,
  );
  fill_chapter_text(
    chapter,
    "sol__chapter_snippet",
    frontmatter.sol__chapter_snippet,
  );
  if (
    Array.isArray(frontmatter.branch_edges) &&
    frontmatter.branch_edges.length > 0
  ) {
    chapter.branch_edges = frontmatter.branch_edges;
  }
};
const append_scene_record = (books, record) => {
  const book = get_or_create_book(books, record);
  const chapter = get_or_create_chapter(book, record);
  merge_chapter_metadata(chapter, record.frontmatter);
  chapter.timeline_position = record.timeline_position;
  chapter.scenes.push(build_scene(record));
};
export { append_scene_record };
