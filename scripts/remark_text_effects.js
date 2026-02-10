import { transform_text_fx_markers_in_tree } from "../src/utils/text_effects_markdown.js";

const remark_text_effects = () => {
  return (tree) => {
    transform_text_fx_markers_in_tree(tree);
  };
};

export { remark_text_effects };
