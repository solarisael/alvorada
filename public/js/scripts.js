import "./modules/style_switcher.js";
import "./modules/text_effects.js";

const load_optional_dependency = async (dependency_path) => {
  try {
    await import(dependency_path);
  } catch (error) {
    console.warn(
      `[scripts] Optional dependency failed: ${dependency_path}`,
      error,
    );
  }
};

await load_optional_dependency("/js/vendor/htmx.esm.js");
await load_optional_dependency("/js/vendor/idiomorph-ext.js");
// import "../@splidejs/splide";
