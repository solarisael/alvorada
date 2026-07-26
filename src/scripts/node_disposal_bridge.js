const NODE_DISPOSAL_API_SYMBOL = Symbol.for("solarisael.node_disposal");

const get_node_disposal_api = () => {
  const node_disposal_api = globalThis[NODE_DISPOSAL_API_SYMBOL];

  if (
    !node_disposal_api ||
    typeof node_disposal_api.register_node_disposal !== "function"
  ) {
    throw new Error("Solarisael node disposal runtime is not installed");
  }

  return node_disposal_api;
};

const register_node_disposal = (root_node, cleanup_callback) =>
  get_node_disposal_api().register_node_disposal(root_node, cleanup_callback);

export { register_node_disposal };
