const htmx_module = await import("htmx.org");

const htmx = htmx_module.default;

if (htmx) {
  window.htmx = htmx;

  await import("idiomorph/dist/idiomorph-ext.esm.js");
  await import("htmx.org/dist/ext/head-support.js");
  await import("htmx.org/dist/ext/preload.js");
  await import("htmx.org/dist/ext/sse.js");
}
