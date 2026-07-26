const CITRINITAS_ROUTE_ROOT = "/citrinitas";

const citrinitas_booklet_path = (book_slug = "") => {
  const normalized_slug = String(book_slug).trim().replace(/^\/+|\/+$/g, "");
  return normalized_slug
    ? `${CITRINITAS_ROUTE_ROOT}/${normalized_slug}`
    : CITRINITAS_ROUTE_ROOT;
};

const citrinitas_chapter_path = (book_slug = "", chapter_slug = "") => {
  const booklet_path = citrinitas_booklet_path(book_slug);
  const normalized_chapter_slug = String(chapter_slug)
    .trim()
    .replace(/^\/+|\/+$/g, "");
  return normalized_chapter_slug
    ? `${booklet_path}/${normalized_chapter_slug}`
    : booklet_path;
};

export {
  CITRINITAS_ROUTE_ROOT,
  citrinitas_booklet_path,
  citrinitas_chapter_path,
};
