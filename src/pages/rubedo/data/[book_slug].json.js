import {
  rubedo_book_json_map,
  rubedo_book_slugs,
} from "../../../data/rubedo/book_timeline_runtime.js";

export const getStaticPaths = () => {
  return rubedo_book_slugs.map((book_slug) => {
    return {
      params: {
        book_slug,
      },
    };
  });
};

export const GET = ({ params }) => {
  const book_slug = params?.book_slug ?? "";
  const payload = rubedo_book_json_map[book_slug] ?? null;

  if (!payload) {
    return new Response(
      JSON.stringify({
        error: "book_not_found",
        book_slug,
      }),
      {
        status: 404,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=0, must-revalidate",
        },
      },
    );
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
};
