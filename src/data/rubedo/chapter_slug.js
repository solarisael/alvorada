// Pure chapter-slug derivation — no vault glob, no Vite. Lives apart from
// book_timeline_runtime.js (which welds import.meta.glob at module load) so
// this logic is importable and unit-testable under Bun without the build.
//
// Position 0 -> "000", 1 -> "001", 42 -> "042", 100 -> "100", 1000 -> "1000".
// Minimum 3 digits; floored and clamped to zero. Purely numeric and stable
// regardless of title changes.
const derive_chapter_slug = (timeline_position = 0) =>
  String(Math.max(0, Math.floor(timeline_position))).padStart(3, "0");

export { derive_chapter_slug };
