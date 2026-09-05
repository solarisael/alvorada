import {
  dispose_removed_root,
  register_node_disposal,
} from "../node_disposal.js";

const live_bindings = new Map();

const retire_disconnected_constellations = () => {
  for (const root_node of live_bindings.keys()) {
    dispose_removed_root(root_node);
  }
};

const claim_constellation = (root_node) => {
  if (
    !(root_node instanceof HTMLElement) ||
    !root_node.isConnected ||
    live_bindings.has(root_node)
  ) {
    return null;
  }
  const controller = new AbortController();
  let renderer = null;
  let unregister;
  const dispose = () => {
    if (controller.signal.aborted) {
      return;
    }
    controller.abort();
    renderer?.dispose();
    unregister();
    live_bindings.delete(root_node);
  };
  const is_active = () => {
    if (!root_node.isConnected) {
      dispose();
    }
    return !controller.signal.aborted;
  };
  const binding = {
    signal: controller.signal,
    dispose,
    is_active,
    set_renderer: (next_renderer) => {
      renderer = next_renderer;
    },
  };
  live_bindings.set(root_node, binding);
  unregister = register_node_disposal(root_node, dispose);
  return binding;
};
export { claim_constellation, retire_disconnected_constellations };
