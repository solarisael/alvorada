const create_input_lifetime = (root_node, parent_signal, cleanup) => {
  const controller = new AbortController();
  const dispose = () => {
    if (controller.signal.aborted) {
      return;
    }
    controller.abort();
    parent_signal?.removeEventListener("abort", dispose);
    cleanup();
  };
  const is_active = () => {
    if (!root_node.isConnected) {
      dispose();
    }
    return !controller.signal.aborted;
  };
  const listen = (target, event_name, callback, options) => {
    target.addEventListener(
      event_name,
      (event) => {
        if (is_active()) {
          callback(event);
        }
      },
      { ...options, signal: controller.signal },
    );
  };
  parent_signal?.addEventListener("abort", dispose, { once: true });
  if (parent_signal?.aborted) {
    dispose();
  }
  return { dispose, is_active, listen, signal: controller.signal };
};

export { create_input_lifetime };
